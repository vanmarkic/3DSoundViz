/**
 * DataSourceService - Manage external data sources (APIs, WebSockets)
 * Allows using external data to drive visual parameters instead of audio
 */

import { eventBus } from '@core/EventBus'
import type {
  DataSource,
  APIDataSource,
  WebSocketDataSource,
  DataPoint,
  DataSourceMapping,
  ParameterName,
  Disposable,
} from '@core/types'

interface ActiveConnection {
  source: DataSource
  connection?: WebSocket | number
  lastData: DataPoint[]
}

export class DataSourceService implements Disposable {
  private sources: Map<string, DataSource> = new Map()
  private connections: Map<string, ActiveConnection> = new Map()
  private mappings: Map<string, DataSourceMapping> = new Map()
  private latestData: Map<string, DataPoint[]> = new Map()

  private isInitialized = false

  constructor() {}

  /**
   * Initialize the service
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('DataSourceService already initialized')
      return
    }

    this.isInitialized = true
    console.log('DataSourceService initialized')
  }

  /**
   * Add a new data source
   */
  addDataSource(source: DataSource): void {
    this.sources.set(source.id, source)

    if (source.enabled) {
      this.connectDataSource(source)
    }

    eventBus.emit('datasource:added', source)
  }

  /**
   * Remove a data source
   */
  removeDataSource(sourceId: string): void {
    this.disconnectDataSource(sourceId)
    this.sources.delete(sourceId)
    this.latestData.delete(sourceId)

    // Remove associated mappings
    for (const [mappingId, mapping] of this.mappings.entries()) {
      if (mapping.sourceId === sourceId) {
        this.mappings.delete(mappingId)
      }
    }

    eventBus.emit('datasource:removed', sourceId)
  }

  /**
   * Update a data source
   */
  updateDataSource(source: DataSource): void {
    const oldSource = this.sources.get(source.id)

    if (!oldSource) {
      console.warn(`Data source ${source.id} not found`)
      return
    }

    // Reconnect if enabled state changed or connection params changed
    if (oldSource.enabled !== source.enabled || this.shouldReconnect(oldSource, source)) {
      this.disconnectDataSource(source.id)

      if (source.enabled) {
        this.connectDataSource(source)
      }
    }

    this.sources.set(source.id, source)
    eventBus.emit('datasource:updated', source)
  }

  /**
   * Check if source needs reconnection
   */
  private shouldReconnect(oldSource: DataSource, newSource: DataSource): boolean {
    if (oldSource.type !== newSource.type) return true

    if (oldSource.type === 'api' && newSource.type === 'api') {
      return (
        oldSource.url !== newSource.url ||
        oldSource.pollInterval !== newSource.pollInterval
      )
    }

    if (oldSource.type === 'websocket' && newSource.type === 'websocket') {
      return oldSource.url !== newSource.url
    }

    return false
  }

  /**
   * Connect to a data source
   */
  private connectDataSource(source: DataSource): void {
    if (source.type === 'api') {
      this.connectAPI(source as APIDataSource)
    } else if (source.type === 'websocket') {
      this.connectWebSocket(source as WebSocketDataSource)
    }
  }

