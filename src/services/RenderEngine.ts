/**
 * RenderEngine - Optimized WebGL rendering with Three.js
 * Handles scene rendering, post-processing, and performance monitoring
 */

import * as THREE from 'three'
import Stats from 'stats.js'
import { eventBus } from '@core/EventBus'
import type {
  RenderConfig,
  RenderStats,
  QualityLevel,
  Disposable
} from '@core/types'

export class RenderEngine implements Disposable {
  private renderer: THREE.WebGLRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private stats: Stats | null = null

  private config: RenderConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    antialias: true,
    quality: 'high',
    targetFPS: 60
  }

  private isInitialized = false
  private frameCount = 0
  private lastStatsUpdate = 0
  private readonly STATS_UPDATE_INTERVAL = 1000 // ms

  /**
   * Initialize render engine
   */
  initialize(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>): void {
    if (this.isInitialized) {
      console.warn('RenderEngine already initialized')
      return
    }

    this.canvas = canvas

    if (config) {
      this.config = { ...this.config, ...config }
    }

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    })

    this.renderer.setSize(this.config.width, this.config.height, false)
    this.renderer.setPixelRatio(this.config.pixelRatio)
    this.renderer.setClearColor(0x000000, 1)

    // Enable optimal settings
    this.renderer.shadowMap.enabled = false // Disabled for performance
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Apply quality settings
    this.applyQualitySettings(this.config.quality)

    // Initialize stats monitor
    this.stats = new Stats()
    this.stats.showPanel(0) // FPS panel
    document.body.appendChild(this.stats.dom)
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.top = '0'
    this.stats.dom.style.left = '0'
    this.stats.dom.style.zIndex = '1000'

    this.isInitialized = true

    eventBus.emit('render:initialized', this.config)
    console.log('RenderEngine initialized:', this.config)
  }

  /**
   * Apply quality settings
   */
  private applyQualitySettings(quality: QualityLevel): void {
    if (!this.renderer) return

    const gl = this.renderer.getContext()

    switch (quality) {
      case 'low':
        this.renderer.setPixelRatio(1)
        this.renderer.shadowMap.enabled = false
        break

      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        this.renderer.shadowMap.enabled = false
        break

      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.shadowMap.enabled = false
        break

      case 'ultra':
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        break
    }
  }

  /**
   * Render a scene
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.renderer || !this.isInitialized) {
      console.warn('RenderEngine not initialized')
      return
    }

    // Begin stats monitoring
    this.stats?.begin()

    // Render scene
    this.renderer.render(scene, camera)

    // End stats monitoring
    this.stats?.end()

    // Update frame count and stats
    this.frameCount++

    const now = performance.now()
    if (now - this.lastStatsUpdate > this.STATS_UPDATE_INTERVAL) {
      this.emitRenderStats()
      this.lastStatsUpdate = now
    }
  }

  /**
   * Emit render statistics
   */
  private emitRenderStats(): void {
    if (!this.renderer) return

    const info = this.renderer.info

    const fps = (this.stats as any)?.fps ?? 60

    const stats: RenderStats = {
      fps,
      frameTime: 1000 / fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0
    }

    eventBus.emit('render:stats', stats)
  }

  /**
   * Set render resolution
   */
  setResolution(width: number, height: number): void {
    if (!this.renderer || !this.canvas) return

    this.config.width = width
    this.config.height = height

    this.renderer.setSize(width, height, false)
    this.canvas.width = width
    this.canvas.height = height
  }

  /**
   * Set quality level
   */
  setQuality(quality: QualityLevel): void {
    this.config.quality = quality
    this.applyQualitySettings(quality)
    eventBus.emit('render:quality-changed', quality)
    console.log('Quality changed to:', quality)
  }

  /**
   * Get current configuration
   */
  getConfig(): RenderConfig {
    return { ...this.config }
  }

  /**
   * Get renderer instance
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer
  }

  /**
   * Handle window resize
   */
  handleResize(width: number, height: number): void {
    this.setResolution(width, height)
  }

  /**
   * Clear scene
   */
  clear(): void {
    this.renderer?.clear()
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.stats?.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom)
    }
    this.stats = null

    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.forceContextLoss()
      this.renderer = null
    }

    this.canvas = null
    this.isInitialized = false

    console.log('RenderEngine disposed')
  }
}
