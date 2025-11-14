/**
 * VisualService - Constructivist/Deconstructivist visual generation
 * Creates dynamic 3D scenes with geometric forms driven by parameters
 */

import * as THREE from 'three'
import { eventBus } from '@core/EventBus'
import type {
  ParameterValues,
  AudioData,
  AestheticMode,
  VisualConfig,
  Disposable
} from '@core/types'
import { RenderEngine } from './RenderEngine'
// @ts-ignore
import palettes from 'nice-color-palettes'
// @ts-ignore
import random from 'canvas-sketch-util/random'

interface GeometricElement {
  mesh: THREE.Mesh | THREE.InstancedMesh
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  baseScale: THREE.Vector3
  velocity: THREE.Vector3
  rotationVelocity: THREE.Vector3
  colorIndex: number
}

export class VisualService implements Disposable {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderEngine: RenderEngine | null = null

  private elements: GeometricElement[] = []
  private lights: THREE.Light[] = []

  private config: VisualConfig = {
    aesthetic: 'constructivist',
    colorPalette: random.pick(palettes),
    complexity: 50,
    seed: Math.random()
  }

  private time = 0
  private previousParams: ParameterValues | null = null

  // Instanced geometry pools
  private cubeGeometry: THREE.BoxGeometry
  private sphereGeometry: THREE.SphereGeometry
  private cylinderGeometry: THREE.CylinderGeometry
  private coneGeometry: THREE.ConeGeometry

  private isInitialized = false

