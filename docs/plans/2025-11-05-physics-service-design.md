# Physics Service Design
**Date:** 2025-11-05
**Status:** Design Complete - Ready for Implementation
**Author:** Claude + User Collaboration

## Executive Summary

The Physics Service introduces a comprehensive GPU-accelerated physics simulation system for the AutoVJ application, enabling VJs to switch between five distinct physics-based visual modes with theatrical particle-morphing transitions. This design maintains the existing service-based architecture while adding real-time physics simulations optimized for live performance at 24 FPS (cinematic default) with optional 60 FPS smooth mode.

## Overview

### Vision
Enable VJs to create stunning physics-based visuals that respond to audio in real-time, with smooth transitions between completely different physics behaviors. Each mode offers unique aesthetic possibilities while maintaining consistent audio-reactive control.

### Key Features
- **5 Physics Modes:** Lava, Particles, Soft Body, Fluid, Reaction-Diffusion
- **Particle Morphing Transitions:** 0-60 second smooth transitions between modes
- **Mode-Specific Parameters:** Up to 11 optimized parameters per mode
- **Audio-Reactive Physics:** Configurable automation with smart defaults
- **GPU-First Performance:** 24 FPS default, 60 FPS option, adaptive quality
- **Theatrical VJ Aesthetics:** Designed for live performances and recordings

---

## Architecture

### Core Structure

The PhysicsService follows a **plugin-based architecture with GPU-first implementation**, similar to VisualService but optimized for real-time physics simulations.

```
PhysicsService (Orchestrator)
├── TransitionController (Particle morphing between modes)
├── PhysicsMode Interface
│   ├── LavaMode (Viscous fluid simulation)
│   ├── ParticleMode (Million particle GPGPU)
│   ├── SoftBodyMode (Spring-mass deformable meshes)
│   ├── FluidMode (Navier-Stokes stable fluids)
│   └── ReactionDiffusionMode (Turing patterns)
├── GPU Compute Pipeline (GLSL shaders)
└── Parameter Manager (Mode-specific parameters)
```

### Service Integration

**Dependencies:**
- **ParameterService** → Provides mode-specific parameter values
- **AudioService** → Audio data for reactive forces
- **RenderEngine** → Scene rendering and GPU resources
- **LFOService** → LFO modulation of physics parameters
- **EventBus** → Event communication

**Lifecycle:**
1. `initialize(renderEngine)` - Set up GPU resources
2. `setMode(mode, transitionTime)` - Switch physics modes with transition
3. `update(deltaTime, audioData, params)` - Physics simulation step
4. `render()` - Visual output to scene
5. `dispose()` - Clean up GPU resources

### PhysicsMode Interface

```typescript
interface PhysicsMode {
  name: PhysicsMode
  parameters: string[] // Mode-specific parameter names

  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void
  update(deltaTime: number, params: PhysicsParameters, audioData: AudioData): void
  render(scene: THREE.Scene): void

  // Transition support
  exportToParticles(count: number): ParticleSnapshot
  importFromParticles(particles: ParticleSnapshot, progress: number): void

  dispose(): void
}
```

### Performance Targets
- **24 FPS @ 1080p** (cinematic default)
- **60 FPS @ 1080p** (smooth mode option)
- **< 40ms GPU frame time** @ 24 FPS
- **< 16ms GPU frame time** @ 60 FPS
- **< 500MB GPU memory** usage
- **Adaptive quality** scaling based on performance

---

## Physics Modes Specification

Each mode includes up to 11 carefully selected parameters optimized for VJ control.

### 1. Lava Mode (Melting Pixels / Viscous Fluid)

**Implementation:** GPU compute shader with velocity field + viscosity simulation

**Visual Description:**
Thick, glowing lava with melting pixel effect and heat distortion. Lava flows like molten metal with visible surface tension and temperature-based color shifts.

**Parameters (9):**

| Parameter | Range | Description | Audio Default |
|-----------|-------|-------------|---------------|
| `viscosity` | 0-1 | Thickness of lava flow | - |
| `temperature` | 0-1 | Heat intensity, affects glow and flow speed | Bass |
| `scale` | 0-1 | Lava blob size | - |
| `flowSpeed` | 0-1 | Overall animation speed | - |
| `turbulence` | 0-1 | Noise/chaos in flow | Kick |
| `colorIntensity` | 0-1 | Saturation and glow | Mid |
| `contrast` | 0-1 | Dark cracks vs bright lava | - |
| `depth` | 0-1 | Z-axis displacement for 3D look | - |
| `distortion` | 0-1 | Heat wave distortion amount | - |

