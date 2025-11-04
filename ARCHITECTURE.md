# Auto VJ Solution - Architecture Document

## Overview

A production-ready, modular auto VJ solution with constructivist/deconstructivist aesthetics, built as an Electron app with comprehensive audio analysis, parameter automation, and optimized rendering.

## Design Principles

1. **Service-Oriented Architecture**: Clear separation of concerns with independent, composable services
2. **Event-Driven Communication**: Loose coupling via event bus/pub-sub pattern
3. **Performance-First**: GPU acceleration, efficient rendering, minimal CPU overhead
4. **Modular & Extensible**: Easy to add new visualizations, effects, and parameters
5. **Production-Ready**: Robust error handling, logging, configuration management

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ELECTRON MAIN PROCESS                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Window Manager │  │ Audio Router    │  │ Config Store │ │
│  │                │  │ (Multi-channel) │  │              │ │
│  └────────────────┘  └─────────────────┘  └──────────────┘ │
└────────────────────────────┬─────────────────────────────────┘
                            IPC
┌────────────────────────────┴─────────────────────────────────┐
│                    ELECTRON RENDERER PROCESS                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    EVENT BUS                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │                                                      │     │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────┐│     │
│  │  │ AudioService │  │ ParameterSvc  │  │ LFOSvc   ││     │
│  │  │              │  │               │  │          ││     │
│  │  │ - FFT        │  │ - 10 Params   │  │ - Synced ││     │
│  │  │ - Multichan  │  │ - Automation  │  │ - Free   ││     │
│  │  │ - Analysis   │  │ - Ranges      │  │ - Shapes ││     │
│  │  └──────────────┘  └───────────────┘  └──────────┘│     │
│  │                                                      │     │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────┐│     │
│  │  │ RenderEngine │  │ VisualService │  │ ShaderSvc││     │
│  │  │              │  │               │  │          ││     │
│  │  │ - Three.js   │  │ - Scenes      │  │ - Custom ││     │
│  │  │ - WebGL      │  │ - Effects     │  │ - Post   ││     │
│  │  │ - Instancing │  │ - Transitions │  │ - Comp   ││     │
│  │  └──────────────┘  └───────────────┘  └──────────┘│     │
│  │                                                      │     │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────┐│     │
│  │  │ UIService    │  │ RecordService │  │ PresetSvc││     │
│  │  │              │  │               │  │          ││     │
│  │  │ - Controls   │  │ - Canvas Cap  │  │ - Save   ││     │
│  │  │ - Monitoring │  │ - Video Out   │  │ - Recall ││     │
│  │  └──────────────┘  └───────────────┘  └──────────┘│     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘   │
│                         SERVICE LAYER                         │
└───────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. AudioService

**Responsibility**: Audio input, analysis, and feature extraction

**Features**:
- Multi-channel audio input (stereo, 5.1, 7.1, custom)
- Web Audio API integration
- High-resolution FFT analysis (configurable size: 512-8192)
- Frequency band grouping (bass, low-mid, mid, high-mid, treble)
- Beat detection (kick, snare, hi-hat)
- RMS/peak level monitoring per channel
- Onset detection for transients
- Spectral analysis (centroid, flux, rolloff)

**API**:
```javascript
class AudioService {
  async initialize(config)
  selectInput(deviceId, channelCount)
  setFFTSize(size)
  getFrequencyData(channel = 0): Float32Array
  getFrequencyBands(channel = 0): { bass, lowMid, mid, highMid, treble }
  getRMS(channel = 0): number
  getPeak(channel = 0): number
  getBeat(): { kick, snare, hihat, confidence }
  on(event, callback)
}
```

**Events**:
- `audio:initialized`
- `audio:data` (every frame)
- `audio:beat` (on beat detection)
- `audio:error`

### 2. ParameterService

**Responsibility**: Central parameter management and automation

**Features**:
- 10 core VJ parameters (see below)
- Value ranges, curves, and constraints
- Audio-reactive mapping (any audio feature → any parameter)
- LFO modulation support
- Manual override capability
- Parameter smoothing/interpolation
- Preset save/recall

