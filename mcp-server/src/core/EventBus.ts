/**
 * Event Bus
 * Simple pub/sub event system for real-time sync
 */

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): void;
  off<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, data: T): Promise<void>;
}

export class EventBusImpl implements EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  /**
   * Register event handler
   */
  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
  }

  /**
   * Unregister event handler
   */
  off<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emit event to all handlers
   */
  async emit<T>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Run handlers in parallel
    const promises = Array.from(handlers).map(handler => {
      try {
        return Promise.resolve(handler(data));
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get all registered events
   */
  getEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for event
   */
  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Event type definitions
export interface CommentAddedEvent {
  filePath: string;
  comment: {
    id: string;
    text: string;
    tag: string;
  };
  ghostMarker: {
    id: string;
    line: number;
  };
}

export interface CommentUpdatedEvent {
  filePath: string;
  commentId: string;
  newText: string;
}

export interface CommentDeletedEvent {
  filePath: string;
  commentId: string;
}

export interface CommentMovedEvent {
  sourceFile: string;
  targetFile: string;
  commentId: string;
  targetLine: number;
}