  constructor() {
    // Create scene
    this.scene = new THREE.Scene()
    // Light gray background like the old aesthetic
    this.scene.background = new THREE.Color('hsl(0, 0%, 95%)')

    // Create orthographic camera for isometric view
    const aspect = window.innerWidth / window.innerHeight
    const zoom = 1.85
    this.camera = new THREE.OrthographicCamera(
      -zoom * aspect,
      zoom * aspect,
      zoom,
      -zoom,
      -100,
      100
    )
    this.camera.position.set(zoom, zoom, zoom)
    this.camera.lookAt(new THREE.Vector3())

    // Create shared geometries
    this.cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    this.sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16)
    this.cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16)
    this.coneGeometry = new THREE.ConeGeometry(0.5, 1, 16)
  }

  /**
   * Initialize visual service
   */
  initialize(renderEngine: RenderEngine): void {
    if (this.isInitialized) {
      console.warn('VisualService already initialized')
      return
    }

    this.renderEngine = renderEngine

    // Set up lighting
    this.setupLighting()

    // Generate initial scene
    this.generateScene()

    this.isInitialized = true
    console.log('VisualService initialized')
  }

  /**
   * Set up scene lighting
   */
  private setupLighting(): void {
    // Soft hemisphere light like the old aesthetic
    const light = new THREE.HemisphereLight('white', 'gray', 2)
    light.position.set(1000, 300, 2000)
    this.scene.add(light)
    this.lights.push(light)
  }

  /**
   * Generate scene based on aesthetic mode
   */
  private generateScene(): void {
    // Clear existing elements
    this.clearElements()

    // Generate based on aesthetic
    if (this.config.aesthetic === 'constructivist') {
      this.generateConstructivist()
    } else if (this.config.aesthetic === 'deconstructivist') {
      this.generateDeconstructivist()
    } else {
      this.generateMixed()
    }
  }

  /**
   * Generate constructivist scene
   * Characteristics: Order, balance, geometric purity, primary colors
   */
  private generateConstructivist(): void {
    const complexity = Math.floor(this.config.complexity)

    for (let i = 0; i < complexity; i++) {
      const element = this.createConstructivistElement(i, complexity)
      this.elements.push(element)
      this.scene.add(element.mesh)
    }
  }

  /**
   * Create a constructivist element
   */
  private createConstructivistElement(index: number, total: number): GeometricElement {
    // Grid-based positioning
    const gridSize = Math.ceil(Math.sqrt(total))
    const x = (index % gridSize) - gridSize / 2
    const z = Math.floor(index / gridSize) - gridSize / 2
    const y = 0

    // Select geometry type (favor cubes and cylinders)
    const geometryTypes = ['cube', 'cube', 'cylinder', 'sphere']
    const type = geometryTypes[Math.floor(this.seededRandom(index) * geometryTypes.length)]

    let geometry: THREE.BufferGeometry
    switch (type) {
      case 'sphere':
        geometry = this.sphereGeometry
        break
      case 'cylinder':
        geometry = this.cylinderGeometry
        break
      case 'cone':
        geometry = this.coneGeometry
        break
      default:
        geometry = this.cubeGeometry
    }

    // Use palette colors like the old aesthetic
    const colors = this.config.colorPalette
    const colorIndex = Math.floor(this.seededRandom(index + 100) * colors.length)
    const color = new THREE.Color(colors[colorIndex])

    // Material matching the old cubes.js style
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 1,
      flatShading: false
    })

    const mesh = new THREE.Mesh(geometry, material)

    // Position
    const spacing = 3
    const basePosition = new THREE.Vector3(x * spacing, y, z * spacing)
    mesh.position.copy(basePosition)

    // Rotation
    const baseRotation = new THREE.Euler(
      this.seededRandom(index + 200) * Math.PI * 2,
      this.seededRandom(index + 300) * Math.PI * 2,
      this.seededRandom(index + 400) * Math.PI * 2
    )
    mesh.rotation.copy(baseRotation)

    // Scale
    const scale = 1 + this.seededRandom(index + 500) * 2
    const baseScale = new THREE.Vector3(scale, scale, scale)
    mesh.scale.copy(baseScale)

    return {
      mesh,
      basePosition: basePosition.clone(),
      baseRotation: baseRotation.clone(),
      baseScale: baseScale.clone(),
      velocity: new THREE.Vector3(),
      rotationVelocity: new THREE.Vector3(
        (this.seededRandom(index + 600) - 0.5) * 0.01,
        (this.seededRandom(index + 700) - 0.5) * 0.01,
        (this.seededRandom(index + 800) - 0.5) * 0.01
      ),
      colorIndex
    }
  }

  /**
   * Generate deconstructivist scene
   * Characteristics: Fragmentation, asymmetry, chaos, distortion
   */
  private generateDeconstructivist(): void {
    const complexity = Math.floor(this.config.complexity)

    for (let i = 0; i < complexity; i++) {
      const element = this.createDeconstructivistElement(i, complexity)
      this.elements.push(element)
      this.scene.add(element.mesh)
    }
  }

  /**
   * Create a deconstructivist element
   */
  private createDeconstructivistElement(index: number, total: number): GeometricElement {
    // Random scattered positioning (breaking the grid)
    const spread = 15
    const x = (this.seededRandom(index) - 0.5) * spread
    const y = (this.seededRandom(index + 1000) - 0.5) * spread
    const z = (this.seededRandom(index + 2000) - 0.5) * spread

    // All geometry types
    const geometryTypes = ['cube', 'sphere', 'cylinder', 'cone']
    const type = geometryTypes[Math.floor(this.seededRandom(index + 3000) * geometryTypes.length)]

    let geometry: THREE.BufferGeometry
    switch (type) {
      case 'sphere':
        geometry = this.sphereGeometry
        break
      case 'cylinder':
        geometry = this.cylinderGeometry
        break
      case 'cone':
        geometry = this.coneGeometry
        break
      default:
        geometry = this.cubeGeometry
    }

    // More varied colors
    const colors = this.config.colorPalette
    const colorIndex = Math.floor(this.seededRandom(index + 4000) * colors.length)
    const color = new THREE.Color(colors[colorIndex])

    // Wireframe or solid
    const isWireframe = this.seededRandom(index + 5000) > 0.7

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.5,
      wireframe: isWireframe,
      flatShading: false
    })

    const mesh = new THREE.Mesh(geometry, material)

    const basePosition = new THREE.Vector3(x, y, z)
    mesh.position.copy(basePosition)

    // Random rotation
    const baseRotation = new THREE.Euler(
      this.seededRandom(index + 6000) * Math.PI * 2,
      this.seededRandom(index + 7000) * Math.PI * 2,
      this.seededRandom(index + 8000) * Math.PI * 2
    )
    mesh.rotation.copy(baseRotation)

    // Varied, asymmetric scale
    const baseScale = new THREE.Vector3(
      0.5 + this.seededRandom(index + 9000) * 3,
      0.5 + this.seededRandom(index + 10000) * 3,
      0.5 + this.seededRandom(index + 11000) * 3
    )
    mesh.scale.copy(baseScale)

    return {
      mesh,
      basePosition: basePosition.clone(),
      baseRotation: baseRotation.clone(),
      baseScale: baseScale.clone(),
      velocity: new THREE.Vector3(
        (this.seededRandom(index + 12000) - 0.5) * 0.05,
        (this.seededRandom(index + 13000) - 0.5) * 0.05,
        (this.seededRandom(index + 14000) - 0.5) * 0.05
      ),
      rotationVelocity: new THREE.Vector3(
        (this.seededRandom(index + 15000) - 0.5) * 0.02,
        (this.seededRandom(index + 16000) - 0.5) * 0.02,
        (this.seededRandom(index + 17000) - 0.5) * 0.02
      ),
      colorIndex
    }
  }

  /**
   * Generate mixed aesthetic
   */
  private generateMixed(): void {
    const complexity = Math.floor(this.config.complexity)
    const half = Math.floor(complexity / 2)

    // Generate constructivist elements
    for (let i = 0; i < half; i++) {
      const element = this.createConstructivistElement(i, half)
      this.elements.push(element)
      this.scene.add(element.mesh)
    }

    // Generate deconstructivist elements
    for (let i = half; i < complexity; i++) {
      const element = this.createDeconstructivistElement(i, complexity - half)
      this.elements.push(element)
      this.scene.add(element.mesh)
    }
  }

  /**
   * Update scene based on parameters and audio
   */
  update(params: ParameterValues, audioData: AudioData): void {
    this.time += 0.016 // Assume 60fps

    // Regenerate scene if complexity changed significantly
    if (this.previousParams &&
        Math.abs(params.complexity - this.previousParams.complexity) > 0.1) {
      this.config.complexity = Math.floor(params.complexity * 100) + 10
      this.generateScene()
    }

    // Get frequency data - use the raw frequency data like the old code
    // Use the first channel's frequency data
    const frequencyData = audioData.frequencyData[0] || new Float32Array(0)

    // Update each element with noise-based animation like the old cubes.js
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i]
      const mesh = element.mesh

      // Get frequency value for this mesh (if available)
      const freqValue = frequencyData[i] || 0

      // Original noise-based position animation from cubes.js
      const f = 1
      const noiseScale = freqValue / 128

      mesh.position.x = element.basePosition.x + (freqValue / 128) *
        random.noise3D(
          element.basePosition.x * f * noiseScale,
          element.basePosition.y * f * noiseScale,
          element.basePosition.z * f * noiseScale,
          this.time * 2
        )

      mesh.position.y = element.basePosition.y + (freqValue / 128) *
        random.noise3D(
          element.basePosition.x * f * noiseScale + 100,
          element.basePosition.y * f * noiseScale + 100,
          element.basePosition.z * f * noiseScale + 100,
          this.time * 2
        )

      mesh.position.z = element.basePosition.z + (freqValue / 128) *
        random.noise3D(
          element.basePosition.x * f * noiseScale + 200,
          element.basePosition.y * f * noiseScale + 200,
          element.basePosition.z * f * noiseScale + 200,
          this.time * 2
        )

      // Apply parameter-based modulation on top of the noise animation
      // Scale based on parameter and audio
      const audioScale = 1 + audioData.bands[0]?.bass * params.scale * 0.5
      mesh.scale.copy(element.baseScale).multiplyScalar(audioScale)

      // Rotation based on rotationSpeed parameter
      mesh.rotation.x += element.rotationVelocity.x * params.rotationSpeed * 10
      mesh.rotation.y += element.rotationVelocity.y * params.rotationSpeed * 10
      mesh.rotation.z += element.rotationVelocity.z * params.rotationSpeed * 10

      // Fragmentation: separate elements based on parameter
      if (params.fragmentation > 0.1) {
        const fragmentOffset = new THREE.Vector3()
          .copy(element.velocity)
          .multiplyScalar(params.fragmentation * 20)
        mesh.position.add(fragmentOffset)
      }

      // Color intensity
      const material = mesh.material as THREE.MeshStandardMaterial
      const baseColor = new THREE.Color(this.config.colorPalette[element.colorIndex])
      material.color.copy(baseColor).multiplyScalar(params.colorIntensity)

      // Asymmetry: distort positions
      if (params.asymmetry > 0.5) {
        mesh.position.x += Math.sin(this.time * 2 + i) * (params.asymmetry - 0.5) * 3
        mesh.position.z += Math.cos(this.time * 2 + i) * (params.asymmetry - 0.5) * 3
      }

      // Liquidity: smooth organic wave motion and deformation
      if (params.liquidity > 0.1) {
        const liquidSpeed = 0.5 + params.liquidity * 2
        const liquidAmp = params.liquidity * 3

        // Wave motion
        const waveX = Math.sin(this.time * liquidSpeed + i * 0.5) * liquidAmp
        const waveY = Math.cos(this.time * liquidSpeed * 0.7 + i * 0.3) * liquidAmp
        const waveZ = Math.sin(this.time * liquidSpeed * 0.9 + i * 0.7) * liquidAmp

        mesh.position.x += waveX
        mesh.position.y += waveY
        mesh.position.z += waveZ

        // Organic deformation (scale pulsing)
        const pulse = 1 + Math.sin(this.time * liquidSpeed * 2 + i) * params.liquidity * 0.2
        mesh.scale.multiplyScalar(pulse)

        // Rotation with liquidity
        mesh.rotation.x += Math.sin(this.time * liquidSpeed + i) * params.liquidity * 0.01
        mesh.rotation.y += Math.cos(this.time * liquidSpeed * 1.3 + i) * params.liquidity * 0.01
      }
    }

    // Keep camera in isometric position (like the old code)
    // Don't move camera based on parameters to preserve the classic view

    // Store previous params
    this.previousParams = { ...params }
  }

  /**
   * Seeded random for consistent generation
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed + this.config.seed) * 10000
    return x - Math.floor(x)
  }

  /**
   * Get scene
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get camera
   */
  getCamera(): THREE.OrthographicCamera {
    return this.camera
  }

  /**
   * Set aesthetic mode
   */
  setAesthetic(mode: AestheticMode): void {
    this.config.aesthetic = mode
    this.generateScene()
  }

  /**
   * Set color palette
   */
  setColorPalette(colors: string[]): void {
    this.config.colorPalette = colors
    this.generateScene()
  }

  /**
   * Handle window resize
   */
  handleResize(width: number, height: number): void {
    // Update orthographic camera for new aspect ratio
    const aspect = width / height
    const zoom = 1.85
    this.camera.left = -zoom * aspect
    this.camera.right = zoom * aspect
    this.camera.top = zoom
    this.camera.bottom = -zoom
    this.camera.updateProjectionMatrix()
  }

  /**
   * Clear all elements
   */
  private clearElements(): void {
    for (const element of this.elements) {
      this.scene.remove(element.mesh)
      if (element.mesh.material) {
        (element.mesh.material as THREE.Material).dispose()
      }
    }
    this.elements = []
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.clearElements()

    // Dispose shared geometries
    this.cubeGeometry.dispose()
    this.sphereGeometry.dispose()
    this.cylinderGeometry.dispose()
    this.coneGeometry.dispose()

    // Remove lights
    for (const light of this.lights) {
      this.scene.remove(light)
    }
    this.lights = []

    this.renderEngine = null
    this.isInitialized = false

    console.log('VisualService disposed')
  }
}