**10 Core Parameters**:
1. **Complexity** (0-1): Geometry detail, particle count, subdivision level
2. **Scale** (0-1): Object size, zoom level
3. **Rotation Speed** (0-1): Animation speed, rotation rate
4. **Fragmentation** (0-1): Deconstruction level, separation amount
5. **Color Intensity** (0-1): Saturation, brightness
6. **Contrast** (0-1): Light/dark ratio, edge sharpness
7. **Asymmetry** (0-1): Balance vs. chaos, regularity
8. **Depth** (0-1): Z-space usage, layer separation
9. **Motion Blur** (0-1): Trail length, ghosting amount
10. **Glitch Amount** (0-1): Digital artifact intensity

**API**:
```javascript
class ParameterService {
  initialize()
  get(name: string): number
  set(name: string, value: number)
  setAutomation(name: string, source: AutomationSource)
  clearAutomation(name: string)
  savePreset(name: string)
  loadPreset(name: string)
  on(event, callback)
}
```

**Events**:
- `param:changed` (paramName, value)
- `preset:loaded`

### 3. LFOService

**Responsibility**: Low-Frequency Oscillator modulation

**Features**:
- Multiple LFO instances (8 slots)
- Waveforms: sine, triangle, square, saw, random, perlin
- Synced mode (tempo-locked, beat divisions: 1/16 to 4 bars)
- Free mode (Hz-based frequency)
- Phase offset control
- Amplitude and offset adjustment
- Target any parameter

**API**:
```javascript
class LFOService {
  initialize()
  createLFO(config: LFOConfig): string // returns ID
  updateLFO(id: string, config: Partial<LFOConfig>)
  removeLFO(id: string)
  getValue(id: string): number
  setTempo(bpm: number)
  update(deltaTime: number)
}

interface LFOConfig {
  waveform: 'sine' | 'triangle' | 'square' | 'saw' | 'random' | 'perlin'
  mode: 'synced' | 'free'
  frequency: number // Hz (free mode)
  division: string // '1/4', '1/8', etc. (synced mode)
  phase: number // 0-1
  amplitude: number // 0-1
  offset: number // 0-1
}
```

### 4. RenderEngine

**Responsibility**: Optimized WebGL rendering pipeline

**Features**:
- Three.js-based rendering
- GPU instancing for repeated geometry
- Custom shader management
- Post-processing effects
- Render passes: scene → effects → composite
- Performance monitoring (FPS, draw calls, triangle count)
- Adaptive quality (automatic LOD)

**API**:
```javascript
class RenderEngine {
  initialize(canvas: HTMLCanvasElement, config: RenderConfig)
  setResolution(width: number, height: number)
  setQuality(level: 'low' | 'medium' | 'high' | 'ultra')
  render(scene: THREE.Scene, camera: THREE.Camera)
  addPostEffect(effect: Effect)
  getStats(): RenderStats
}
```

### 5. VisualService

**Responsibility**: Visual scene generation and management

**Features**:
- Constructivist/Deconstructivist aesthetic engine
- Dynamic geometry generation
- Material system with audio-reactive properties
- Scene composition and layering
- Transition effects between states
- Camera animation

**Constructivist/Deconstructivist Elements**:
- Geometric primitives (cubes, cylinders, planes, spheres)
- Fragmentation and decomposition
- Bold, contrasting colors (red, black, white, yellow, blue)
- Strong angular compositions
- Asymmetric layouts
- Grid-breaking arrangements
- Layered depth

**API**:
```javascript
class VisualService {
  initialize(renderEngine: RenderEngine)
  update(params: ParameterValues, audioData: AudioData)
  getScene(): THREE.Scene
  setAesthetic(preset: 'constructivist' | 'deconstructivist' | 'mixed')
}
```

### 6. ShaderService

**Responsibility**: Custom shader management and hot-reloading

**Features**:
- Vertex and fragment shader compilation
- Uniform management
- Shader presets library
- Error handling and fallbacks

### 7. UIService

**Responsibility**: User interface for parameter control

**Features**:
- Parameter sliders/knobs
- Audio input selection
- LFO configuration panel
- Preset browser
- Performance monitoring display
- Video output settings

### 8. RecordService

**Responsibility**: Video output and recording

**Features**:
- Canvas capture (MediaRecorder API)
- Video codec selection (VP9, H.264, etc.)
- Resolution/framerate configuration
- File export

### 9. PresetService