**Technical Details:**
- 256x256 simulation grid, upscaled for display
- Velocity field advection using semi-Lagrangian method
- Heat distortion post-process shader
- Perlin noise for turbulence

---

### 2. Particle Mode (Million Particle GPGPU)

**Implementation:** GPU particle system with compute shaders (position/velocity buffers)

**Visual Description:**
Massive swarms of particles with curl noise creating organic, swirling motion. Supports audio-reactive explosions, gravity wells, and attraction/repulsion forces.

**Parameters (11):**

| Parameter | Range | Description | Audio Default |
|-----------|-------|-------------|---------------|
| `particleCount` | 0-1 | Number of particles (1K - 1M) | Treble |
| `gravity` | 0-1 | Downward force strength | Bass |
| `attraction` | 0-1 | Particles attract to center | - |
| `repulsion` | 0-1 | Particles push away from each other | Kick |
| `curlNoise` | 0-1 | Organic swirling motion | Mid |
| `speed` | 0-1 | Overall velocity multiplier | - |
| `size` | 0-1 | Particle render size | - |
| `colorIntensity` | 0-1 | Color saturation | - |
| `trail` | 0-1 | Motion blur/trail length | - |
| `chaos` | 0-1 | Random forces | - |
| `glow` | 0-1 | Bloom/glow intensity | - |

**Technical Details:**
- GPU texture stores particle state (RGBA = position, velocity)
- Transform feedback for position updates
- Instanced point sprites or instanced meshes
- LOD: distant particles = points, close = meshes
- Quality levels: 50K (low) to 1M (ultra) particles

---

### 3. Soft Body Mode (Deformable Meshes / Cloth)

**Implementation:** Spring-mass system with Verlet integration, GPU-accelerated if possible

**Visual Description:**
Bouncing, squishing, tearing fabric/jello meshes that react to audio forces. Supports cloth draping, rubber bouncing, and balloon inflation effects.

**Parameters (11):**

| Parameter | Range | Description | Audio Default |
|-----------|-------|-------------|---------------|
| `stiffness` | 0-1 | Resistance to deformation (cloth=low, rubber=high) | - |
| `damping` | 0-1 | Energy loss, controls bounciness | - |
| `gravity` | 0-1 | Downward force | Bass |
| `wind` | 0-1 | Horizontal turbulent forces | Mid |
| `resolution` | 0-1 | Mesh detail (low=blobby, high=detailed) | - |
| `inflate` | 0-1 | Internal pressure (balloon effect) | - |
| `tear` | 0-1 | Fragmentation/ripping threshold | - |
| `friction` | 0-1 | Drag/slowdown | - |
| `wobble` | 0-1 | Jiggle physics multiplier | Kick |
| `colorIntensity` | 0-1 | Material color saturation | - |
| `reflectivity` | 0-1 | Metallic/glossy look | - |

**Technical Details:**
- Spring-mass network (grid or mesh-based)
- Verlet integration for stability
- Constraint solver for shape preservation
- Adaptive mesh resolution based on quality
- Tear system removes springs above threshold

---

### 4. Fluid Mode (Navier-Stokes Stable Fluids)

**Implementation:** GPU compute shader solving fluid equations (velocity + pressure fields)

**Visual Description:**
Smoke-like fluid simulation with colored dye injection. Audio creates fluid impulses and turbulence. Supports buoyancy, vorticity, and pressure waves.

**Parameters (10):**

| Parameter | Range | Description | Audio Default |
|-----------|-------|-------------|---------------|
| `velocity` | 0-1 | Flow speed | - |
| `pressure` | 0-1 | Fluid pressure/expansion | Bass |
| `dissipation` | 0-1 | How quickly fluid motion fades | - |
| `vorticity` | 0-1 | Swirl/curl strength | Mid |
| `density` | 0-1 | Visual opacity/thickness | - |
| `temperature` | 0-1 | Heat affecting buoyancy | Treble |
| `colorDiffusion` | 0-1 | Color blending/spreading | - |
| `turbulence` | 0-1 | Chaotic flow | - |
| `scale` | 0-1 | Simulation resolution | - |
| `glow` | 0-1 | Emissive lighting | - |

