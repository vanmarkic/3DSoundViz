/**
 * PhysicsService - Orchestrates physics simulation modes
 */

import * as THREE from 'three'
import { eventBus } from '@core/EventBus'
import type {
  PhysicsMode as PhysicsModeType,
  PhysicsParameter,
  PhysicsConfig,
  PhysicsStats,
  QualityLevel,
  AudioData,
  Disposable,
  TransitionConfig
} from '@core/types'
import type { RenderEngine } from './RenderEngine'
import type { PhysicsMode, PhysicsModeParams } from '@physics/modes/PhysicsMode'
import { ParticleMode } from '@physics/modes/ParticleMode'
import { GPUBufferPool } from '@physics/GPUBufferPool'

export class PhysicsService implements Disposable {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer | null = null
  private renderEngine: RenderEngine | null = null

  private currentMode: PhysicsMode | null = null
  private activeModeName: PhysicsModeType = 'particles'

  private modeRegistry = new Map<PhysicsModeType, () => PhysicsMode>()
  private modeInstances = new Map<PhysicsModeType, PhysicsMode>()

  private bufferPool: GPUBufferPool
  private parameters: PhysicsModeParams = {}

  private config: PhysicsConfig = {
    mode: 'particles',
    targetFPS: 24,
    quality: 'high',
    adaptiveQuality: false
  }

  private accumulator = 0
  private physicsDelta = 1 / 24 // Fixed timestep
  private maxSubsteps = 3

  private isInitialized = false
  private unsubscribers: Array<() => void> = []

  private lastFrameTime = 0
  private frameCount = 0
  private fpsAccumulator = 0

  constructor() {
    this.scene = new THREE.Scene()
    this.bufferPool = new GPUBufferPool()

    // Register available modes
    this.modeRegistry.set('particles', () => new ParticleMode())
    // More modes will be registered here as we implement them
  }

  initialize(renderEngine: RenderEngine): void {
    if (this.isInitialized) {
      console.warn('PhysicsService already initialized')
      return
    }

    this.renderEngine = renderEngine
    this.renderer = renderEngine.getRenderer()

    // Initialize default mode
    this.setMode('particles', 0)

    // Subscribe to audio data
    const unsubAudio = eventBus.on('audio:data', (audioData) => {
      this.updateFromAudio(audioData)
    })
    this.unsubscribers.push(unsubAudio)

    this.isInitialized = true
    console.log('PhysicsService initialized in mode:', this.activeModeName)
  }

  setMode(mode: PhysicsModeType, transitionTime: number = 0): void {
    if (!this.modeRegistry.has(mode)) {
      console.error(`Physics mode "${mode}" not registered`)
      return
    }

    // For now, simple instant switch (transition system comes later)
    if (this.currentMode) {
      this.currentMode.dispose()
      this.modeInstances.delete(this.activeModeName)
    }

    // Create or get mode instance
    let modeInstance = this.modeInstances.get(mode)
    if (!modeInstance) {
      const factory = this.modeRegistry.get(mode)!
      modeInstance = factory()
      modeInstance.initialize(this.scene, this.renderer!)
      this.modeInstances.set(mode, modeInstance)
    }

    this.currentMode = modeInstance
    this.activeModeName = mode

    // Initialize parameters for this mode
    this.initializeModeParameters()

    eventBus.emit('physics:mode-changed', { mode })
    eventBus.emit('physics:parameters-changed', {
      mode,
      parameters: Array.from(modeInstance.parameters)
    })

    console.log('PhysicsService switched to mode:', mode)
  }

  private initializeModeParameters(): void {
    if (!this.currentMode) return

    // Set default values for all parameters
    this.parameters = {}
    this.currentMode.parameters.forEach(param => {
      this.parameters[param] = 0.5 // Default mid-range
    })

    // Mode-specific defaults
    if (this.activeModeName === 'particles') {
      this.parameters['particleCount'] = 0.2 // 20% of max (100K)
      this.parameters['gravity'] = 0.3
      this.parameters['attraction'] = 0.5
      this.parameters['size'] = 0.2
      this.parameters['glow'] = 0.5
      this.parameters['speed'] = 0.5
    }
  }

  getMode(): PhysicsModeType {
    return this.activeModeName
  }

  getModeParameters(): string[] {
    return this.currentMode ? Array.from(this.currentMode.parameters) : []
  }

  setParameter(name: PhysicsParameter, value: number): void {
    if (!this.currentMode) return

    if (this.currentMode.parameters.includes(name as any)) {
      this.parameters[name] = Math.max(0, Math.min(1, value))
    } else {
      console.warn(`Parameter "${name}" not valid for mode "${this.activeModeName}"`)
    }
  }

  getParameter(name: PhysicsParameter): number {
    return this.parameters[name] ?? 0
  }

  setTargetFPS(fps: 24 | 60): void {
    this.config.targetFPS = fps
    this.physicsDelta = 1 / fps
    eventBus.emit('physics:fps-changed', { fps })
  }

  setQuality(quality: QualityLevel): void {
    this.config.quality = quality
    eventBus.emit('physics:quality-changed', {
      quality,
      adaptive: this.config.adaptiveQuality
    })
  }

  setAdaptiveQuality(enabled: boolean): void {
    this.config.adaptiveQuality = enabled
    eventBus.emit('physics:quality-changed', {
      quality: this.config.quality,
      adaptive: enabled
    })
  }

  private updateFromAudio(audioData: AudioData): void {
    // Audio-reactive parameter updates
    // For now, just pass through to update
  }

  update(deltaTime: number, audioData?: AudioData): void {
    if (!this.currentMode) return

    // Fixed timestep physics
    this.accumulator += deltaTime

    let substeps = 0
    while (this.accumulator >= this.physicsDelta && substeps < this.maxSubsteps) {
      this.currentMode.update(this.physicsDelta, this.parameters, audioData!)
      this.accumulator -= this.physicsDelta
      substeps++
    }

    // Prevent spiral of death
    if (this.accumulator > this.physicsDelta * 2) {
      this.accumulator = 0
    }

    // Calculate FPS
    const now = performance.now()
    if (this.lastFrameTime > 0) {
      const frameDelta = (now - this.lastFrameTime) / 1000
      this.fpsAccumulator += 1 / frameDelta
      this.frameCount++

      if (this.frameCount >= 30) {
        const avgFPS = this.fpsAccumulator / this.frameCount
        const stats = this.getStats()
        stats.fps = avgFPS
        eventBus.emit('physics:stats', stats)

        this.fpsAccumulator = 0
        this.frameCount = 0
      }
    }
    this.lastFrameTime = now
  }

  render(): void {
    if (!this.currentMode) return
    this.currentMode.render(this.scene)
  }

  getStats(): PhysicsStats {
    return {
      fps: 0, // Calculated in update
      particleCount: this.currentMode?.getParticleCount() ?? 0,
      gpuTime: 0, // Will implement with WebGL timer queries
      simulationTime: 0,
      renderTime: 0,
      memoryUsage: this.bufferPool.getMemoryUsage(),
      quality: this.config.quality
    }
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []

    this.currentMode?.dispose()
    this.modeInstances.forEach(mode => mode.dispose())
    this.modeInstances.clear()

    this.bufferPool.dispose()

    this.isInitialized = false
    console.log('PhysicsService disposed')
  }
}
