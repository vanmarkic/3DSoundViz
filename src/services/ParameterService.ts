/**
 * ParameterService - Central parameter management and automation
 * Manages 10 core VJ parameters with audio-reactive and LFO modulation
 */

import { eventBus } from '@core/EventBus'
import type {
  ParameterName,
  ParameterConfig,
  ParameterValues,
  AutomationMapping,
  AudioData,
  Disposable
} from '@core/types'

export class ParameterService implements Disposable {
  private parameters = new Map<ParameterName, ParameterConfig>()
  private currentValues: ParameterValues
  private targetValues: ParameterValues
  private automations = new Map<ParameterName, AutomationMapping>()
  private manualOverrides = new Map<ParameterName, number>()

  // For LFO modulation (values set by LFOService)
  private lfoModulations = new Map<ParameterName, number>()

  private unsubscribers: Array<() => void> = []
  private isInitialized = false

  constructor() {
    // Initialize with default values
    this.currentValues = this.getDefaultValues()
    this.targetValues = this.getDefaultValues()
  }

  /**
   * Initialize parameter system
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('ParameterService already initialized')
      return
    }

    // Define all 10 parameters
    this.defineParameter('complexity', 0.5, 'linear', 0.1)
    this.defineParameter('scale', 0.5, 'linear', 0.1)
    this.defineParameter('rotationSpeed', 0.3, 'linear', 0.1)
    this.defineParameter('fragmentation', 0.4, 'linear', 0.1)
    this.defineParameter('colorIntensity', 0.7, 'linear', 0.1)
    this.defineParameter('contrast', 0.6, 'linear', 0.1)
    this.defineParameter('asymmetry', 0.5, 'linear', 0.1)
    this.defineParameter('depth', 0.5, 'linear', 0.1)
    this.defineParameter('motionBlur', 0.2, 'linear', 0.1)
    this.defineParameter('glitchAmount', 0.0, 'linear', 0.1)

    // Subscribe to audio data for automation
    const unsubAudio = eventBus.on('audio:data', (audioData) => {
      this.updateFromAudio(audioData)
    })
    this.unsubscribers.push(unsubAudio)

    this.isInitialized = true
    console.log('ParameterService initialized with 10 parameters')
  }

  /**
   * Define a parameter with its configuration
   */
  private defineParameter(
    name: ParameterName,
    defaultValue: number,
    curve: 'linear' | 'exponential' | 'logarithmic',
    smoothing: number
  ): void {
    this.parameters.set(name, {
      name,
      value: defaultValue,
      min: 0,
      max: 1,
      default: defaultValue,
      curve,
      smoothing
    })
  }

  /**
   * Get default parameter values
   */
  private getDefaultValues(): ParameterValues {
    return {
      complexity: 0.5,
      scale: 0.5,
      rotationSpeed: 0.3,
      fragmentation: 0.4,
      colorIntensity: 0.7,
      contrast: 0.6,
      asymmetry: 0.5,
      depth: 0.5,
      motionBlur: 0.2,
      glitchAmount: 0.0
    }
  }

  /**
   * Get a parameter value
   */
  get(name: ParameterName): number {
    return this.currentValues[name]
  }

  /**
   * Get all parameter values
   */
  getAll(): ParameterValues {
    return { ...this.currentValues }
  }

  /**
   * Set a parameter value (manual control)
   */
  set(name: ParameterName, value: number): void {
    const param = this.parameters.get(name)
    if (!param) {
      console.warn(`Parameter "${name}" not found`)
      return
    }

    // Clamp value
    value = Math.max(param.min, Math.min(param.max, value))

    // Store as manual override (takes precedence over automation)
    this.manualOverrides.set(name, value)
    this.targetValues[name] = value

    // Update immediately
    this.currentValues[name] = value
    param.value = value

    eventBus.emit('param:changed', { name, value })
  }

  /**
   * Clear manual override for a parameter
   */
  clearOverride(name: ParameterName): void {
    this.manualOverrides.delete(name)
  }

  /**
   * Set automation mapping
   */
  setAutomation(mapping: AutomationMapping): void {
    this.automations.set(mapping.parameter, mapping)
    eventBus.emit('param:automation-added', mapping)
  }

  /**
   * Clear automation for a parameter
   */
  clearAutomation(name: ParameterName): void {
    this.automations.delete(name)
    eventBus.emit('param:automation-removed', name)
  }