**Technical Details:**
- Based on Jos Stam's "Stable Fluids" paper
- Multi-grid pressure solver for performance
- Velocity and density advection
- Vorticity confinement for swirls
- Downsampled simulation (128x128 or 256x256)
- Bicubic upscaling for display

---

### 5. Reaction-Diffusion Mode (Organic Patterns)

**Implementation:** GPU shader solving Gray-Scott equations

**Visual Description:**
Living, breathing organic patterns resembling coral growth, zebra stripes, leopard spots, or brain-like textures. Patterns evolve and morph based on audio input.

**Parameters (11):**

| Parameter | Range | Description | Audio Default |
|-----------|-------|-------------|---------------|
| `feedRate` | 0-1 | Chemical A feed rate (pattern type) | - |
| `killRate` | 0-1 | Chemical B kill rate (pattern variation) | - |
| `diffusionA` | 0-1 | How fast chemical A spreads | - |
| `diffusionB` | 0-1 | How fast chemical B spreads | - |
| `reactionSpeed` | 0-1 | Animation speed | Mid |
| `scale` | 0-1 | Pattern detail/zoom | - |
| `colorMap` | 0-1 | Color mapping (coral → zebra → spots) | - |
| `contrast` | 0-1 | Pattern sharpness | - |
| `seed` | 0-1 | Random starting condition | - |
| `morphing` | 0-1 | Pattern evolution rate | Bass |
| `glow` | 0-1 | Bioluminescent effect | Treble |

**Technical Details:**
- Gray-Scott reaction-diffusion equations
- Ping-pong GPU textures for state
- Multiple feed/kill rate presets for different patterns
- Color remapping shader for visualization
- Can project onto 3D surfaces or display as 2D texture

---

## Transition System (Particle Morphing)

### Core Concept

When switching modes, the current visual **explodes into particles**, morphs over a configurable time period (0-60 seconds), then **reconstructs into the new mode**. This creates a theatrical, continuous visual experience.

### Three-Phase Pipeline

#### Phase 1: Deconstruction (0-33% of transition time)

Current mode "explodes" into particle representation:

- **Lava** → Sample surface into particles
- **Particles** → Already particles, capture current state
- **Soft Body** → Vertex positions become particles
- **Fluid** → Sample density field into particles
- **Reaction-Diffusion** → Sample pattern pixels into particles

**Particle Count:** Adaptive based on quality (10K-500K)

#### Phase 2: Morph (34-66% of transition time)

Particles exist in intermediate state:

- **Target positions** calculated for destination mode
- **Smooth interpolation** using ease-in-out curves
- **Audio-reactive turbulence** can affect morph path
- **Color lerp** from old palette → new palette
- Particles remain visible throughout

**Forces Applied:**
- Attraction to target positions
- Optional turbulence/chaos parameter
- Audio can trigger impulses during morph

#### Phase 3: Reconstruction (67-100% of transition time)

Particles coalesce into new mode structure:

- **Lava** → Particles form new lava surface
- **Particles** → Assign new physics behaviors
- **Soft Body** → Particles become mesh vertices, springs connect
- **Fluid** → Particles seed new velocity field
- **Reaction-Diffusion** → Particles dissolve into pattern

New mode takes over rendering completely.

### Transition Controller API

```typescript
interface TransitionConfig {
  fromMode: PhysicsMode
  toMode: PhysicsMode
  duration: number // 0-60 seconds
  curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  turbulence: number // 0-1, random forces during morph
}

transitionController.startTransition(config: TransitionConfig)
transitionController.getCurrentProgress(): number // 0-1
transitionController.isTransitioning(): boolean
transitionController.skipToEnd(): void
```

### GPU Implementation

- **Single shared particle buffer** across all transitions
- **Compute shader** handles all morph logic
- **Dual texture ping-pong** for particle state updates
- **Minimal CPU overhead** - everything runs on GPU

### Transition Events

```typescript
eventBus.on('physics:transition-start', (config) => {})
eventBus.on('physics:transition-progress', (progress) => {})
eventBus.on('physics:transition-complete', (newMode) => {})
```

---

## Parameter Mapping & Audio-Reactivity

### Type System Updates

```typescript
// src/core/types.ts additions

export type PhysicsMode = 'lava' | 'particles' | 'softbody' | 'fluid' | 'reactionDiffusion'

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
  gpuTime: number        // ms per frame
  simulationTime: number // Physics calculation time
  renderTime: number     // Draw time
  memoryUsage: number    // MB
  quality: QualityLevel
}
```

