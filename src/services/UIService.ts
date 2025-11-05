/**
 * UIService - User interface for parameter control
 * Provides controls for all 10 parameters, presets, and monitoring
 */

import { eventBus } from '@core/EventBus'
import type {
  ParameterName,
  ParameterValues,
  RenderStats,
  AudioSensitivity,
  Disposable
} from '@core/types'
import { ParameterService } from './ParameterService'

/**
 * Interface for AudioService - defines the contract for audio functionality
 */
interface AudioServiceInterface {
  setMasterSensitivity(percent: number): void
  setLowSensitivity(percent: number): void
  setMidSensitivity(percent: number): void
  setHighSensitivity(percent: number): void
  getSensitivities(): AudioSensitivity
}

export class UIService implements Disposable {
  private container: HTMLElement | null = null
  private parameterService: ParameterService | null = null
  private audioService: AudioServiceInterface | null = null
  private unsubscribers: Array<() => void> = []
  private isInitialized = false
  private isVisible = true

  private controls = new Map<ParameterName, HTMLInputElement>()
  private displays = new Map<ParameterName, HTMLSpanElement>()
  private statsDisplay: HTMLDivElement | null = null
  private sensitivityContainer: HTMLElement | null = null
  private saveSensitivityTimeout: number | null = null
  private readonly SAVE_DEBOUNCE_MS = 500

