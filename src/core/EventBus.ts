/**
 * Central event bus for service communication
 * Uses EventEmitter3 for type-safe, high-performance event handling
 */

import EventEmitter from 'eventemitter3'
import type { ServiceEvents } from './types'

export class EventBus {
  private emitter: EventEmitter<ServiceEvents>
  private static instance: EventBus

  private constructor() {
    this.emitter = new EventEmitter()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof ServiceEvents>(
    event: K,
    handler: (data: ServiceEvents[K]) => void
  ): () => void {
    this.emitter.on(event, handler as any)

    // Return unsubscribe function
    return () => {
      this.emitter.off(event, handler as any)
    }
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<K extends keyof ServiceEvents>(
    event: K,
    handler: (data: ServiceEvents[K]) => void
  ): void {
    this.emitter.once(event, handler as any)
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof ServiceEvents>(
    event: K,
    handler: (data: ServiceEvents[K]) => void
  ): void {
    this.emitter.off(event, handler as any)
  }

  /**
   * Emit an event
   */
  emit<K extends keyof ServiceEvents>(
    event: K,
    data: ServiceEvents[K]
  ): void {
    this.emitter.emit(event, data)
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners(event?: keyof ServiceEvents): void {
    if (event) {
      this.emitter.removeAllListeners(event)
    } else {
      this.emitter.removeAllListeners()
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof ServiceEvents): number {
    return this.emitter.listenerCount(event)
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance()