### Dynamic Parameter System

When switching modes, ParameterService dynamically updates available parameters:

```typescript
// Example: Switching from Lava to Particles
physicsService.setMode('particles', 5.0) // 5 second transition

// ParameterService automatically:
// 1. Unregisters lava parameters
// 2. Registers particle parameters
// 3. Applies default values
// 4. Loads smart audio-reactive defaults
// 5. Emits 'physics:parameters-changed' event
// 6. UI updates to show new parameters
```

### Smart Default Automation Mappings

Each mode ships with **sensible audio-reactive defaults** that users can override:

#### Lava Mode Defaults
```typescript
{
  'temperature': { source: 'audio:bass', amount: 0.7, curve: 'exponential' },
  'turbulence': { source: 'audio:beat:kick', amount: 0.6, curve: 'linear' },
  'colorIntensity': { source: 'audio:mid', amount: 0.5, curve: 'linear' }
}
```

#### Particle Mode Defaults
```typescript
{
  'gravity': { source: 'audio:bass', amount: 0.8, curve: 'exponential' },
  'repulsion': { source: 'audio:beat:kick', amount: 0.9, curve: 'exponential' },
  'particleCount': { source: 'audio:treble', amount: 0.6, curve: 'logarithmic' },
  'curlNoise': { source: 'audio:mid', amount: 0.5, curve: 'linear' }
}
```

#### Soft Body Mode Defaults
```typescript
{
  'gravity': { source: 'audio:bass', amount: 0.7, curve: 'exponential' },
  'wobble': { source: 'audio:beat:kick', amount: 0.8, curve: 'linear' },
  'wind': { source: 'audio:mid', amount: 0.5, curve: 'linear' }
}
```

#### Fluid Mode Defaults
```typescript
{
  'pressure': { source: 'audio:bass', amount: 0.8, curve: 'exponential' },
  'vorticity': { source: 'audio:mid', amount: 0.6, curve: 'linear' },
  'temperature': { source: 'audio:treble', amount: 0.5, curve: 'linear' }
}
```

#### Reaction-Diffusion Mode Defaults
```typescript
{
  'morphing': { source: 'audio:bass', amount: 0.6, curve: 'exponential' },
  'reactionSpeed': { source: 'audio:mid', amount: 0.5, curve: 'linear' },
  'glow': { source: 'audio:treble', amount: 0.7, curve: 'linear' }
}
```

### Custom Automation API

Users can override defaults or create custom mappings:

```typescript
// Map bass to particle gravity with custom settings
physicsService.setAutomation({
  parameter: 'gravity',
  source: 'audio:bass',
  amount: 0.9,
  range: [0, 1],
  curve: 'exponential'
})

// Map LFO to curl noise for organic motion
physicsService.setAutomation({
  parameter: 'curlNoise',
  source: 'lfo:sine1',
  amount: 0.6,
  range: [0.2, 0.8],
  curve: 'linear'
})

// Clear automation for a parameter
physicsService.clearAutomation('gravity')

// Load automation preset
physicsService.loadAutomationPreset('heavy-bass-reactive')
```

---

## Performance Optimization Strategy

### GPU-First Architecture

**Core Principle:** Minimize CPU-GPU data transfer. Keep all computation on GPU.

**GPU Compute Shaders (WebGL 2.0):**
- Physics simulations run in fragment shaders with transform feedback
- Particle positions/velocities stored in GPU textures (RGBA = vec4)
- Ping-pong render targets for state updates (read from texture A, write to texture B, swap)
- No per-frame CPU reads (only for debugging/stats)

**Instanced Rendering:**
- Particles rendered with instanced point sprites or instanced meshes
- **Single draw call** for millions of particles
- Attributes pulled from GPU texture in vertex shader
- LOD system: distant = points, close = meshes

### Quality Levels & Adaptive Performance