  /**
   * Initialize UI service
   */
  initialize(parameterService: ParameterService, audioService?: AudioServiceInterface): void {
    if (this.isInitialized) {
      console.warn('UIService already initialized')
      return
    }

    this.parameterService = parameterService
    this.audioService = audioService

    // Create UI container
    this.createUI()

    // Create sensitivity controls if audioService provided
    if (this.audioService) {
      this.createSensitivityControls()
    }

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

    // Create color palette browser section
    this.createPaletteBrowser()

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
   * Create color palette browser
   */
  private createPaletteBrowser(): void {
    const paletteSection = document.createElement('div')
    paletteSection.className = 'ui-section ui-palettes'

    const header = document.createElement('h3')
    header.textContent = 'Color Palettes'
    paletteSection.appendChild(header)

    // Define color palettes
    const palettes = [
      { name: 'Constructivist', colors: ['#FF0000', '#000000', '#FFFFFF', '#FFD700', '#0000FF'] },
      { name: 'Neon', colors: ['#FF006E', '#00F5FF', '#FFBE0B', '#8338EC', '#3A86FF'] },
      { name: 'Sunset', colors: ['#FF4500', '#FF6347', '#FF7F50', '#FF8C00', '#FFD700'] },
      { name: 'Ocean', colors: ['#006994', '#0080A8', '#0096BB', '#00ACCF', '#00C2E3'] },
      { name: 'Forest', colors: ['#2D5016', '#3F6D1E', '#518A27', '#63A72F', '#75C437'] },
      { name: 'Monochrome', colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'] },
      { name: 'Pastel', colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'] },
      { name: 'Cyberpunk', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#00FF80'] }
    ]

    const paletteGrid = document.createElement('div')
    paletteGrid.className = 'palette-grid'

    palettes.forEach((palette) => {
      const paletteItem = document.createElement('div')
      paletteItem.className = 'palette-item'
      paletteItem.title = palette.name

      // Create color swatches
      const swatches = document.createElement('div')
      swatches.className = 'palette-swatches'
      palette.colors.forEach((color) => {
        const swatch = document.createElement('div')
        swatch.className = 'color-swatch'
        swatch.style.backgroundColor = color
        swatches.appendChild(swatch)
      })

      const label = document.createElement('div')
      label.className = 'palette-label'
      label.textContent = palette.name

      paletteItem.appendChild(swatches)
      paletteItem.appendChild(label)

      // Click to apply palette
      paletteItem.onclick = () => {
        // Get VisualService from container and update palette
        const visualService = (window as any).autoVJ?.visualService
        if (visualService && typeof visualService.setColorPalette === 'function') {
          visualService.setColorPalette(palette.colors)
          console.log('🎨 Palette changed to:', palette.name)
        }
        // Visual feedback
        document.querySelectorAll('.palette-item').forEach((item) => {
          item.classList.remove('active')
        })
        paletteItem.classList.add('active')
      }

      paletteGrid.appendChild(paletteItem)
    })

    paletteSection.appendChild(paletteGrid)
    this.container?.appendChild(paletteSection)

    // Set first palette as active
    setTimeout(() => {
      paletteGrid.querySelector('.palette-item')?.classList.add('active')
    }, 0)
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
   * Add audio controls after initial initialization
   * Called when audioService becomes available
   */
  addAudioControls(audioService: AudioServiceInterface): void {
    if (!audioService) {
      console.warn('Cannot add audio controls: audioService is null')
      return
    }

    if (this.sensitivityContainer) {
      console.log('Audio controls already exist')
      return
    }

    this.audioService = audioService
    this.createSensitivityControls()
    console.log('✅ Audio sensitivity controls added')
  }

  /**
   * Create sensitivity control panel
   */
  private createSensitivityControls(): void {
    // Find or create container
    this.sensitivityContainer = document.createElement('div')
    this.sensitivityContainer.id = 'sensitivity-controls'
    this.sensitivityContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 8px;
      color: white;
      font-family: monospace;
      min-width: 250px;
      z-index: 1000;
    `
    document.body.appendChild(this.sensitivityContainer)

    // Create sensitivity panel
    const panel = document.createElement('div')
    panel.innerHTML = `
      <h3 style="margin: 0 0 15px 0; font-size: 14px;">Audio Sensitivity</h3>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Master</label>
        <input type="range" id="master-sensitivity" min="5" max="300" value="100"
               style="width: 100%;" />
        <span id="master-value" style="font-size: 11px;">100%</span>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Low (Bass)</label>
        <input type="range" id="low-sensitivity" min="5" max="300" value="100"
               style="width: 100%;" />
        <span id="low-value" style="font-size: 11px;">100%</span>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Mid</label>
        <input type="range" id="mid-sensitivity" min="5" max="300" value="100"
               style="width: 100%;" />
        <span id="mid-value" style="font-size: 11px;">100%</span>
      </div>

      <div class="control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">High (Treble)</label>
        <input type="range" id="high-sensitivity" min="5" max="300" value="100"
               style="width: 100%;" />
        <span id="high-value" style="font-size: 11px;">100%</span>
      </div>
    `

    this.sensitivityContainer.appendChild(panel)

    // Hook up event listeners
    this.attachSensitivityListeners()
  }

  /**
   * Attach event listeners to sensitivity sliders
   */
  private attachSensitivityListeners(): void {
    const masterSlider = document.getElementById('master-sensitivity') as HTMLInputElement
    const lowSlider = document.getElementById('low-sensitivity') as HTMLInputElement
    const midSlider = document.getElementById('mid-sensitivity') as HTMLInputElement
    const highSlider = document.getElementById('high-sensitivity') as HTMLInputElement

    const masterValue = document.getElementById('master-value')
    const lowValue = document.getElementById('low-value')
    const midValue = document.getElementById('mid-value')
    const highValue = document.getElementById('high-value')

    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        if (!this.audioService) return
        const value = parseInt((e.target as HTMLInputElement).value)
        this.audioService.setMasterSensitivity(value)
        if (masterValue) masterValue.textContent = `${value}%`
        this.debouncedSaveSensitivity()
      })
    }

    if (lowSlider) {
      lowSlider.addEventListener('input', (e) => {
        if (!this.audioService) return
        const value = parseInt((e.target as HTMLInputElement).value)
        this.audioService.setLowSensitivity(value)
        if (lowValue) lowValue.textContent = `${value}%`
        this.debouncedSaveSensitivity()
      })
    }

    if (midSlider) {
      midSlider.addEventListener('input', (e) => {
        if (!this.audioService) return
        const value = parseInt((e.target as HTMLInputElement).value)
        this.audioService.setMidSensitivity(value)
        if (midValue) midValue.textContent = `${value}%`
        this.debouncedSaveSensitivity()
      })
    }

    if (highSlider) {
      highSlider.addEventListener('input', (e) => {
        if (!this.audioService) return
        const value = parseInt((e.target as HTMLInputElement).value)
        this.audioService.setHighSensitivity(value)
        if (highValue) highValue.textContent = `${value}%`
        this.debouncedSaveSensitivity()
      })
    }

    // Load current values from AudioService
    this.loadCurrentSensitivityValues()
  }

  /**
   * Load current sensitivity values from AudioService into UI
   */
  private loadCurrentSensitivityValues(): void {
    if (!this.audioService) return

    const sensitivities = this.audioService.getSensitivities()

    // Update sliders
    const masterSlider = document.getElementById('master-sensitivity') as HTMLInputElement
    const lowSlider = document.getElementById('low-sensitivity') as HTMLInputElement
    const midSlider = document.getElementById('mid-sensitivity') as HTMLInputElement
    const highSlider = document.getElementById('high-sensitivity') as HTMLInputElement

    // Update value displays
    const masterValue = document.getElementById('master-value')
    const lowValue = document.getElementById('low-value')
    const midValue = document.getElementById('mid-value')
    const highValue = document.getElementById('high-value')

    if (masterSlider) {
      masterSlider.value = sensitivities.master.toString()
      if (masterValue) masterValue.textContent = `${sensitivities.master}%`
    }

    if (lowSlider) {
      lowSlider.value = sensitivities.low.toString()
      if (lowValue) lowValue.textContent = `${sensitivities.low}%`
    }

    if (midSlider) {
      midSlider.value = sensitivities.mid.toString()
      if (midValue) midValue.textContent = `${sensitivities.mid}%`
    }

    if (highSlider) {
      highSlider.value = sensitivities.high.toString()
      if (highValue) highValue.textContent = `${sensitivities.high}%`
    }
  }

  /**
   * Debounced save to config
   */
  private debouncedSaveSensitivity(): void {
    if (this.saveSensitivityTimeout !== null) {
      clearTimeout(this.saveSensitivityTimeout)
    }

    this.saveSensitivityTimeout = window.setTimeout(() => {
      if (this.audioService) {
        const sensitivity = this.audioService.getSensitivities()

        // Send to Electron main process
        if ((window as any).electron) {
          (window as any).electron.ipcRenderer.invoke('save-audio-sensitivity', sensitivity)
            .then(() => console.log('Sensitivity saved to config'))
            .catch((err: Error) => console.error('Failed to save sensitivity:', err))
        }
      }
    }, this.SAVE_DEBOUNCE_MS)
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

    if (this.sensitivityContainer?.parentElement) {
      this.sensitivityContainer.parentElement.removeChild(this.sensitivityContainer)
    }

    if (this.saveSensitivityTimeout !== null) {
      clearTimeout(this.saveSensitivityTimeout)
    }

    this.container = null
    this.sensitivityContainer = null
    this.controls.clear()
    this.displays.clear()
    this.statsDisplay = null
    this.parameterService = null
    this.audioService = null
    this.isInitialized = false

    console.log('UIService disposed')
  }
}
