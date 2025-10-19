'use client';

/**
 * Simple Event Emitter implementation for VS Code API shim
 */

type Listener<T> = (event: T) => void;
type Disposable = { dispose(): void };

export class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  get event() {
    return (listener: Listener<T>): Disposable => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          const index = this.listeners.indexOf(listener);
          if (index !== -1) {
            this.listeners.splice(index, 1);
          }
        },
      };
    };
  }

  fire(event: T): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[EventEmitter] Error in listener:', error);
      }
    });
  }

  dispose(): void {
    this.listeners = [];
  }
}
