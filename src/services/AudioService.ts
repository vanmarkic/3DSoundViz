/**
 * AudioService - Advanced audio analysis with multichannel support
 * Handles Web Audio API, FFT analysis, beat detection, and feature extraction
 */

import { eventBus } from '@core/EventBus'
import type {
  AudioConfig,
  AudioData,
  FrequencyBands,
  BeatData,
  SpectralData,
  Disposable
} from '@core/types'

export class AudioService implements Disposable {
  private audioContext: AudioContext | null = null
  private analyserNodes: AnalyserNode[] = []
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private splitterNode: ChannelSplitterNode | null = null
  private stream: MediaStream | null = null

  private config: AudioConfig = {
    deviceId: 'default',
    channelCount: 2,
    sampleRate: 48000,
    fftSize: 2048,
    smoothingTimeConstant: 0.8
  }

  private frequencyBuffers: Uint8Array[] = []
  private timeBuffers: Uint8Array[] = []

  // Beat detection state
  private energyHistory: number[] = []
  private readonly ENERGY_HISTORY_SIZE = 43 // ~1 second at 60fps
  private lastBeatTime = 0
  private readonly MIN_BEAT_INTERVAL = 300 // ms

  private isInitialized = false
  private animationFrameId: number | null = null

  /**
   * Initialize audio system
   */
  async initialize(config?: Partial<AudioConfig>): Promise<void> {
    if (this.isInitialized) {
      console.warn('AudioService already initialized')
      return
    }

    if (config) {
      this.config = { ...this.config, ...config }
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.config.deviceId !== 'default'
            ? { exact: this.config.deviceId }
            : undefined,
          channelCount: { ideal: this.config.channelCount },
          sampleRate: { ideal: this.config.sampleRate },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate
      })

      // Create source from stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)

      // Get actual channel count from stream
      const actualChannels = this.stream.getAudioTracks()[0].getSettings().channelCount || 2
      this.config.channelCount = actualChannels

      // Create channel splitter
      this.splitterNode = this.audioContext.createChannelSplitter(actualChannels)
      this.sourceNode.connect(this.splitterNode)

      // Create analyser for each channel
      for (let i = 0; i < actualChannels; i++) {
        const analyser = this.audioContext.createAnalyser()
        analyser.fftSize = this.config.fftSize
        analyser.smoothingTimeConstant = this.config.smoothingTimeConstant

        this.splitterNode.connect(analyser, i)
        this.analyserNodes.push(analyser)

        // Create buffers
        const bufferLength = analyser.frequencyBinCount
        this.frequencyBuffers.push(new Uint8Array(bufferLength))
        this.timeBuffers.push(new Uint8Array(bufferLength))
      }

      this.isInitialized = true

      eventBus.emit('audio:initialized', this.config)
      console.log(`AudioService initialized: ${actualChannels} channels, ${this.config.fftSize} FFT size`)

