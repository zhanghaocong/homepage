import type { HomeState } from '~/features/home/state/homeState'
import type { Signal } from '~/shared/lib/signal'

let homeStateSignal: Signal<HomeState> | null = null

export function bindHomeState(signal: Signal<HomeState>) {
  homeStateSignal = signal
}

export function unbindHomeState() {
  homeStateSignal = null
}

/** Whether mesh layout should follow splash gather (not visibility culling). */
export function isHomeSplashLayoutActive() {
  const state = homeStateSignal?.getSnapshot()
  if (!state) return false
  return state.shell.gather || state.shell.load
}
