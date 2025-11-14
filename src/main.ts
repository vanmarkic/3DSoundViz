/**
 * AutoVJ - Main Application Entry Point
 * Production-ready auto VJ solution with constructivist/deconstructivist aesthetics
 */

import { AudioService } from '@services/AudioService'
import { ParameterService } from '@services/ParameterService'
import { LFOService } from '@services/LFOService'
import { RenderEngine } from '@services/RenderEngine'
import { VisualService } from '@services/VisualService'
import { UIService } from '@services/UIService'
import { DataSourceService } from '@services/DataSourceService'
import { DataSourcePanel } from './ui/DataSourcePanel'
import { container } from '@core/ServiceContainer'
import { eventBus } from '@core/EventBus'
import type { AudioData, ParameterValues } from '@core/types'

class AutoVJApp {
  private canvas: HTMLCanvasElement | null = null
  private animationFrameId: number | null = null

  // Services
  private audioService: AudioService | null = null
  private parameterService: ParameterService | null = null
  private lfoService: LFOService | null = null
  private renderEngine: RenderEngine | null = null
  private visualService: VisualService | null = null
  private uiService: UIService | null = null
  private dataSourceService: DataSourceService | null = null
  private dataSourcePanel: DataSourcePanel | null = null

  // State
  private isRunning = false
  private lastFrameTime = 0
  private currentAudioData: AudioData | null = null

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    console.log('🎨 Initializing AutoVJ...')