  /**
   * Connect to an API data source
   */
  private connectAPI(source: APIDataSource): void {
    const fetchData = async () => {
      try {
        const response = await fetch(source.url, {
          method: source.method,
          headers: source.headers,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const dataPoints = this.extractDataPoints(data, source.dataPath, source.id)

        this.latestData.set(source.id, dataPoints)
        eventBus.emit('datasource:data', { sourceId: source.id, data: dataPoints })

        // Apply mappings
        this.applyMappings(source.id, dataPoints)
      } catch (error) {
        console.error(`Error fetching data from ${source.name}:`, error)
        eventBus.emit('datasource:error', {
          sourceId: source.id,
          error: error as Error,
        })
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling
    const timer = setInterval(fetchData, source.pollInterval) as unknown as number

    this.connections.set(source.id, {
      source,
      connection: timer,
      lastData: [],
    })
  }

  /**
   * Connect to a WebSocket data source
   */
  private connectWebSocket(source: WebSocketDataSource): void {
    try {
      const ws = new WebSocket(source.url, source.protocols)

      ws.onopen = () => {
        console.log(`WebSocket connected: ${source.name}`)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const dataPoints = this.extractDataPoints(data, source.dataPath, source.id)

          this.latestData.set(source.id, dataPoints)
          eventBus.emit('datasource:data', { sourceId: source.id, data: dataPoints })

          // Apply mappings
          this.applyMappings(source.id, dataPoints)
        } catch (error) {
          console.error(`Error parsing WebSocket data from ${source.name}:`, error)
        }
      }

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${source.name}:`, error)
        eventBus.emit('datasource:error', {
          sourceId: source.id,
          error: new Error('WebSocket error'),
        })
      }

      ws.onclose = () => {
        console.log(`WebSocket closed: ${source.name}`)
      }

      this.connections.set(source.id, {
        source,
        connection: ws,
        lastData: [],
      })
    } catch (error) {
      console.error(`Error connecting WebSocket ${source.name}:`, error)
      eventBus.emit('datasource:error', {
        sourceId: source.id,
        error: error as Error,
      })
    }
  }

  /**
   * Disconnect from a data source
   */
  private disconnectDataSource(sourceId: string): void {
    const connection = this.connections.get(sourceId)

    if (!connection) return

    if (connection.connection) {
      if (connection.connection instanceof WebSocket) {
        connection.connection.close()
      } else if (typeof connection.connection === 'number') {
        clearInterval(connection.connection)
      }
    }

    this.connections.delete(sourceId)
  }

  /**
   * Extract data points from response using JSONPath-like syntax
   */
  private extractDataPoints(data: any, path: string, sourceId: string): DataPoint[] {
    // Simple JSONPath implementation
    // Supports: $.field, $.array[0], $.nested.field
    const dataPoints: DataPoint[] = []

    try {
      let current = data

      // Remove leading $. if present
      const cleanPath = path.replace(/^\$\.?/, '')

      if (!cleanPath) {
        // Root object
        current = data
      } else {
        // Navigate path
        const parts = cleanPath.split('.')
        for (const part of parts) {
          if (part.includes('[')) {
            // Array access
            const [field, indexStr] = part.split('[')
            const index = parseInt(indexStr.replace(']', ''))

            if (field) {
              current = current[field]
            }

            if (Array.isArray(current) && !isNaN(index)) {
              current = current[index]
            }
          } else {
            current = current[part]
          }

          if (current === undefined) break
        }
      }

      // Convert to DataPoints
      if (typeof current === 'object' && current !== null) {
        // Object - convert each numeric field to a data point
        for (const [key, value] of Object.entries(current)) {
          if (typeof value === 'number') {
            dataPoints.push({
              name: key,
              value,
              timestamp: Date.now(),
              metadata: { sourceId },
            })
          }
        }
      } else if (typeof current === 'number') {
        // Single number
        dataPoints.push({
          name: path,
          value: current,
          timestamp: Date.now(),
          metadata: { sourceId },
        })
      } else if (Array.isArray(current)) {
        // Array of numbers
        current.forEach((value, index) => {
          if (typeof value === 'number') {
            dataPoints.push({
              name: `${path}[${index}]`,
              value,
              timestamp: Date.now(),
              metadata: { sourceId },
            })
          }
        })
      }
    } catch (error) {
      console.error('Error extracting data points:', error)
    }

    return dataPoints
  }

  /**
   * Add a mapping between data source and parameter
   */
  addMapping(mapping: DataSourceMapping): void {
    const mappingId = `${mapping.sourceId}:${mapping.dataPath}:${mapping.parameter}`
    this.mappings.set(mappingId, mapping)
    eventBus.emit('datasource:mapping-added', mapping)
  }

  /**
   * Remove a mapping
   */
  removeMapping(mappingId: string): void {
    this.mappings.delete(mappingId)
    eventBus.emit('datasource:mapping-removed', mappingId)
  }

  /**
   * Apply mappings to parameters
   */
  private applyMappings(sourceId: string, dataPoints: DataPoint[]): void {
    for (const [_, mapping] of this.mappings.entries()) {
      if (mapping.sourceId !== sourceId) continue

      // Find matching data point
      const dataPoint = dataPoints.find((dp) => {
        // Simple path matching
        return (
          dp.name === mapping.dataPath ||
          dp.name.endsWith(mapping.dataPath) ||
          mapping.dataPath.includes(dp.name)
        )
      })

      if (!dataPoint) continue

      // Scale and map to parameter range
      const normalizedValue = this.scaleValue(
        dataPoint.value,
        mapping.scale,
        mapping.range,
        mapping.curve
      )

      // Emit parameter change
      eventBus.emit('param:changed', {
        name: mapping.parameter,
        value: normalizedValue,
      })
    }
  }

  /**
   * Scale a value from input range to output range
   */
  private scaleValue(
    value: number,
    inputRange: [number, number],
    outputRange: [number, number],
    curve: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    const [inMin, inMax] = inputRange
    const [outMin, outMax] = outputRange

    // Normalize to 0-1
    let normalized = (value - inMin) / (inMax - inMin)
    normalized = Math.max(0, Math.min(1, normalized))

    // Apply curve
    if (curve === 'exponential') {
      normalized = normalized * normalized
    } else if (curve === 'logarithmic') {
      normalized = Math.sqrt(normalized)
    }

    // Scale to output range
    return outMin + normalized * (outMax - outMin)
  }

  /**
   * Get all data sources
   */
  getDataSources(): DataSource[] {
    return Array.from(this.sources.values())
  }

  /**
   * Get a specific data source
   */
  getDataSource(sourceId: string): DataSource | undefined {
    return this.sources.get(sourceId)
  }

  /**
   * Get latest data for a source
   */
  getLatestData(sourceId: string): DataPoint[] {
    return this.latestData.get(sourceId) || []
  }

  /**
   * Get all mappings
   */
  getMappings(): DataSourceMapping[] {
    return Array.from(this.mappings.values())
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Disconnect all sources
    for (const sourceId of this.connections.keys()) {
      this.disconnectDataSource(sourceId)
    }

    this.sources.clear()
    this.connections.clear()
    this.mappings.clear()
    this.latestData.clear()

    this.isInitialized = false
    console.log('DataSourceService disposed')
  }
}
