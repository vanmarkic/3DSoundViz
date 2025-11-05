/**
 * LFOService - Low-Frequency Oscillator modulation
 * Supports synced (tempo-locked) and free (Hz-based) modes with multiple waveforms
 */

import { eventBus } from '@core/EventBus'
import type {
  LFOConfig,
  LFOState,
  LFOWaveform,
  BeatDivision,
  Disposable
} from '@core/types'
import { ParameterService } from './ParameterService'

export class LFOService implements Disposable {
  private lfos = new Map<string, LFOState>()
  private tempo = 120 // BPM
  private startTime = 0
  private parameterService: ParameterService | null = null
  private lastUpdateTime = 0

  // Perlin noise state
  private noiseSeeds = new Map<string, number>()

  /**
   * Initialize LFO service
   */
  initialize(parameterService: ParameterService): void {
    this.parameterService = parameterService
    this.startTime = performance.now()
    this.lastUpdateTime = this.startTime

    console.log('LFOService initialized')
  }

  /**
   * Create a new LFO
   */
  createLFO(config: Omit<LFOConfig, 'id'>): string {
    const id = this.generateId()

    const lfoState: LFOState = {
      id,
      waveform: config.waveform,
      mode: config.mode,
      frequency: config.frequency,
      division: config.division,
      phase: config.phase,
      amplitude: config.amplitude,
      offset: config.offset,
      enabled: config.enabled,
      target: config.target,
      modulationAmount: config.modulationAmount,
      currentValue: 0,
      currentPhase: config.phase
    }

    this.lfos.set(id, lfoState)

    // Initialize noise seed if using perlin
    if (config.waveform === 'perlin') {
      this.noiseSeeds.set(id, Math.random() * 1000)
    }

    eventBus.emit('lfo:created', lfoState)
    console.log(`LFO created: ${id} (${config.waveform}, ${config.mode})`)

    return id
  }

  /**
   * Update an existing LFO
   */
  updateLFO(id: string, config: Partial<LFOConfig>): void {
    const lfo = this.lfos.get(id)
    if (!lfo) {
      console.warn(`LFO "${id}" not found`)
      return
    }

    Object.assign(lfo, config)

    // Reset noise seed if waveform changed to perlin
    if (config.waveform === 'perlin' && !this.noiseSeeds.has(id)) {
      this.noiseSeeds.set(id, Math.random() * 1000)
    }

    eventBus.emit('lfo:updated', lfo)
  }

  /**
   * Remove an LFO
   */
  removeLFO(id: string): void {
    this.lfos.delete(id)
    this.noiseSeeds.delete(id)
    eventBus.emit('lfo:removed', id)
    console.log(`LFO removed: ${id}`)
  }

  /**
   * Get LFO current value
   */
  getValue(id: string): number {
    const lfo = this.lfos.get(id)
    return lfo?.currentValue ?? 0
  }

  /**
   * Get LFO state
   */
  getLFO(id: string): LFOState | undefined {
    return this.lfos.get(id)
  }

  /**
   * Get all LFOs
   */
  getAllLFOs(): LFOState[] {
    return Array.from(this.lfos.values())
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(300, bpm))
  }

  /**
   * Get current tempo
   */
  getTempo(): number {
    return this.tempo
  }

  /**
   * Update all LFOs (call every frame)
   */
  update(deltaTime: number): void {
    const currentTime = performance.now()
    const elapsedTime = (currentTime - this.startTime) / 1000 // seconds

    for (const lfo of this.lfos.values()) {
      if (!lfo.enabled) continue

      // Calculate phase increment
      let phaseIncrement = 0

      if (lfo.mode === 'free') {
        // Free mode: use Hz frequency
        phaseIncrement = lfo.frequency * deltaTime
      } else {
        // Synced mode: use tempo and beat division
        const beatsPerSecond = this.tempo / 60
        const divisor = this.parseBeatDivision(lfo.division)
        const cyclesPerSecond = beatsPerSecond * divisor
        phaseIncrement = cyclesPerSecond * deltaTime
      }

      // Update phase
      lfo.currentPhase = (lfo.currentPhase + phaseIncrement) % 1.0

      // Calculate waveform value (-1 to 1)
      const waveValue = this.calculateWaveform(
        lfo.waveform,
        lfo.currentPhase,
        lfo.id,
        elapsedTime
      )

      // Apply amplitude and offset to get final value (0 to 1)
      lfo.currentValue = lfo.offset + waveValue * lfo.amplitude * 0.5

      // Clamp to 0-1
      lfo.currentValue = Math.max(0, Math.min(1, lfo.currentValue))
    }

    this.lastUpdateTime = currentTime
  }

  /**
   * Calculate waveform value at given phase
   */
  private calculateWaveform(
    waveform: LFOWaveform,
    phase: number,
    lfoId: string,
    time: number
  ): number {
    const p = phase * Math.PI * 2 // 0-2π

    switch (waveform) {
      case 'sine':
        return Math.sin(p)

      case 'triangle':
        return phase < 0.5
          ? -1 + phase * 4
          : 3 - phase * 4

      case 'square':
        return phase < 0.5 ? 1 : -1

      case 'saw':
        return 1 - phase * 2

      case 'random':
        // Sample-and-hold random
        return Math.sin(Math.floor(phase * 8) * 1234.5678) // Pseudo-random

      case 'perlin':
        // Simplified 1D Perlin noise
        const seed = this.noiseSeeds.get(lfoId) || 0
        return this.perlin1D(time + seed) * 2 - 1

      default:
        return 0
    }
  }

  /**
   * Simple 1D Perlin noise (simplified)
   */
  private perlin1D(x: number): number {
    const xi = Math.floor(x)
    const xf = x - xi

    // Fade curve
    const u = xf * xf * (3 - 2 * xf)

    // Hash function for gradients
    const hash = (n: number) => {
      const h = Math.sin(n * 12.9898 + 4.1414) * 43758.5453
      return h - Math.floor(h)
    }

    const g0 = hash(xi)
    const g1 = hash(xi + 1)

    // Linear interpolation
    return g0 * (1 - u) + g1 * u
  }

  /**
   * Parse beat division to cycles per beat
   */
  private parseBeatDivision(division: BeatDivision): number {
    const parts = division.split('/')
    const numerator = parseInt(parts[0])
    const denominator = parseInt(parts[1])
    return numerator / denominator
  }

  /**
   * Generate unique LFO ID
   */
  private generateId(): string {
    return `lfo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all LFOs
   */
  clear(): void {
    this.lfos.clear()
    this.noiseSeeds.clear()
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.clear()
    this.parameterService = null
    console.log('LFOService disposed')
  }
}