```typescript
const QUALITY_PRESETS = {
  ultra: {
    particleCount: 1000000,
    simulationSteps: 4,
    textureResolution: 2048,
    meshResolution: 256,
    postProcessing: ['bloom', 'motionBlur', 'chromaticAberration', 'heatDistortion']
  },
  high: {
    particleCount: 500000,
    simulationSteps: 2,
    textureResolution: 1024,
    meshResolution: 128,
    postProcessing: ['bloom', 'motionBlur']
  },
  medium: {
    particleCount: 100000,
    simulationSteps: 1,
    textureResolution: 512,
    meshResolution: 64,
    postProcessing: ['bloom']
  },
  low: {
    particleCount: 50000,
    simulationSteps: 1,
    textureResolution: 256,
    meshResolution: 32,
    postProcessing: []
  }
}
```

**Adaptive Quality System:**
- Monitor RenderEngine stats (FPS, GPU time)
- If FPS drops below target (24 FPS), reduce quality automatically
- If sustained high FPS (>30), gradually increase quality
- User can **lock quality level** or **allow adaptive**
- Quality changes happen gradually (not jarring jumps)

### FPS Management

**24 FPS Default (Cinematic Mode):**
- Frame limiter caps rendering at 24 FPS
- Physics timestep fixed at 1/24 seconds (41.67ms)
- Smoother slow-motion aesthetic
- Lower GPU load = more headroom for complexity
- Perfect for recorded output

**60 FPS Option (Smooth Mode):**
- Full 60 FPS rendering
- Physics timestep at 1/60 seconds (16.67ms)
- Better for fast-moving visuals
- Requires more GPU power

**Fixed Timestep Physics:**

```typescript
class PhysicsService {
  private accumulator = 0
  private readonly physicsDelta = 1 / this.targetFPS
  private readonly maxSubsteps = 3

  update(realDelta: number) {
    this.accumulator += realDelta

    let substeps = 0
    while (this.accumulator >= this.physicsDelta && substeps < this.maxSubsteps) {
      this.updatePhysics(this.physicsDelta)
      this.accumulator -= this.physicsDelta
      substeps++
    }

    // Prevent spiral of death
    if (this.accumulator > this.physicsDelta * 2) {
      this.accumulator = 0
    }

    this.render()
  }
}
```

This ensures **stable physics** regardless of frame rate fluctuations.

### Memory Management

**GPU Buffer Pooling:**
- Pre-allocate max-size buffers at initialization
- Reuse buffers across modes and transitions
- Avoid allocation/deallocation during performance
- Example: Transition particle buffer sized for 500K particles (ultra quality)

**Texture Atlases:**
- Color palettes packed into single 1D texture
- Noise textures (Perlin, curl) pre-generated and reused
- Reduces texture binding overhead

**Lazy Shader Compilation:**
- Compile shaders on **first use** of a mode
- Cache compiled programs in WeakMap
- Warm-up period during transition (user won't notice)
- Avoids startup time penalty

**Resource Disposal:**
```typescript
// When switching modes
oldMode.dispose() // Frees GPU resources
newMode.initialize() // Allocates new resources

// Proper disposal pattern
dispose() {
  this.geometry?.dispose()
  this.material?.dispose()
  this.renderTarget?.dispose()
  this.computeTextures.forEach(t => t.dispose())
}
```

### Mode-Specific Optimizations

| Mode | Optimization Strategy |
|------|----------------------|
| **Lava** | Downsampled simulation (256x256), bicubic upscale for display |
| **Particles** | LOD system, frustum culling, instanced rendering |
| **Soft Body** | Adaptive mesh resolution based on screen size and distance |
| **Fluid** | Multi-grid pressure solver, Jacobi iterations limited by quality |
| **Reaction-Diffusion** | Low-res simulation (128x128), upscale with bicubic filter |

### Performance Monitoring

```typescript
interface PhysicsStats {
  fps: number              // Actual frames per second
  particleCount: number    // Active particles
  gpuTime: number          // Total GPU time (ms)
  simulationTime: number   // Physics calculation (ms)
  renderTime: number       // Draw calls (ms)
  memoryUsage: number      // Estimated GPU memory (MB)
  quality: QualityLevel    // Current quality setting
  isAdaptive: boolean      // Adaptive quality enabled
}

// Usage
const stats = physicsService.getStats()
console.log(`Running at ${stats.fps} FPS with ${stats.particleCount} particles`)

// Event-based monitoring
eventBus.on('physics:stats', (stats: PhysicsStats) => {
  // Update UI performance indicators
})
```

### Target Metrics Summary

| Resolution | Mode | Target FPS | Max GPU Time | Max Memory |
|------------|------|------------|--------------|------------|
| 1080p | Cinematic (default) | 24 FPS | 40ms | 500MB |
| 1080p | Smooth | 60 FPS | 16ms | 500MB |
| 4K | Cinematic | 24 FPS | 40ms | 1GB |
| 4K | Smooth | 30 FPS | 33ms | 1GB |

**Adaptive quality ensures these targets are met across different hardware.**

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] PhysicsService base class and interface
- [ ] TransitionController with particle system
- [ ] Type definitions in types.ts
- [ ] GPU buffer pooling system
- [ ] Basic particle mode (simplest to implement)
- [ ] Integration with existing services

