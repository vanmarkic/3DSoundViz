/**
 * ParticleMode - Million particle GPGPU system with curl noise
 */

import * as THREE from 'three'
import type {
  PhysicsMode as PhysicsModeType,
  PhysicsParameter,
  ParticleParameter,
  AudioData,
  ParticleSnapshot
} from '@core/types'
import type { PhysicsMode, PhysicsModeParams } from './PhysicsMode'
import particleVertexShader from '@shaders/physics/particles/particleVertex.glsl?raw'
import particleFragmentShader from '@shaders/physics/particles/particleFragment.glsl?raw'

export class ParticleMode implements PhysicsMode {
  readonly name: PhysicsModeType = 'particles'
  readonly parameters: readonly ParticleParameter[] = [
    'particleCount',
    'gravity',
    'attraction',
    'repulsion',
    'curlNoise',
    'speed',
    'size',
    'colorIntensity',
    'trail',
    'chaos',
    'glow'
  ]

  private scene: THREE.Scene | null = null
  private renderer: THREE.WebGLRenderer | null = null

  private particles: THREE.Points | null = null
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.ShaderMaterial | null = null

  private positions: Float32Array = new Float32Array(0)
  private velocities: Float32Array = new Float32Array(0)
  private colors: Float32Array = new Float32Array(0)

  private maxParticles = 1000000
  private currentCount = 100000
  private time = 0

  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.scene = scene
    this.renderer = renderer

    // Initialize particle arrays
    this.initializeParticles(this.currentCount)

    // Create geometry
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))

    // Create material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uSize: { value: 2.0 },
        uTime: { value: 0 },
        uGlow: { value: 0.5 }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    // Create points
    this.particles = new THREE.Points(this.geometry, this.material)
    scene.add(this.particles)

    console.log('ParticleMode initialized with', this.currentCount, 'particles')
  }

  private initializeParticles(count: number): void {
    this.currentCount = Math.min(count, this.maxParticles)

    this.positions = new Float32Array(this.currentCount * 3)
    this.velocities = new Float32Array(this.currentCount * 3)
    this.colors = new Float32Array(this.currentCount * 3)

    // Initialize with random positions in sphere
    for (let i = 0; i < this.currentCount; i++) {
      const i3 = i * 3

      // Random position in sphere
      const radius = Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      this.positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      this.positions[i3 + 2] = radius * Math.cos(phi)

      // Random velocity
      this.velocities[i3] = (Math.random() - 0.5) * 0.1
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1

      // Random color (from palette)
      const colorIndex = Math.floor(Math.random() * 5)
      const colors = [
        [1, 0, 0],     // Red
        [0, 0, 0],     // Black
        [1, 1, 1],     // White
        [1, 0.84, 0],  // Gold
        [0, 0, 1]      // Blue
      ]
      const color = colors[colorIndex]
      this.colors[i3] = color[0]
      this.colors[i3 + 1] = color[1]
      this.colors[i3 + 2] = color[2]
    }
  }

  update(deltaTime: number, params: PhysicsModeParams, audioData?: AudioData): void {
    if (!this.geometry) return

    this.time += deltaTime

    // Update uniforms
    if (this.material) {
      this.material.uniforms.uSize.value = params.size * 10
      this.material.uniforms.uTime.value = this.time
      this.material.uniforms.uGlow.value = params.glow
    }

    // Simple physics update (CPU for now, will move to GPU later)
    const gravity = params.gravity * 0.5
    const attraction = params.attraction * 0.1
    const speed = params.speed
    const chaos = params.chaos * 0.01

    for (let i = 0; i < this.currentCount; i++) {
      const i3 = i * 3

      // Apply gravity
      this.velocities[i3 + 1] -= gravity * deltaTime

      // Apply attraction to center
      const dx = -this.positions[i3]
      const dy = -this.positions[i3 + 1]
      const dz = -this.positions[i3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist > 0.1) {
        this.velocities[i3] += (dx / dist) * attraction * deltaTime
        this.velocities[i3 + 1] += (dy / dist) * attraction * deltaTime
        this.velocities[i3 + 2] += (dz / dist) * attraction * deltaTime
      }

      // Apply chaos
      this.velocities[i3] += (Math.random() - 0.5) * chaos
      this.velocities[i3 + 1] += (Math.random() - 0.5) * chaos
      this.velocities[i3 + 2] += (Math.random() - 0.5) * chaos

      // Update positions
      this.positions[i3] += this.velocities[i3] * speed
      this.positions[i3 + 1] += this.velocities[i3 + 1] * speed
      this.positions[i3 + 2] += this.velocities[i3 + 2] * speed

      // Damping
      this.velocities[i3] *= 0.98
      this.velocities[i3 + 1] *= 0.98
      this.velocities[i3 + 2] *= 0.98
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.velocity.needsUpdate = true
  }

  render(scene: THREE.Scene): void {
    // Rendering handled by Three.js Points system
  }

  exportToParticles(count: number): ParticleSnapshot {
    return {
      positions: this.positions.slice(),
      velocities: this.velocities.slice(),
      colors: this.colors.slice(),
      count: this.currentCount
    }
  }

  importFromParticles(particles: ParticleSnapshot, progress: number): void {
    // Will implement during transition system
    console.log('importFromParticles called with progress:', progress)
  }

  getParticleCount(): number {
    return this.currentCount
  }

  dispose(): void {
    if (this.particles && this.scene) {
      this.scene.remove(this.particles)
    }
    this.geometry?.dispose()
    this.material?.dispose()

    console.log('ParticleMode disposed')
  }
}
