/**
 * @jest-environment jsdom
 */

import { EventEmitter } from '../events';

describe('EventEmitter', () => {
  it('should fire events to listeners', () => {
    const emitter = new EventEmitter<string>();
    const listener = jest.fn();

    emitter.event(listener);
    emitter.fire('test event');

    expect(listener).toHaveBeenCalledWith('test event');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should fire events to multiple listeners', () => {
    const emitter = new EventEmitter<number>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.event(listener1);
    emitter.event(listener2);
    emitter.fire(42);

    expect(listener1).toHaveBeenCalledWith(42);
    expect(listener2).toHaveBeenCalledWith(42);
  });

  it('should dispose individual listeners', () => {
    const emitter = new EventEmitter<string>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const disposable1 = emitter.event(listener1);
    emitter.event(listener2);

    disposable1.dispose();
    emitter.fire('after dispose');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith('after dispose');
  });

  it('should dispose all listeners', () => {
    const emitter = new EventEmitter<string>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.event(listener1);
    emitter.event(listener2);

    emitter.dispose();
    emitter.fire('after dispose all');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should handle errors in listeners gracefully', () => {
    const emitter = new EventEmitter<string>();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const goodListener = jest.fn();
    const badListener = jest.fn(() => {
      throw new Error('Listener error');
    });

    emitter.event(badListener);
    emitter.event(goodListener);

    emitter.fire('test');

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('should allow multiple fires', () => {
    const emitter = new EventEmitter<number>();
    const listener = jest.fn();

    emitter.event(listener);

    emitter.fire(1);
    emitter.fire(2);
    emitter.fire(3);

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 2);
    expect(listener).toHaveBeenNthCalledWith(3, 3);
  });

  it('should handle complex event types', () => {
    interface ComplexEvent {
      id: number;
      message: string;
      data: { key: string };
    }

    const emitter = new EventEmitter<ComplexEvent>();
    const listener = jest.fn();

    emitter.event(listener);

    const event: ComplexEvent = {
      id: 123,
      message: 'test',
      data: { key: 'value' },
    };

    emitter.fire(event);

    expect(listener).toHaveBeenCalledWith(event);
  });
});