    try {
      // Get or create canvas
      this.canvas = document.getElementById('app-canvas') as HTMLCanvasElement
      if (!this.canvas) {
        this.canvas = document.createElement('canvas')
        this.canvas.id = 'app-canvas'
        document.body.appendChild(this.canvas)
      }

      // Initialize services
      this.initializeServices()

      // Subscribe to audio data
      eventBus.on('audio:data', (audioData) => {
        this.currentAudioData = audioData
      })

      // Subscribe to beat events
      eventBus.on('audio:beat', (beatData) => {
        console.log('🥁 Beat detected:', beatData.energy.toFixed(2))
      })

      // Handle window resize
      window.addEventListener('resize', () => this.handleResize())

      // Show ready message
      console.log('✅ AutoVJ initialized successfully!')
      console.log('📱 Controls:')
      console.log('  - H: Toggle UI')
      console.log('  - D: Toggle Data Sources')
      console.log('  - R: Reset parameters')
      console.log('  - 1-9: Quick presets')
      console.log('  - Double-click slider: Reset to default')

      // Show audio permission prompt
      await this.requestAudioPermission()

      // Start animation loop
      this.start()

    } catch (error) {
      console.error('❌ Failed to initialize AutoVJ:', error)
      this.showError(error as Error)
    }
  }

  /**
   * Detect if running on mobile device
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768)
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    const isMobile = this.isMobileDevice()

    // Create services
    this.audioService = new AudioService()
    this.parameterService = new ParameterService()
    this.lfoService = new LFOService()
    this.renderEngine = new RenderEngine()
    this.visualService = new VisualService()
    this.uiService = new UIService()
    this.dataSourceService = new DataSourceService()

    // Register in container
    container.registerInstance('audioService', this.audioService)
    container.registerInstance('parameterService', this.parameterService)
    container.registerInstance('lfoService', this.lfoService)
    container.registerInstance('renderEngine', this.renderEngine)
    container.registerInstance('visualService', this.visualService)
    container.registerInstance('uiService', this.uiService)
    container.registerInstance('dataSourceService', this.dataSourceService)

    // Initialize services
    this.parameterService.initialize()
    this.lfoService.initialize(this.parameterService)

    if (this.canvas) {
      // Mobile-optimized settings
      this.renderEngine.initialize(this.canvas, {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
        antialias: !isMobile, // Disable AA on mobile for performance
        quality: isMobile ? 'medium' : 'high',
        targetFPS: isMobile ? 30 : 60
      })
    }

    this.visualService.initialize(this.renderEngine)
    this.uiService.initialize(this.parameterService)
    this.dataSourceService.initialize()

    // Create data source panel
    this.dataSourcePanel = new DataSourcePanel(document.body, this.dataSourceService)

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts()

    // Create some default LFOs
    this.createDefaultLFOs()

    // Set up some default automations
    this.setupDefaultAutomations()

    if (isMobile) {
      console.log('📱 Mobile device detected - using optimized settings')
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'h':
          // Toggle UI visibility (existing functionality)
          break
        case 'd':
          // Toggle data source panel
          this.dataSourcePanel?.toggle()
          break
        case 'r':
          // Reset parameters (existing functionality)
          break
      }
    })
  }

  /**
   * Create default LFOs
   */
  private createDefaultLFOs(): void {
    if (!this.lfoService) return

    // LFO 1: Slow sine for rotation speed
    const lfo1 = this.lfoService.createLFO({
      waveform: 'sine',
      mode: 'free',
      frequency: 0.2,
      division: '1/4',
      phase: 0,
      amplitude: 0.3,
      offset: 0.5,
      enabled: false // Disabled by default
    })

    // LFO 2: Triangle for scale
    const lfo2 = this.lfoService.createLFO({
      waveform: 'triangle',
      mode: 'synced',
      frequency: 1,
      division: '1/2',
      phase: 0,
      amplitude: 0.2,
      offset: 0.5,
      enabled: false // Disabled by default
    })

    console.log('Created default LFOs:', lfo1, lfo2)
  }

  /**
   * Set up default audio automation
   */
  private setupDefaultAutomations(): void {
    if (!this.parameterService) return

    // Map bass to scale
    this.parameterService.setAutomation({
      parameter: 'scale',
      source: 'audio:bass',
      amount: 0.5,
      range: [0.3, 1.0],
      curve: 'exponential'
    })

    // Map mid frequencies to rotation speed
    this.parameterService.setAutomation({
      parameter: 'rotationSpeed',
      source: 'audio:mid',
      amount: 0.3,
      range: [0.1, 0.8],
      curve: 'linear'
    })

    // Map treble to color intensity
    this.parameterService.setAutomation({
      parameter: 'colorIntensity',
      source: 'audio:treble',
      amount: 0.4,
      range: [0.5, 1.0],
      curve: 'linear'
    })

    console.log('✓ Default automations configured')
  }

  /**
   * Request audio permission and initialize
   */
  private async requestAudioPermission(): Promise<void> {
    const overlay = document.createElement('div')
    overlay.className = 'audio-permission-overlay'
    overlay.innerHTML = `
      <div class="permission-dialog">
        <h2>🎵 AutoVJ</h2>
        <p>This application needs access to your microphone for audio visualization.</p>
        <button id="allow-audio">Allow Microphone Access</button>
      </div>
    `
    document.body.appendChild(overlay)

    return new Promise((resolve, reject) => {
      const button = document.getElementById('allow-audio')
      if (button) {
        button.onclick = async () => {
          try {
            if (this.audioService) {
              await this.audioService.initialize({
                deviceId: 'default',
                channelCount: 2,
                sampleRate: 48000,
                fftSize: 2048,
                smoothingTimeConstant: 0.8
              })
              overlay.remove()
              resolve()
            }
          } catch (error) {
            reject(error)
          }
        }
      }
    })
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.animate()

    console.log('▶️  Animation loop started')
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    console.log('⏸️  Animation loop stopped')
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000 // seconds
    this.lastFrameTime = currentTime

    // Update LFOs
    this.lfoService?.update(deltaTime)

    // Get current parameters
    const params = this.parameterService?.getAll() as ParameterValues

    // Update visuals with parameters and audio
    if (this.currentAudioData && params) {
      this.visualService?.update(params, this.currentAudioData)
    }

    // Render scene
    const scene = this.visualService?.getScene()
    const camera = this.visualService?.getCamera()
    if (scene && camera) {
      this.renderEngine?.render(scene, camera)
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight

    this.renderEngine?.handleResize(width, height)
    this.visualService?.handleResize(width, height)

    console.log('📐 Resized to', width, 'x', height)
  }

  /**
   * Show error message
   */
  private showError(error: Error): void {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-overlay'
    errorDiv.innerHTML = `
      <div class="error-dialog">
        <h2>❌ Error</h2>
        <p>${error.message}</p>
        <p>Check the console for more details.</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `
    document.body.appendChild(errorDiv)
  }

  /**
   * Dispose all resources
   */
  async dispose(): Promise<void> {
    this.stop()

    // Dispose services
    this.dataSourceService?.dispose()
    this.uiService?.dispose()
    this.visualService?.dispose()
    this.renderEngine?.dispose()
    this.lfoService?.dispose()
    this.parameterService?.dispose()
    this.audioService?.dispose()

    // Clear container
    await container.disposeAll()

    console.log('🗑️  AutoVJ disposed')
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AutoVJApp()
    app.initialize()

    // Expose for debugging
    ;(window as any).autoVJ = app
  })
} else {
  const app = new AutoVJApp()
  app.initialize()

  // Expose for debugging
  ;(window as any).autoVJ = app
}
