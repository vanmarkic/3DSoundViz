/**
 * UIService - User interface for parameter control
 * Provides controls for all 10 parameters, presets, and monitoring
 */

import { eventBus } from '@core/EventBus'
import type {
  ParameterName,
  ParameterValues,
  RenderStats,
  Disposable
} from '@core/types'
import { ParameterService } from './ParameterService'

export class UIService implements Disposable {
  private container: HTMLElement | null = null
  private parameterService: ParameterService | null = null
  private unsubscribers: Array<() => void> = []
  private isInitialized = false
  private isVisible = true

  private controls = new Map<ParameterName, HTMLInputElement>()
  private displays = new Map<ParameterName, HTMLSpanElement>()
  private statsDisplay: HTMLDivElement | null = null

  /**
   * Initialize UI service
   */
  initialize(parameterService: ParameterService): void {
    if (this.isInitialized) {
      console.warn('UIService already initialized')
      return
    }

    this.parameterService = parameterService

    // Create UI container
    this.createUI()

    // Subscribe to parameter changes
    const unsubParam = eventBus.on('param:changed', ({ name, value }) => {
      this.updateDisplay(name, value)
    })
    this.unsubscribers.push(unsubParam)

    // Subscribe to render stats
    const unsubStats = eventBus.on('render:stats', (stats) => {
      this.updateStats(stats)
    })
    this.unsubscribers.push(unsubStats)

    // Handle keyboard shortcuts
    this.setupKeyboardShortcuts()

    this.isInitialized = true
    console.log('UIService initialized')
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Create main container
    this.container = document.createElement('div')
    this.container.id = 'ui-container'
    this.container.className = 'ui-container'
    document.body.appendChild(this.container)

    // Create header
    const header = document.createElement('div')
    header.className = 'ui-header'
    header.innerHTML = '<h2>AutoVJ Controls</h2><p>Press <kbd>H</kbd> to toggle UI</p>'
    this.container.appendChild(header)

    // Create parameters section
    const paramsSection = document.createElement('div')
    paramsSection.className = 'ui-section'
    this.container.appendChild(paramsSection)

    // Get all parameter configs
    const paramConfigs = this.parameterService?.getAllConfigs() || []

    // Create controls for each parameter
    paramConfigs.forEach((config) => {
      const control = this.createParameterControl(config.name, config.default)
      paramsSection.appendChild(control)
    })

    // Create stats section
    this.createStatsDisplay()

    // Create actions section
    this.createActionsSection()
  }

  /**
   * Create a parameter control
   */
  private createParameterControl(name: ParameterName, value: number): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'param-control'

    // Label
    const label = document.createElement('label')
    label.textContent = this.formatParameterName(name)
    label.htmlFor = `param-${name}`

    // Value display
    const display = document.createElement('span')
    display.className = 'param-value'
    display.textContent = value.toFixed(2)
    this.displays.set(name, display)

    // Slider
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.id = `param-${name}`
    slider.min = '0'
    slider.max = '1'
    slider.step = '0.01'
    slider.value = value.toString()

    // Handle input
    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const newValue = parseFloat(target.value)
      this.parameterService?.set(name, newValue)
      display.textContent = newValue.toFixed(2)
    })

    // Double-click to reset
    slider.addEventListener('dblclick', () => {
      const config = this.parameterService?.getConfig(name)
      if (config) {
        slider.value = config.default.toString()
        this.parameterService?.set(name, config.default)
      }
    })

    this.controls.set(name, slider)

    wrapper.appendChild(label)
    wrapper.appendChild(slider)
    wrapper.appendChild(display)

    return wrapper
  }

  /**
   * Create stats display
   */
  private createStatsDisplay(): void {
    this.statsDisplay = document.createElement('div')
    this.statsDisplay.className = 'ui-section ui-stats'
    this.statsDisplay.innerHTML = `
      <h3>Performance</h3>
      <div class="stats-grid">
        <div><span>FPS:</span> <span id="stat-fps">60</span></div>
        <div><span>Frame Time:</span> <span id="stat-frametime">16.67</span> ms</div>
        <div><span>Draw Calls:</span> <span id="stat-drawcalls">0</span></div>
        <div><span>Triangles:</span> <span id="stat-triangles">0</span></div>
      </div>
    `
    this.container?.appendChild(this.statsDisplay)
  }

  /**
   * Create actions section
   */
  private createActionsSection(): void {
    const actionsSection = document.createElement('div')
    actionsSection.className = 'ui-section ui-actions'

    const resetButton = document.createElement('button')
    resetButton.textContent = 'Reset All'
    resetButton.onclick = () => {
      this.parameterService?.reset()
      // Update sliders
      this.controls.forEach((slider, name) => {
        const config = this.parameterService?.getConfig(name)
        if (config) {
          slider.value = config.default.toString()
        }
      })
    }

    actionsSection.appendChild(resetButton)
    this.container?.appendChild(actionsSection)
  }

  /**
   * Update parameter display
   */
  private updateDisplay(name: ParameterName, value: number): void {
    const display = this.displays.get(name)
    const control = this.controls.get(name)

    if (display) {
      display.textContent = value.toFixed(2)
    }

    if (control) {
      control.value = value.toString()
    }
  }

  /**
   * Update stats display
   */
  private updateStats(stats: RenderStats): void {
    const fps = document.getElementById('stat-fps')
    const frametime = document.getElementById('stat-frametime')
    const drawcalls = document.getElementById('stat-drawcalls')
    const triangles = document.getElementById('stat-triangles')

    if (fps) fps.textContent = stats.fps.toFixed(0)
    if (frametime) frametime.textContent = stats.frameTime.toFixed(2)
    if (drawcalls) drawcalls.textContent = stats.drawCalls.toString()
    if (triangles) triangles.textContent = stats.triangles.toLocaleString()
  }

  /**
   * Format parameter name for display
   */
  private formatParameterName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // H - Toggle UI visibility
      if (e.key === 'h' || e.key === 'H') {
        this.toggleVisibility()
      }

      // R - Reset parameters
      if (e.key === 'r' || e.key === 'R') {
        this.parameterService?.reset()
      }

      // Number keys 1-9,0 - Quick parameter presets
      if (e.key >= '1' && e.key <= '9') {
        const presetIndex = parseInt(e.key) - 1
        this.loadQuickPreset(presetIndex)
      }
    })
  }

  /**
   * Toggle UI visibility
   */
  toggleVisibility(): void {
    this.isVisible = !this.isVisible
    if (this.container) {
      this.container.style.display = this.isVisible ? 'block' : 'none'
    }
  }

  /**
   * Load quick preset
   */
  private loadQuickPreset(index: number): void {
    // Implement quick presets
    const presets: Partial<ParameterValues>[] = [
      { complexity: 0.3, scale: 0.5, fragmentation: 0.1, colorIntensity: 0.8 }, // Minimal
      { complexity: 0.7, scale: 0.8, fragmentation: 0.6, asymmetry: 0.7 }, // Chaotic
      { complexity: 0.5, scale: 0.5, rotationSpeed: 0.8, depth: 0.7 }, // Spinning
    ]

    const preset = presets[index]
    if (preset && this.parameterService) {
      Object.entries(preset).forEach(([key, value]) => {
        this.parameterService?.set(key as ParameterName, value)
      })
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []

    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }

    this.container = null
    this.controls.clear()
    this.displays.clear()
    this.statsDisplay = null
    this.parameterService = null
    this.isInitialized = false

    console.log('UIService disposed')
  }
}
