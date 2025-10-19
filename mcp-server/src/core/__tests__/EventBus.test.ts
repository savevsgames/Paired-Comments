/**
 * EventBus Tests
 */

import { EventBusImpl } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBusImpl;

  beforeEach(() => {
    eventBus = new EventBusImpl();
  });

  it('should register and emit events', async () => {
    const handler = jest.fn();
    eventBus.on('test', handler);

    await eventBus.emit('test', { data: 'hello' });

    expect(handler).toHaveBeenCalledWith({ data: 'hello' });
  });

  it('should support multiple handlers for same event', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    eventBus.on('test', handler1);
    eventBus.on('test', handler2);

    await eventBus.emit('test', { data: 'hello' });

    expect(handler1).toHaveBeenCalledWith({ data: 'hello' });
    expect(handler2).toHaveBeenCalledWith({ data: 'hello' });
  });

  it('should unregister handlers', async () => {
    const handler = jest.fn();
    eventBus.on('test', handler);
    eventBus.off('test', handler);

    await eventBus.emit('test', { data: 'hello' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should get handler count', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    eventBus.on('test', handler1);
    eventBus.on('test', handler2);

    expect(eventBus.getHandlerCount('test')).toBe(2);
  });

  it('should clear all handlers', () => {
    eventBus.on('test1', jest.fn());
    eventBus.on('test2', jest.fn());

    eventBus.clear();

    expect(eventBus.getHandlerCount('test1')).toBe(0);
    expect(eventBus.getHandlerCount('test2')).toBe(0);
  });

  it('should handle errors in handlers gracefully', async () => {
    const errorHandler = jest.fn(() => {
      throw new Error('Handler error');
    });
    const normalHandler = jest.fn();

    eventBus.on('test', errorHandler);
    eventBus.on('test', normalHandler);

    // Should not throw
    await eventBus.emit('test', { data: 'hello' });

    expect(normalHandler).toHaveBeenCalled();
  });
});