### Phase 2: Core Modes (Week 2-3)
- [ ] Lava mode with heat distortion
- [ ] Fluid mode (Navier-Stokes)
- [ ] Reaction-Diffusion mode
- [ ] Soft body mode (most complex)
- [ ] Parameter systems for each mode

### Phase 3: Transition System (Week 4)
- [ ] Particle deconstruction for all modes
- [ ] Morph phase with interpolation
- [ ] Reconstruction into target modes
- [ ] Transition timing and curves
- [ ] Audio-reactive turbulence during transitions

### Phase 4: Audio-Reactivity (Week 5)
- [ ] Smart default automation mappings
- [ ] Custom automation API
- [ ] LFO integration for physics parameters
- [ ] Beat-reactive impulses
- [ ] Preset system for automation

### Phase 5: Performance & Polish (Week 6)
- [ ] Quality level system
- [ ] Adaptive performance scaling
- [ ] 24/60 FPS mode switching
- [ ] Memory optimization
- [ ] Performance monitoring
- [ ] Mobile/lower-end hardware support

### Phase 6: UI Integration (Week 7)
- [ ] Mode switcher UI
- [ ] Transition time slider (0-60s)
- [ ] Dynamic parameter panels per mode
- [ ] Automation mapping interface
- [ ] Performance stats display
- [ ] Preset browser

### Phase 7: Testing & Refinement (Week 8)
- [ ] Performance testing on various hardware
- [ ] Audio-reactive testing with different music
- [ ] Transition smoothness testing
- [ ] Memory leak detection
- [ ] Documentation and examples
- [ ] Video demos for each mode

---

## Technical References

### Research & Inspiration
- **Lava Shader:** Multi-pass GLSL lava shader techniques
- **Particle Systems:** GPU Gems 3 - Chapter 30 (Real-Time Simulation)
- **Fluid Simulation:** Jos Stam - "Stable Fluids" (1999)
- **Reaction-Diffusion:** Karl Sims - "Reaction-Diffusion Tutorial"
- **WebGL Performance:** Three.js performance best practices

### External Resources
- Three.js lava shader demo: `threejs.org/examples/webgl_shader_lava.html`
- WebGPU Fluid Simulations (Codrops 2025)
- Audio-Reactive Particles with Three.js (Codrops 2023)
- Shader Park for procedural shaders

### Libraries & Tools
- **Three.js** - 3D rendering and GPU compute
- **GLSL** - Shader language for physics
- **Transform Feedback** - GPU particle updates
- **WebGL 2.0** - Required for compute capabilities

---

## Service API Reference

### PhysicsService

```typescript
class PhysicsService implements Disposable {
  // Initialization
  initialize(renderEngine: RenderEngine): void

  // Mode management
  setMode(mode: PhysicsMode, transitionTime: number): void
  getMode(): PhysicsMode
  getModeParameters(): string[]

  // Configuration
  setTargetFPS(fps: 24 | 60): void
  setQuality(quality: QualityLevel): void
  setAdaptiveQuality(enabled: boolean): void

  // Parameters
  setParameter(name: PhysicsParameter, value: number): void
  getParameter(name: PhysicsParameter): number

  // Automation (mirrors ParameterService API)
  setAutomation(mapping: AutomationMapping): void
  clearAutomation(parameter: PhysicsParameter): void
  getAutomation(parameter: PhysicsParameter): AutomationMapping | undefined
  loadAutomationPreset(name: string): void

  // Transition control
  startTransition(config: TransitionConfig): void
  isTransitioning(): boolean
  getTransitionProgress(): number
  skipTransition(): void

  // Runtime
  update(deltaTime: number): void
  render(): void

  // Performance
  getStats(): PhysicsStats

  // Lifecycle
  dispose(): void
}
```

### Events