      // Start analysis loop
      this.startAnalysis()

    } catch (error) {
      const err = error as Error
      console.error('Failed to initialize AudioService:', err)
      eventBus.emit('audio:error', err)
      throw err
    }
  }

  /**
   * Start continuous audio analysis loop
   */
  private startAnalysis(): void {
    const analyze = () => {
      if (!this.isInitialized) return

      const audioData = this.getAudioData()
      eventBus.emit('audio:data', audioData)

      // Emit beat events
      if (audioData.beat.detected) {
        eventBus.emit('audio:beat', audioData.beat)
      }

      this.animationFrameId = requestAnimationFrame(analyze)
    }

    analyze()
  }

  /**
   * Get complete audio data for all channels
   */
  private getAudioData(): AudioData {
    const frequencyData: Float32Array[] = []
    const timeDomainData: Float32Array[] = []
    const rms: number[] = []
    const peak: number[] = []
    const bands: FrequencyBands[] = []

    // Analyze each channel
    for (let i = 0; i < this.analyserNodes.length; i++) {
      const analyser = this.analyserNodes[i]
      const freqBuffer = this.frequencyBuffers[i]
      const timeBuffer = this.timeBuffers[i]

      // Get raw data
      analyser.getByteFrequencyData(freqBuffer as any)
      analyser.getByteTimeDomainData(timeBuffer as any)

      // Convert to Float32Array (normalized 0-1)
      const freqFloat = new Float32Array(freqBuffer.length)
      const timeFloat = new Float32Array(timeBuffer.length)

      for (let j = 0; j < freqBuffer.length; j++) {
        freqFloat[j] = freqBuffer[j] / 255
        timeFloat[j] = (timeBuffer[j] / 255) * 2 - 1 // -1 to 1
      }

      frequencyData.push(freqFloat)
      timeDomainData.push(timeFloat)

      // Calculate RMS
      rms.push(this.calculateRMS(timeFloat))

      // Calculate peak
      peak.push(this.calculatePeak(freqFloat))

      // Extract frequency bands
      bands.push(this.extractFrequencyBands(freqFloat, analyser))
    }

    // Beat detection on channel 0 (or sum of all channels)
    const beat = this.detectBeat(bands[0] || this.getEmptyBands())

    // Spectral analysis on channel 0
    const spectral = this.calculateSpectralFeatures(frequencyData[0] || new Float32Array())

    return {
      frequencyData,
      timeDomainData,
      rms,
      peak,
      bands,
      beat,
      spectral,
      timestamp: performance.now()
    }
  }

  /**
   * Calculate RMS (Root Mean Square) level
   */
  private calculateRMS(timeData: Float32Array): number {
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i]
    }
    return Math.sqrt(sum / timeData.length)
  }

  /**
   * Calculate peak level
   */
  private calculatePeak(freqData: Float32Array): number {
    let max = 0
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > max) max = freqData[i]
    }
    return max
  }

  /**
   * Extract frequency bands from FFT data
   */
  private extractFrequencyBands(
    freqData: Float32Array,
    analyser: AnalyserNode
  ): FrequencyBands {
    const sampleRate = this.audioContext?.sampleRate || 48000
    const nyquist = sampleRate / 2
    const binCount = freqData.length
    const binWidth = nyquist / binCount

    const getBandEnergy = (startFreq: number, endFreq: number): number => {
      const startBin = Math.floor(startFreq / binWidth)
      const endBin = Math.ceil(endFreq / binWidth)

      let sum = 0
      let count = 0
      for (let i = startBin; i < endBin && i < binCount; i++) {
        sum += freqData[i]
        count++
      }
      return count > 0 ? sum / count : 0
    }

    return {
      bass: getBandEnergy(20, 250),
      lowMid: getBandEnergy(250, 500),
      mid: getBandEnergy(500, 2000),
      highMid: getBandEnergy(2000, 4000),
      treble: getBandEnergy(4000, 20000)
    }
  }

  /**
   * Simple beat detection using energy-based algorithm
   */
  private detectBeat(bands: FrequencyBands): BeatData {
    const now = performance.now()

    // Calculate instantaneous energy
    const energy = bands.bass * 2 + bands.lowMid + bands.mid * 0.5

    // Add to history
    this.energyHistory.push(energy)
    if (this.energyHistory.length > this.ENERGY_HISTORY_SIZE) {
      this.energyHistory.shift()
    }

    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length

    // Calculate variance for dynamic threshold
    const variance = this.energyHistory.reduce((sum, e) => {
      const diff = e - avgEnergy
      return sum + diff * diff
    }, 0) / this.energyHistory.length

    const threshold = avgEnergy + Math.sqrt(variance) * 0.5

    // Beat detected if energy exceeds threshold and enough time has passed
    const timeSinceLastBeat = now - this.lastBeatTime
    const detected = energy > threshold &&
                     timeSinceLastBeat > this.MIN_BEAT_INTERVAL &&
                     energy > 0.1 // Minimum energy threshold

    if (detected) {
      this.lastBeatTime = now
    }

    // Estimate kick, snare, hihat from frequency content
    const kick = bands.bass
    const snare = bands.lowMid * 0.7 + bands.mid * 0.3
    const hihat = bands.highMid * 0.5 + bands.treble * 0.5

    const confidence = detected ? Math.min((energy / threshold), 1) : 0

    return {
      kick,
      snare,
      hihat,
      detected,
      energy,
    }
  }

  /**
   * Calculate spectral features
   */
  private calculateSpectralFeatures(freqData: Float32Array): SpectralData {
    if (freqData.length === 0) {
      return { centroid: 0, flux: 0, rolloff: 0 }
    }

    const sampleRate = this.audioContext?.sampleRate || 48000
    const nyquist = sampleRate / 2
    const binWidth = nyquist / freqData.length

    // Spectral centroid (brightness)
    let weightedSum = 0
    let magnitudeSum = 0
    for (let i = 0; i < freqData.length; i++) {
      const frequency = i * binWidth
      weightedSum += frequency * freqData[i]
      magnitudeSum += freqData[i]
    }
    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0

    // Spectral flux (change in spectrum)
    // Simplified: would need previous frame for real implementation
    const flux = 0 // TODO: implement with frame buffer

    // Spectral rolloff (85% of energy threshold)
    const targetEnergy = magnitudeSum * 0.85
    let cumulativeEnergy = 0
    let rolloff = 0
    for (let i = 0; i < freqData.length; i++) {
      cumulativeEnergy += freqData[i]
      if (cumulativeEnergy >= targetEnergy) {
        rolloff = i * binWidth
        break
      }
    }

    return {
      centroid: centroid / nyquist, // Normalize 0-1
      flux,
      rolloff: rolloff / nyquist    // Normalize 0-1
    }
  }

  /**
   * Get empty frequency bands
   */
  private getEmptyBands(): FrequencyBands {
    return {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0
    }
  }

  /**
   * Get available audio input devices
   */
  async getInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'audioinput')
  }

  /**
   * Select a different input device
   */
  async selectInput(deviceId: string, channelCount?: number): Promise<void> {
    await this.dispose()

    this.config.deviceId = deviceId
    if (channelCount) {
      this.config.channelCount = channelCount
    }

    await this.initialize(this.config)
  }

  /**
   * Set FFT size
   */
  setFFTSize(size: number): void {
    if (![256, 512, 1024, 2048, 4096, 8192, 16384, 32768].includes(size)) {
      throw new Error('Invalid FFT size. Must be power of 2 between 256 and 32768')
    }

    this.config.fftSize = size

    // Reinitialize if already running
    if (this.isInitialized) {
      const wasInitialized = this.isInitialized
      this.dispose()
      if (wasInitialized) {
        this.initialize(this.config)
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  /**
   * Check if initialized
   */
  get initialized(): boolean {
    return this.isInitialized
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.splitterNode) {
      this.splitterNode.disconnect()
      this.splitterNode = null
    }

    this.analyserNodes.forEach(node => node.disconnect())
    this.analyserNodes = []

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    this.frequencyBuffers = []
    this.timeBuffers = []
    this.energyHistory = []
    this.isInitialized = false

    console.log('AudioService disposed')
  }
}
