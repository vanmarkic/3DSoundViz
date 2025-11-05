/**
 * Core type definitions for AutoVJ
 */

// ============================================================================
// Data Source Types
// ============================================================================

export type DataSourceType = 'audio' | 'api' | 'websocket'

export interface DataPoint {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

export interface APIDataSource {
  id: string
  type: 'api'
  name: string
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  pollInterval: number // milliseconds
  dataPath: string // JSONPath to extract data
  enabled: boolean
}

export interface WebSocketDataSource {
  id: string
  type: 'websocket'
  name: string
  url: string
  protocols?: string[]
  dataPath: string // JSONPath to extract data
  enabled: boolean
}

export type DataSource = APIDataSource | WebSocketDataSource

export interface DataSourceMapping {
  sourceId: string
  dataPath: string // Path to specific data point
  parameter: ParameterName
  scale: [number, number] // Input range
  range: [number, number] // Output range
  curve: 'linear' | 'exponential' | 'logarithmic'
}

// Predefined public APIs and WebSockets
export interface PublicDataSourceTemplate {
  name: string
  description: string
  category: 'crypto' | 'weather' | 'social' | 'finance' | 'random' | 'other'
  source: Omit<APIDataSource, 'id' | 'enabled'> | Omit<WebSocketDataSource, 'id' | 'enabled'>
  suggestedMappings?: Array<{
    dataPath: string
    description: string
    suggestedParameter: ParameterName
  }>
}

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
  | 'liquidity'

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
  liquidity: number
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

// LFO target can be:
// - A parameter: "scale", "rotationSpeed", etc.
// - Another LFO property: "lfo:lfo_id:frequency", "lfo:lfo_id:amplitude", "lfo:lfo_id:phase"
// - A light property: "light:main:speed", "light:fill:intensity", etc.
export type LFOTarget =
  | ParameterName
  | `lfo:${string}:${'frequency' | 'amplitude' | 'phase' | 'offset'}`
  | `light:${LightName}:${LightProperty}`
  | null

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
  target: LFOTarget       // What this LFO modulates (null = nothing)
  modulationAmount: number // 0-1, how much this LFO affects the target
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

// ============================================================================
// Lighting Types
// ============================================================================

export type LightName = 'main' | 'fill' | 'rim'
export type LightProperty = 'positionX' | 'positionY' | 'positionZ' | 'orbitRadius' | 'speed' | 'intensity'
export type LightPattern = 'circle' | 'figure8' | 'linear' | 'none'

export interface LightConfig {
  basePosition: [number, number, number]
  orbitRadius: number
  speed: number
  intensity: number
  pattern: LightPattern
}

export interface LightValues {
  main: LightConfig
  fill: LightConfig
  rim: LightConfig
}

// ============================================================================
// Physics Types
// ============================================================================

export type PhysicsMode = 'lava' | 'particles' | 'softbody' | 'fluid' | 'reactionDiffusion'

// Physics parameter types by mode
export type LavaParameter =
  | 'viscosity' | 'temperature' | 'scale' | 'flowSpeed' | 'turbulence'
  | 'colorIntensity' | 'contrast' | 'depth' | 'distortion'

export type ParticleParameter =
  | 'particleCount' | 'gravity' | 'attraction' | 'repulsion' | 'curlNoise'
  | 'speed' | 'size' | 'colorIntensity' | 'trail' | 'chaos' | 'glow'

export type SoftBodyParameter =
  | 'stiffness' | 'damping' | 'gravity' | 'wind' | 'resolution'
  | 'inflate' | 'tear' | 'friction' | 'wobble' | 'colorIntensity' | 'reflectivity'

export type FluidParameter =
  | 'velocity' | 'pressure' | 'dissipation' | 'vorticity' | 'density'
  | 'temperature' | 'colorDiffusion' | 'turbulence' | 'scale' | 'glow'

export type ReactionDiffusionParameter =
  | 'feedRate' | 'killRate' | 'diffusionA' | 'diffusionB' | 'reactionSpeed'
  | 'scale' | 'colorMap' | 'contrast' | 'seed' | 'morphing' | 'glow'

export type PhysicsParameter =
  | LavaParameter
  | ParticleParameter
  | SoftBodyParameter
  | FluidParameter
  | ReactionDiffusionParameter

export interface PhysicsConfig {
  mode: PhysicsMode
  targetFPS: 24 | 60
  quality: QualityLevel
  adaptiveQuality: boolean
}

export interface PhysicsStats {
  fps: number
  particleCount: number
  gpuTime: number
  simulationTime: number
  renderTime: number
  memoryUsage: number
  quality: QualityLevel
}

export interface TransitionConfig {
  fromMode: PhysicsMode
  toMode: PhysicsMode
  duration: number // 0-60 seconds
  curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  turbulence: number // 0-1
}

export interface ParticleSnapshot {
  positions: Float32Array
  velocities: Float32Array
  colors: Float32Array
  count: number
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
  'audio:sensitivity-changed': AudioSensitivity

  // Data source events
  'datasource:added': DataSource
  'datasource:removed': string
  'datasource:updated': DataSource
  'datasource:data': { sourceId: string; data: DataPoint[] }
  'datasource:error': { sourceId: string; error: Error }
  'datasource:mapping-added': DataSourceMapping
  'datasource:mapping-removed': string

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

  // Light events
  'light:changed': { name: LightName; property: LightProperty; value: number }
  'light:config-updated': { name: LightName; config: LightConfig }

  // Physics events
  'physics:mode-changed': { mode: PhysicsMode }
  'physics:parameters-changed': { mode: PhysicsMode; parameters: string[] }
  'physics:transition-start': { fromMode: PhysicsMode; toMode: PhysicsMode; duration: number }
  'physics:transition-progress': { progress: number }
  'physics:transition-complete': { mode: PhysicsMode }
  'physics:stats': PhysicsStats
  'physics:quality-changed': { quality: QualityLevel; adaptive: boolean }
  'physics:fps-changed': { fps: 24 | 60 }
  'physics:automation-added': AutomationMapping
  'physics:automation-removed': PhysicsParameter

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
    sensitivity?: AudioSensitivity
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

export interface AudioSensitivity {
  master: number      // 5-300%
  low: number         // 5-300%
  mid: number         // 5-300%
  high: number        // 5-300%
}

export type Disposable = {
  dispose(): void
}

export type AsyncDisposable = {
  dispose(): Promise<void>
}
