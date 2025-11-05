/**
 * LavaMode - Melting pixels lava simulation
 */

import * as THREE from 'three'
import type {
  PhysicsMode as PhysicsModeType,
  PhysicsParameter,
  LavaParameter,
  AudioData,
  ParticleSnapshot
} from '@core/types'
import type { PhysicsMode, PhysicsModeParams } from './PhysicsMode'
import lavaSimulationShader from '@shaders/physics/lava/lavaSimulation.glsl?raw'
import lavaVertexShader from '@shaders/physics/lava/lavaVertex.glsl?raw'
import lavaFragmentShader from '@shaders/physics/lava/lavaFragment.glsl?raw'

export class LavaMode implements PhysicsMode {
  readonly name: PhysicsModeType = 'lava'
  readonly parameters: readonly LavaParameter[] = [
    'viscosity',
    'temperature',
    'scale',
    'flowSpeed',
    'turbulence',
    'colorIntensity',
    'contrast',
    'depth',
    'distortion'
  ]

  private scene: THREE.Scene | null = null
  private renderer: THREE.WebGLRenderer | null = null

  private lavaMesh: THREE.Mesh | null = null
  private geometry: THREE.PlaneGeometry | null = null
  private material: THREE.ShaderMaterial | null = null

  // Simulation textures (velocity field)
  private simulationResolution = 256
  private velocityTexture: THREE.WebGLRenderTarget | null = null
  private velocityTexture2: THREE.WebGLRenderTarget | null = null
  private simulationMaterial: THREE.ShaderMaterial | null = null

  private noiseTexture: THREE.DataTexture | null = null
  private time = 0

  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.scene = scene
    this.renderer = renderer

    // Create noise texture
    this.createNoiseTexture()

    // Create simulation render targets
    this.velocityTexture = new THREE.WebGLRenderTarget(
      this.simulationResolution,
      this.simulationResolution,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      }
    )
    this.velocityTexture2 = this.velocityTexture.clone()

    // Initialize velocity field with noise
    this.initializeVelocityField()

    // Create simulation material
    this.simulationMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uVelocityTexture: { value: this.velocityTexture.texture },
        uNoiseTexture: { value: this.noiseTexture },
        uTime: { value: 0 },
        uViscosity: { value: 0.5 },
        uTemperature: { value: 0.7 },
        uTurbulence: { value: 0.3 },
        uDeltaTime: { value: 0.016 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: lavaSimulationShader
    })

    // Create lava surface geometry
    this.geometry = new THREE.PlaneGeometry(20, 20, 128, 128)

    // Create lava material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uDisplacementMap: { value: this.velocityTexture.texture },
        uDepth: { value: 2.0 },
        uTime: { value: 0 },
        uTemperature: { value: 0.7 },
        uColorIntensity: { value: 1.0 },
        uContrast: { value: 0.6 }
      },
      vertexShader: lavaVertexShader,
      fragmentShader: lavaFragmentShader
    })

    this.lavaMesh = new THREE.Mesh(this.geometry, this.material)
    this.lavaMesh.rotation.x = -Math.PI / 2
    scene.add(this.lavaMesh)

    console.log('LavaMode initialized')
  }

  private createNoiseTexture(): void {
    const size = 256
    const data = new Uint8Array(size * size * 4)

    for (let i = 0; i < size * size; i++) {
      const stride = i * 4
      const noise = Math.random() * 255
      data[stride] = noise
      data[stride + 1] = noise
      data[stride + 2] = noise
      data[stride + 3] = 255
    }

    this.noiseTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat
    )
    this.noiseTexture.needsUpdate = true
  }

  private initializeVelocityField(): void {
    // Initialize with random noise
    const size = this.simulationResolution
    const data = new Float32Array(size * size * 4)

    for (let i = 0; i < size * size; i++) {
      const stride = i * 4
      data[stride] = (Math.random() - 0.5) * 0.1
      data[stride + 1] = (Math.random() - 0.5) * 0.1
      data[stride + 2] = 0
      data[stride + 3] = 1
    }

    const texture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    texture.needsUpdate = true

    // Render to velocity texture
    // (This is simplified - would use proper render pass in production)
  }

  update(deltaTime: number, params: PhysicsModeParams, audioData?: AudioData): void {
    if (!this.simulationMaterial || !this.material) return

    this.time += deltaTime

    // Update simulation uniforms
    this.simulationMaterial.uniforms.uTime.value = this.time
    this.simulationMaterial.uniforms.uViscosity.value = params.viscosity
    this.simulationMaterial.uniforms.uTemperature.value = params.temperature
    this.simulationMaterial.uniforms.uTurbulence.value = params.turbulence
    this.simulationMaterial.uniforms.uDeltaTime.value = deltaTime

    // Update rendering uniforms
    this.material.uniforms.uTime.value = this.time
    this.material.uniforms.uDepth.value = params.depth * 5
    this.material.uniforms.uTemperature.value = params.temperature
    this.material.uniforms.uColorIntensity.value = params.colorIntensity
    this.material.uniforms.uContrast.value = params.contrast

    // Update scale
    if (this.lavaMesh) {
      const scale = params.scale * 2
      this.lavaMesh.scale.set(scale, scale, scale)
    }

    // Ping-pong simulation (swap render targets)
    // In production, would render simulation shader to texture
    // For now, simplified
  }

  render(scene: THREE.Scene): void {
    // Rendering handled by Three.js mesh system
  }

  exportToParticles(count: number): ParticleSnapshot {
    // Sample lava surface into particles
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    // Sample surface grid
    const gridSize = Math.sqrt(count)
    for (let i = 0; i < count; i++) {
      const x = (i % gridSize) / gridSize
      const y = Math.floor(i / gridSize) / gridSize

      positions[i * 3] = (x - 0.5) * 20
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = (y - 0.5) * 20

      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0

      colors[i * 3] = 1
      colors[i * 3 + 1] = 0.3
      colors[i * 3 + 2] = 0
    }

    return { positions, velocities, colors, count }
  }

  importFromParticles(particles: ParticleSnapshot, progress: number): void {
    console.log('LavaMode importFromParticles:', progress)
  }

  getParticleCount(): number {
    return this.simulationResolution * this.simulationResolution
  }

  dispose(): void {
    if (this.lavaMesh && this.scene) {
      this.scene.remove(this.lavaMesh)
    }

    this.geometry?.dispose()
    this.material?.dispose()
    this.simulationMaterial?.dispose()
    this.velocityTexture?.dispose()
    this.velocityTexture2?.dispose()
    this.noiseTexture?.dispose()

    console.log('LavaMode disposed')
  }
}