**Responsibility**: Save/recall system state

**Features**:
- JSON-based preset format
- Parameter values
- LFO configurations
- Automation mappings
- Visual aesthetic settings

## Data Flow

### Typical Frame Update:

```
1. AudioService analyzes input
   ├─> Emits 'audio:data' event
   └─> Emits 'audio:beat' event (if beat detected)

2. LFOService updates all LFOs
   └─> Calculates current values based on time/tempo

3. ParameterService updates parameters
   ├─> Applies audio automation
   ├─> Applies LFO modulation
   └─> Emits 'param:changed' events

4. VisualService updates scene
   ├─> Reads current parameter values
   ├─> Updates geometry, materials, positions
   └─> Applies constructivist logic

5. RenderEngine renders frame
   ├─> Renders main scene
   ├─> Applies post-processing
   └─> Outputs to canvas

6. UIService updates displays
   └─> Shows parameter values, audio levels, FPS
```

## Performance Optimization Strategies

### 1. GPU Acceleration
- **Instanced rendering**: Use `THREE.InstancedMesh` for repeated geometry
- **Custom shaders**: Move computation to GPU where possible
- **Geometry batching**: Minimize draw calls

### 2. Memory Management
- **Object pooling**: Reuse geometry and materials
- **Texture atlasing**: Combine textures to reduce binds
- **Geometry LOD**: Use simpler models when appropriate

### 3. Audio Processing
- **Web Workers**: Consider moving FFT to worker thread
- **WebAssembly**: Use WASM for intensive DSP (beat detection, onset analysis)
- **Buffering**: Smooth audio data over multiple frames

### 4. Rendering Pipeline
- **Frustum culling**: Don't render off-screen objects
- **Occlusion culling**: Skip hidden objects
- **Adaptive quality**: Reduce effects if FPS drops below target

### 5. Code Optimization
- **Bundle splitting**: Lazy-load non-critical services
- **Tree shaking**: Remove unused Three.js modules
- **Minification**: Compress production builds

## WebAssembly Integration

### Candidate Operations for WASM:

1. **FFT Analysis**: High-performance frequency analysis
2. **Beat Detection**: Real-time onset detection algorithms
3. **Perlin Noise**: Fast multi-dimensional noise generation
4. **Audio Feature Extraction**: Spectral centroid, flux, etc.

### Implementation Approach:

- Use Rust or C++ for WASM modules
- AssemblyScript as alternative (TypeScript-like)
- Compile with Emscripten or wasm-pack
- JS/WASM bridge for data transfer
- Benchmark to verify performance gains

**Note**: WASM overhead (data copying) may not benefit small operations. Best for:
- Large array operations (FFT on 8192 samples)
- Complex algorithms (beat detection)
- Repeated calculations (noise generation)

## Electron Integration

### Main Process Responsibilities:
- Window management and lifecycle
- Audio device enumeration
- File system access (presets, recordings)
- Video output routing
- Configuration persistence

### Renderer Process Responsibilities:
- All visual rendering
- Audio analysis
- UI interaction
- Service orchestration

### IPC Communication:
```javascript
// Main → Renderer
'audio-devices-list'
'config-loaded'
'window-resize'

// Renderer → Main
'get-audio-devices'
'save-preset'
'load-preset'
'start-recording'
'stop-recording'
```

## Configuration System

### App Configuration (app-config.json):
```json
{
  "window": {
    "width": 1920,
    "height": 1080,
    "fullscreen": false
  },
  "audio": {
    "defaultDevice": "default",
    "sampleRate": 48000,
    "bufferSize": 2048
  },
  "render": {
    "fps": 60,
    "quality": "high",
    "antialiasing": true
  },
  "video": {
    "codec": "VP9",
    "bitrate": 10000000
  }
}
```

### Visual Preset Format:
```json
{
  "name": "Constructivist Red",
  "parameters": {
    "complexity": 0.7,
    "scale": 0.5,
    "rotationSpeed": 0.3,
    "fragmentation": 0.6,
    "colorIntensity": 0.9,
    "contrast": 0.8,
    "asymmetry": 0.7,
    "depth": 0.6,
    "motionBlur": 0.2,
    "glitchAmount": 0.1
  },
  "lfos": [
    {
      "id": "lfo1",
      "target": "rotationSpeed",
      "waveform": "sine",
      "mode": "synced",
      "division": "1/4"
    }
  ],
  "automation": [
    {
      "parameter": "fragmentation",
      "source": "audio:bass",
      "amount": 0.8
    }
  ],
  "aesthetic": "constructivist"
}
```