```typescript
// Physics mode events
'physics:mode-changed': { mode: PhysicsMode }
'physics:parameters-changed': { mode: PhysicsMode, parameters: string[] }

// Transition events
'physics:transition-start': { fromMode: PhysicsMode, toMode: PhysicsMode, duration: number }
'physics:transition-progress': { progress: number }
'physics:transition-complete': { mode: PhysicsMode }

// Performance events
'physics:stats': PhysicsStats
'physics:quality-changed': { quality: QualityLevel, adaptive: boolean }
'physics:fps-changed': { fps: 24 | 60 }

// Automation events
'physics:automation-added': AutomationMapping
'physics:automation-removed': PhysicsParameter
```

---

## File Structure

```
src/
├── services/
│   └── PhysicsService.ts           # Main orchestrator
├── physics/
│   ├── modes/
│   │   ├── PhysicsMode.ts          # Interface
│   │   ├── LavaMode.ts             # Lava implementation
│   │   ├── ParticleMode.ts         # Particle implementation
│   │   ├── SoftBodyMode.ts         # Soft body implementation
│   │   ├── FluidMode.ts            # Fluid implementation
│   │   └── ReactionDiffusionMode.ts # R-D implementation
│   ├── TransitionController.ts     # Particle morphing
│   ├── GPUBufferPool.ts            # Memory management
│   └── PhysicsUtils.ts             # Shared utilities
├── shaders/
│   ├── physics/
│   │   ├── lava/
│   │   │   ├── lavaSimulation.glsl
│   │   │   ├── lavaRender.glsl
│   │   │   └── heatDistortion.glsl
│   │   ├── particles/
│   │   │   ├── particleUpdate.glsl
│   │   │   ├── particleRender.glsl
│   │   │   └── curlNoise.glsl
│   │   ├── softbody/
│   │   │   ├── springForces.glsl
│   │   │   └── verletIntegration.glsl
│   │   ├── fluid/
│   │   │   ├── advection.glsl
│   │   │   ├── divergence.glsl
│   │   │   ├── pressure.glsl
│   │   │   └── vorticity.glsl
│   │   ├── reactionDiffusion/
│   │   │   ├── grayScott.glsl
│   │   │   └── colorMapping.glsl
│   │   └── transition/
│   │       ├── particleMorph.glsl
│   │       └── reconstruction.glsl
│   └── ...
└── core/
    └── types.ts                     # Type definitions
```

---

## Success Criteria

### Functional Requirements
- ✅ All 5 physics modes implemented and working
- ✅ Smooth particle morphing transitions (0-60s)
- ✅ Mode-specific parameters (up to 11 per mode)
- ✅ Audio-reactive automation with smart defaults
- ✅ 24 FPS cinematic mode (default)
- ✅ 60 FPS smooth mode (optional)
- ✅ Adaptive quality scaling

### Performance Requirements
- ✅ 24 FPS @ 1080p sustained on mid-range GPU
- ✅ 60 FPS @ 1080p on high-end GPU
- ✅ < 40ms GPU frame time @ 24 FPS
- ✅ < 500MB GPU memory usage
- ✅ Smooth transitions without frame drops

### User Experience
- ✅ Instant mode switching with theatrical transitions
- ✅ Intuitive parameter controls per mode
- ✅ Easy automation setup
- ✅ Visual feedback during transitions
- ✅ Performance stats visible in UI

### Code Quality
- ✅ Type-safe TypeScript throughout
- ✅ Consistent with existing service architecture
- ✅ Proper GPU resource management
- ✅ No memory leaks
- ✅ Comprehensive error handling

---

## Conclusion

The Physics Service design provides a robust, performant, and visually stunning addition to the AutoVJ application. By leveraging GPU compute capabilities, mode-specific parameter optimization, and theatrical particle-morphing transitions, this system enables VJs to create captivating physics-based visuals that respond organically to audio.

The plugin-based architecture ensures maintainability and extensibility, while the adaptive performance system guarantees smooth playback across various hardware configurations. With 24 FPS as the cinematic default and comprehensive audio-reactive automation, this design is optimized for live VJ performances and high-quality recordings.

**Next Steps:**
1. Review and approve this design document
2. Create detailed implementation plan using `superpowers:writing-plans`
3. Set up git worktree for isolated development
4. Begin Phase 1 implementation (foundation)
5. Iterate and test each mode thoroughly

---

**Design Status:** ✅ **Complete - Ready for Implementation**
