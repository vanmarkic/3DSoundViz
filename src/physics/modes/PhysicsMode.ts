/**
 * PhysicsMode interface - Contract for all physics simulation modes
 */

import * as THREE from 'three'
import type {
  PhysicsMode as PhysicsModeType,
  PhysicsParameter,
  AudioData,
  ParticleSnapshot,
  Disposable
} from '@core/types'

export interface PhysicsModeParams {
  [key: string]: number
}

export interface PhysicsMode extends Disposable {
  /**
   * Mode identifier
   */
  readonly name: PhysicsModeType

  /**
   * List of parameter names this mode uses
   */
  readonly parameters: readonly PhysicsParameter[]

  /**
   * Initialize the physics mode
   */
  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void

  /**
   * Update physics simulation
   * @param deltaTime Fixed timestep in seconds
   * @param params Parameter values for this mode
   * @param audioData Current audio analysis data
   */
  update(deltaTime: number, params: PhysicsModeParams, audioData: AudioData): void

  /**
   * Render the visual output
   */
  render(scene: THREE.Scene): void

  /**
   * Export current state as particles for transition
   * @param count Target particle count for transition
   */
  exportToParticles(count: number): ParticleSnapshot

  /**
   * Import particle state during transition
   * @param particles Particle data from transition
   * @param progress Transition progress (0-1)
   */
  importFromParticles(particles: ParticleSnapshot, progress: number): void

  /**
   * Get current particle count (for stats)
   */
  getParticleCount(): number

  /**
   * Clean up GPU resources
   */
  dispose(): void
}
