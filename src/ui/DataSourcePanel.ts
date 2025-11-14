/**
 * DataSourcePanel - UI for managing external data sources
 * Allows users to select public APIs/WebSockets and map data to visual parameters
 */

import { eventBus } from '@core/EventBus'
import type { DataSource, DataSourceMapping, ParameterName } from '@core/types'
import { DataSourceService } from '../services/DataSourceService'
import { PUBLIC_DATA_SOURCES } from '../data/publicDataSources'

export class DataSourcePanel {
  private container: HTMLElement
  private dataSourceService: DataSourceService
  private panel: HTMLDivElement | null = null
  private isVisible = false

  constructor(container: HTMLElement, dataSourceService: DataSourceService) {
    this.container = container
    this.dataSourceService = dataSourceService
    this.createPanel()
  }

  /**
   * Create the data source panel UI
   */
  private createPanel(): void {
    this.panel = document.createElement('div')
    this.panel.id = 'data-source-panel'
    this.panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      color: #fff;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      overflow-y: auto;
      z-index: 999;
      display: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `

    // Title
    const title = document.createElement('h3')
    title.textContent = 'Data Sources'
    title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px; color: #4A9EFF;'
    this.panel.appendChild(title)

    // Close button
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
    `
    closeBtn.onclick = () => this.hide()
    this.panel.appendChild(closeBtn)

    // Create content sections
    const content = document.createElement('div')

    // Section 1: Public APIs
    const publicSection = document.createElement('div')
    publicSection.innerHTML = '<h4 style="color: #4A9EFF; margin: 15px 0 10px 0;">Public APIs</h4>'

    PUBLIC_DATA_SOURCES.slice(0, 5).forEach((template) => {
      const item = document.createElement('div')
      item.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        padding: 10px;
        margin-bottom: 8px;
        border-radius: 4px;
        cursor: pointer;
      `

      item.innerHTML = `
        <div style="font-weight: bold;">${template.name}</div>
        <div style="font-size: 10px; color: #aaa; margin: 4px 0;">${template.description}</div>
      `

      const addBtn = document.createElement('button')
      addBtn.textContent = '+ Add'
      addBtn.style.cssText = `
        background: #4A9EFF;
        border: none;
        color: #fff;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      `
      addBtn.onclick = () => this.addSourceFromTemplate(template)

      item.appendChild(addBtn)
      publicSection.appendChild(item)
    })

    content.appendChild(publicSection)

    // Section 2: Active sources
    const activeSection = document.createElement('div')
    activeSection.innerHTML = '<h4 style="color: #4A9EFF; margin: 15px 0 10px 0;">Active Sources</h4>'
    activeSection.id = 'active-sources-container'

    content.appendChild(activeSection)

    this.panel.appendChild(content)
    this.container.appendChild(this.panel)

    // Update active sources periodically
    setInterval(() => this.updateActiveSources(), 1000)
  }

  /**
   * Update active sources display
   */
  private updateActiveSources(): void {
    const container = document.getElementById('active-sources-container')
    if (!container) return

    // Keep title
    const title = container.querySelector('h4')
    container.innerHTML = ''
    if (title) container.appendChild(title)

    const sources = this.dataSourceService.getDataSources()

    if (sources.length === 0) {
      const empty = document.createElement('div')
      empty.textContent = 'No active sources'
      empty.style.cssText = 'color: #666; font-size: 11px; padding: 10px;'
      container.appendChild(empty)
      return
    }

    sources.forEach((source) => {
      const item = document.createElement('div')
      item.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        padding: 8px;
        margin-bottom: 6px;
        border-radius: 4px;
      `

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: bold;">${source.name}</span>
          <span style="color: ${source.enabled ? '#4CAF50' : '#666'};">
            ${source.enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      `

      const removeBtn = document.createElement('button')
      removeBtn.textContent = 'Remove'
      removeBtn.style.cssText = `
        background: #f44336;
        border: none;
        color: #fff;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        margin-top: 4px;
      `
      removeBtn.onclick = () => this.dataSourceService.removeDataSource(source.id)

      item.appendChild(removeBtn)
      container.appendChild(item)
    })
  }

  /**
   * Add source from template
   */
  private addSourceFromTemplate(template: any): void {
    const source: DataSource = {
      ...template.source,
      id: `${template.source.type}-${Date.now()}`,
      enabled: true,
    }

    this.dataSourceService.addDataSource(source)

    // Auto-add suggested mapping
    if (template.suggestedMappings && template.suggestedMappings.length > 0) {
      const firstMapping = template.suggestedMappings[0]
      const mapping: DataSourceMapping = {
        sourceId: source.id,
        dataPath: firstMapping.dataPath,
        parameter: firstMapping.suggestedParameter,
        scale: [0, 100],
        range: [0, 1],
        curve: 'linear',
      }
      this.dataSourceService.addMapping(mapping)
    }

    console.log(`✅ Added data source: ${source.name}`)
  }

  /**
   * Show panel
   */
  show(): void {
    if (this.panel) {
      this.panel.style.display = 'block'
      this.isVisible = true
    }
  }

  /**
   * Hide panel
   */
  hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none'
      this.isVisible = false
    }
  }

  /**
   * Toggle panel visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
}
