/**
 * GPUBufferPool - Manages reusable GPU buffers to avoid allocation overhead
 */

import * as THREE from 'three'

interface BufferPoolEntry {
  buffer: THREE.DataTexture
  inUse: boolean
  size: number
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
    const data = new Float32Array(size)
    const texture = new THREE.DataTexture(
      data,
      width,
      height,
      format,
      type
    )
    texture.needsUpdate = true

    const entry: BufferPoolEntry = {
      buffer: texture,
      inUse: true,
      size
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
      totalBytes += pool.reduce((sum, entry) => sum + entry.size * 4, 0) // 4 bytes per float
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