  /**
   * Get automation mapping for a parameter
   */
  getAutomation(name: ParameterName): AutomationMapping | undefined {
    return this.automations.get(name)
  }

  /**
   * Set LFO modulation value for a parameter
   * Called by LFOService
   */
  setLFOModulation(name: ParameterName, value: number): void {
    this.lfoModulations.set(name, value)
  }

  /**
   * Clear LFO modulation for a parameter
   */
  clearLFOModulation(name: ParameterName): void {
    this.lfoModulations.delete(name)
  }

  /**
   * Update parameters from audio data (automation)
   */
  private updateFromAudio(audioData: AudioData): void {
    for (const [paramName, mapping] of this.automations) {
      // Skip if manual override is active
      if (this.manualOverrides.has(paramName)) continue

      // Extract source value from audio data
      const sourceValue = this.extractAudioValue(mapping.source, audioData)

      // Apply curve
      const curvedValue = this.applyCurve(sourceValue, mapping.curve)

      // Map to range
      const [min, max] = mapping.range
      const mappedValue = min + curvedValue * (max - min)

      // Apply modulation amount
      const currentBase = this.targetValues[paramName]
      const modulatedValue = currentBase + (mappedValue - currentBase) * mapping.amount

      // Clamp to 0-1
      this.targetValues[paramName] = Math.max(0, Math.min(1, modulatedValue))
    }

    // Apply LFO modulations
    for (const [paramName, lfoValue] of this.lfoModulations) {
      // Skip if manual override is active
      if (this.manualOverrides.has(paramName)) continue

      // LFO modulates around current value
      const base = this.targetValues[paramName]
      const modulated = base + (lfoValue - 0.5) * 0.5 // ±0.25 modulation depth

      this.targetValues[paramName] = Math.max(0, Math.min(1, modulated))
    }

    // Smooth towards target values
    this.smoothParameters()
  }

  /**
   * Extract value from audio data based on source string
   */
  private extractAudioValue(source: string, audioData: AudioData): number {
    const [category, key, subkey] = source.split(':')

    if (category === 'audio') {
      // Channel 0 for simplicity (could be extended to support channel selection)
      const channel = 0

      if (key === 'rms') {
        return audioData.rms[channel] || 0
      }

      if (key === 'peak') {
        return audioData.peak[channel] || 0
      }

      if (key === 'bass' || key === 'lowMid' || key === 'mid' || key === 'highMid' || key === 'treble') {
        return audioData.bands[channel]?.[key] || 0
      }

      if (key === 'beat' && subkey) {
        return (audioData.beat as any)[subkey] || 0
      }
    }

    return 0
  }

  /**
   * Apply curve to value
   */
  private applyCurve(
    value: number,
    curve: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    switch (curve) {
      case 'exponential':
        return Math.pow(value, 2)
      case 'logarithmic':
        return Math.sqrt(value)
      default:
        return value
    }
  }

  /**
   * Smooth parameters towards target values
   */
  private smoothParameters(): void {
    for (const [name, param] of this.parameters) {
      const current = this.currentValues[name]
      const target = this.targetValues[name]
      const smoothing = param.smoothing

      // Linear interpolation
      const newValue = current + (target - current) * smoothing

      if (Math.abs(newValue - current) > 0.001) {
        this.currentValues[name] = newValue
        param.value = newValue
        eventBus.emit('param:changed', { name, value: newValue })
      }
    }
  }

  /**
   * Load parameter values from preset
   */
  loadValues(values: Partial<ParameterValues>): void {
    for (const [key, value] of Object.entries(values)) {
      const name = key as ParameterName
      if (this.parameters.has(name)) {
        this.currentValues[name] = value
        this.targetValues[name] = value
        const param = this.parameters.get(name)!
        param.value = value
      }
    }
  }

  /**
   * Reset all parameters to defaults
   */
  reset(): void {
    const defaults = this.getDefaultValues()
    this.loadValues(defaults)
    this.automations.clear()
    this.manualOverrides.clear()
    this.lfoModulations.clear()
  }

  /**
   * Get parameter configuration
   */
  getConfig(name: ParameterName): ParameterConfig | undefined {
    return this.parameters.get(name)
  }

  /**
   * Get all parameter configurations
   */
  getAllConfigs(): ParameterConfig[] {
    return Array.from(this.parameters.values())
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []

    this.parameters.clear()
    this.automations.clear()
    this.manualOverrides.clear()
    this.lfoModulations.clear()

    this.isInitialized = false
    console.log('ParameterService disposed')
  }
}
