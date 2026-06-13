type SignalListener = () => void

/**
 * Minimal external store for useSyncExternalStore — subscribe + immutable snapshots.
 */
export class Signal<T> {
  private value: T
  private listeners = new Set<SignalListener>()

  constructor(initial: T) {
    this.value = initial
  }

  subscribe = (listener: SignalListener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): T => this.value

  set(next: T) {
    if (Object.is(this.value, next)) return
    this.value = next
    this.emit()
  }

  patch(patch: Partial<T>) {
    this.set({ ...this.value, ...patch })
  }

  reset(next: T) {
    this.value = next
    this.emit()
  }

  private emit() {
    for (const listener of this.listeners) listener()
  }
}