## Technology Stack

### Core:
- **Electron**: Desktop app framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development
- **Three.js**: 3D rendering
- **Web Audio API**: Audio processing

### Services:
- **EventEmitter3**: Event bus
- **Stats.js**: Performance monitoring
- **Tone.js** (optional): Advanced audio features

### UI:
- **Vanilla JS/Lit**: Lightweight web components
- **CSS Grid/Flexbox**: Layout

### Development:
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Vitest**: Unit testing

### Optional/Future:
- **WebAssembly (Rust)**: Performance-critical audio processing
- **Spout/Syphon**: Video output sharing (via native modules)
- **OSC/MIDI**: External control input

## File Structure

```
3DSoundViz/
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload script
│   └── ipc/
│       ├── audio-handler.ts
│       └── file-handler.ts
├── src/
│   ├── main.ts                 # App entry point
│   ├── services/
│   │   ├── AudioService.ts
│   │   ├── ParameterService.ts
│   │   ├── LFOService.ts
│   │   ├── RenderEngine.ts
│   │   ├── VisualService.ts
│   │   ├── ShaderService.ts
│   │   ├── UIService.ts
│   │   ├── RecordService.ts
│   │   └── PresetService.ts
│   ├── core/
│   │   ├── EventBus.ts
│   │   ├── ServiceContainer.ts
│   │   └── types.ts
│   ├── visuals/
│   │   ├── Constructivist.ts
│   │   ├── Deconstructivist.ts
│   │   ├── geometry/
│   │   └── materials/
│   ├── shaders/
│   │   ├── vertex/
│   │   └── fragment/
│   ├── audio/
│   │   ├── analyzers/
│   │   ├── beat-detection/
│   │   └── feature-extraction/
│   ├── ui/
│   │   ├── components/
│   │   └── styles/
│   └── utils/
│       ├── math.ts
│       ├── color.ts
│       └── performance.ts
├── wasm/                       # WebAssembly modules (if used)
│   ├── fft/
│   └── beat-detection/
├── assets/
│   ├── shaders/
│   ├── textures/
│   └── presets/
├── tests/
├── package.json
├── vite.config.ts
├── electron-builder.config.json
└── tsconfig.json
```

## Development Phases

### Phase 1: Foundation (Current)
- ✅ Architecture design
- ⏳ Vite + TypeScript setup
- ⏳ Basic service structure
- ⏳ Event bus implementation

### Phase 2: Core Services
- Audio service with multichannel support
- Parameter service with automation
- LFO service with sync/free modes
- Basic rendering engine

### Phase 3: Visual Engine
- Constructivist/deconstructivist generator
- GPU-optimized rendering
- Custom shader system
- Post-processing effects

### Phase 4: UI & Control
- Parameter control interface
- Audio input selection
- Preset management
- Performance monitoring

### Phase 5: Electron Integration
- Main/renderer process setup
- IPC communication
- Video output configuration
- Recording functionality

### Phase 6: Optimization
- GPU instancing
- WebAssembly integration (if beneficial)
- Performance profiling
- Memory optimization

### Phase 7: Polish
- Error handling
- Logging system
- Documentation
- Testing

## Success Criteria

- ✅ 60 FPS at 1080p on mid-range GPU
- ✅ < 100ms audio latency
- ✅ 10 controllable parameters with smooth automation
- ✅ Stereo + multichannel audio support
- ✅ Video output configuration (resolution, codec)
- ✅ Constructivist/deconstructivist aesthetic
- ✅ Synced and unsynced LFO modulation
- ✅ Production-ready Electron app
- ✅ Modular, maintainable codebase

## Next Steps

1. Set up Vite + TypeScript + Electron boilerplate
2. Implement EventBus and ServiceContainer
3. Create AudioService with Web Audio API
4. Build ParameterService foundation
5. Create basic RenderEngine with Three.js
6. Implement first constructivist visual scene
7. Add UI for parameter control
8. Iterate and optimize
