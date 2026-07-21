type Listener<T> = (event: T) => void;

/** Minimal typed event emitter. No DOM/engine dependency, usable in pure simulation code. */
export class EventEmitter<EventMap extends Record<string, unknown>> {
  private listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } = {};

  on<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): () => void {
    const set = this.listeners[type] ?? new Set();
    set.add(listener);
    this.listeners[type] = set;
    return () => set.delete(listener);
  }

  emit<K extends keyof EventMap>(type: K, event: EventMap[K]): void {
    this.listeners[type]?.forEach((listener) => listener(event));
  }
}
