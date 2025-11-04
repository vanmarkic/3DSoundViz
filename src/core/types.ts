/**
 * Core type definitions for AutoVJ
 */

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioConfig {
  deviceId: string
  channelCount: number
  sampleRate: number
  fftSize: number
  smoothingTimeConstant: number
}

export interface AudioData {
  frequencyData: Float32Array[]  // Per channel
  timeDomainData: Float32Array[]  // Per channel
  rms: number[]                   // Per channel
  peak: number[]                  // Per channel
  bands: FrequencyBands[]         // Per channel
  beat: BeatData
  spectral: SpectralData
  timestamp: number
}

export interface FrequencyBands {
  bass: number        // 20-250 Hz
  lowMid: number      // 250-500 Hz
  mid: number         // 500-2000 Hz
  highMid: number     // 2000-4000 Hz
  treble: number      // 4000-20000 Hz
}

export interface BeatData {
  kick: number        // 0-1 confidence
  snare: number       // 0-1 confidence
  hihat: number       // 0-1 confidence
  detected: boolean
  energy: number
}

export interface SpectralData {
  centroid: number    // Weighted mean of frequencies
  flux: number        // Change in spectrum
  rolloff: number     // Frequency below which 85% of energy is contained
}

// ============================================================================
// Parameter Types
// ============================================================================

export type ParameterName =
  | 'complexity'
  | 'scale'
  | 'rotationSpeed'
  | 'fragmentation'
  | 'colorIntensity'
  | 'contrast'
  | 'asymmetry'
  | 'depth'
  | 'motionBlur'
  | 'glitchAmount'

export interface ParameterConfig {
  name: ParameterName
  value: number           // 0-1
  min: number
  max: number
  default: number
  curve: 'linear' | 'exponential' | 'logarithmic'
  smoothing: number       // 0-1, interpolation amount
}

export interface ParameterValues {
  complexity: number
  scale: number
  rotationSpeed: number
  fragmentation: number
  colorIntensity: number
  contrast: number
  asymmetry: number
  depth: number
  motionBlur: number
  glitchAmount: number
}

export interface AutomationMapping {
  parameter: ParameterName
  source: AutomationSource
  amount: number          // 0-1, modulation amount
  range: [number, number] // Min/max output range
  curve: 'linear' | 'exponential' | 'logarithmic'
}

export type AutomationSource =
  | `audio:${keyof FrequencyBands}`
  | 'audio:rms'
  | 'audio:peak'
  | `audio:beat:${keyof BeatData}`
  | `lfo:${string}`      // LFO ID

// ============================================================================
// LFO Types
// ============================================================================

export type LFOWaveform = 'sine' | 'triangle' | 'square' | 'saw' | 'random' | 'perlin'
export type LFOMode = 'synced' | 'free'
export type BeatDivision = '4/1' | '2/1' | '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32'

export interface LFOConfig {
  id: string
  waveform: LFOWaveform
  mode: LFOMode
  frequency: number       // Hz (free mode)
  division: BeatDivision  // (synced mode)
  phase: number           // 0-1
  amplitude: number       // 0-1
  offset: number          // 0-1
  enabled: boolean
}

export interface LFOState extends LFOConfig {
  currentValue: number
  currentPhase: number
}

// ============================================================================
// Visual Types
// ============================================================================

export type AestheticMode = 'constructivist' | 'deconstructivist' | 'mixed'

export interface VisualConfig {
  aesthetic: AestheticMode
  colorPalette: string[]
  complexity: number
  seed: number
}

export interface RenderConfig {
  width: number
  height: number
  pixelRatio: number
  antialias: boolean
  quality: QualityLevel
  targetFPS: number
}

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

export interface RenderStats {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  programs: number
}

// ============================================================================
// Preset Types
// ============================================================================

export interface Preset {
  name: string
  description?: string
  parameters: ParameterValues
  lfos: LFOConfig[]
  automations: AutomationMapping[]
  visual: VisualConfig
  createdAt: number
  modifiedAt: number
}

// ============================================================================
// Service Events
// ============================================================================

export interface ServiceEvents {
  // Audio events
  'audio:initialized': AudioConfig
  'audio:data': AudioData
  'audio:beat': BeatData
  'audio:error': Error

  // Parameter events
  'param:changed': { name: ParameterName; value: number }
  'param:automation-added': AutomationMapping
  'param:automation-removed': ParameterName

  // LFO events
  'lfo:created': LFOConfig
  'lfo:updated': LFOConfig
  'lfo:removed': string

  // Preset events
  'preset:loaded': Preset
  'preset:saved': Preset

  // Render events
  'render:initialized': RenderConfig
  'render:stats': RenderStats
  'render:quality-changed': QualityLevel

  // UI events
  'ui:parameter-drag': { name: ParameterName; value: number }
  'ui:preset-selected': string

  // Recording events
  'record:started': void
  'record:stopped': { filename: string; duration: number }
  'record:error': Error
}

// ============================================================================
// Utility Types
// ============================================================================

export interface AppConfig {
  window: {
    width: number
    height: number
    fullscreen: boolean
  }
  audio: {
    defaultDevice: string
    sampleRate: number
    fftSize: number
  }
  render: {
    fps: number
    quality: QualityLevel
    antialias: boolean
  }
  video: {
    codec: string
    bitrate: number
  }
}

export type Disposable = {
  dispose(): void
}

export type AsyncDisposable = {
  dispose(): Promise<void>
}
