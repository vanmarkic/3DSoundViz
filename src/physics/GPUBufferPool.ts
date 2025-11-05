/**
 * GPUBufferPool - Manages reusable GPU buffers to avoid allocation overhead
 */

import * as THREE from 'three'

interface BufferPoolEntry {
  buffer: THREE.DataTexture
  inUse: boolean
  size: number
  bytesPerElement: number
}

export class GPUBufferPool {
  private textures: Map<string, BufferPoolEntry[]> = new Map()
  private maxPoolSize = 10

  /**
   * Get or create a data texture
   */
  getTexture(width: number, height: number, format: THREE.PixelFormat, type: THREE.TextureDataType): THREE.DataTexture {
    const key = `${width}x${height}_${format}_${type}`

    if (!this.textures.has(key)) {
      this.textures.set(key, [])
    }

    const pool = this.textures.get(key)!

    // Find unused texture in pool
    const available = pool.find(entry => !entry.inUse)
    if (available) {
      available.inUse = true
      return available.buffer
    }

    // Create new texture
    const size = width * height * 4 // RGBA

    // Create appropriate typed array based on texture type
    let data: Uint8Array | Uint16Array | Float32Array
    let bytesPerElement: number

    switch (type) {
      case THREE.UnsignedByteType:
        data = new Uint8Array(size) as Uint8Array
        bytesPerElement = 1
        break
      case THREE.UnsignedShortType:
      case THREE.HalfFloatType:
        data = new Uint16Array(size) as Uint16Array
        bytesPerElement = 2
        break
      case THREE.FloatType:
      default:
        data = new Float32Array(size) as Float32Array
        bytesPerElement = 4
        break
    }

    const texture = new THREE.DataTexture(
      data as any, // TypeScript workaround for typed array union
      width,
      height,
      format,
      type
    )
    texture.needsUpdate = true

    const entry: BufferPoolEntry = {
      buffer: texture,
      inUse: true,
      size,
      bytesPerElement
    }

    // Enforce max pool size - dispose oldest unused texture if limit reached
    if (pool.length >= this.maxPoolSize) {
      const oldestUnused = pool.find(e => !e.inUse)
      if (oldestUnused) {
        oldestUnused.buffer.dispose()
        const index = pool.indexOf(oldestUnused)
        pool.splice(index, 1)
      }
    }

    pool.push(entry)
    return texture
  }

  /**
   * Release a texture back to the pool
   */
  releaseTexture(texture: THREE.DataTexture): void {
    for (const pool of this.textures.values()) {
      const entry = pool.find(e => e.buffer === texture)
      if (entry) {
        entry.inUse = false
        return
      }
    }

    // Warn in development mode if texture not found
    if (process.env.NODE_ENV !== 'production') {
      console.warn('GPUBufferPool: Attempted to release texture that is not in pool')
    }
  }

  /**
   * Clear unused buffers from pool
   */
  cleanup(): void {
    for (const [key, pool] of this.textures.entries()) {
      // Keep only in-use textures and a few unused ones
      const inUse = pool.filter(e => e.inUse)
      const unused = pool.filter(e => !e.inUse).slice(0, 2)

      // Dispose of excess textures
      pool.filter(e => !e.inUse).slice(2).forEach(e => e.buffer.dispose())

      this.textures.set(key, [...inUse, ...unused])
    }
  }

  /**
   * Get memory usage estimate in MB
   */
  getMemoryUsage(): number {
    let totalBytes = 0
    for (const pool of this.textures.values()) {
      totalBytes += pool.reduce((sum, entry) => sum + entry.size * entry.bytesPerElement, 0)
    }
    return totalBytes / (1024 * 1024)
  }

  /**
   * Dispose all buffers
   */
  dispose(): void {
    for (const pool of this.textures.values()) {
      pool.forEach(entry => entry.buffer.dispose())
    }
    this.textures.clear()
  }
}
