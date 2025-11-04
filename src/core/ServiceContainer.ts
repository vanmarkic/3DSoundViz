/**
 * Simple service container for dependency injection
 * Manages service lifecycle and dependencies
 */

import type { Disposable, AsyncDisposable } from './types'

type Service = Disposable | AsyncDisposable | any
type ServiceFactory<T = any> = () => T

export class ServiceContainer {
  private services = new Map<string, Service>()
  private factories = new Map<string, ServiceFactory>()
  private static instance: ServiceContainer

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * Register a service factory
   */
  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory)
  }

  /**
   * Register a singleton service instance
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, instance)
  }

  /**
   * Get a service by name (creates if factory registered)
   */
  get<T>(name: string): T {
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name) as T
    }

    // Create from factory if available
    const factory = this.factories.get(name)
    if (factory) {
      const instance = factory()
      this.services.set(name, instance)
      return instance as T
    }

    throw new Error(`Service "${name}" not found`)
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name)
  }

  /**
   * Remove a service
   */
  remove(name: string): void {
    this.services.delete(name)
    this.factories.delete(name)
  }

  /**
   * Dispose all services (calls dispose() if available)
   */
  async disposeAll(): Promise<void> {
    for (const [name, service] of this.services) {
      if (typeof service?.dispose === 'function') {
        const result = service.dispose()
        if (result instanceof Promise) {
          await result
        }
      }
    }
    this.services.clear()
  }

  /**
   * Clear all services and factories
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
  }
}

// Export singleton instance
export const container = ServiceContainer.getInstance()
