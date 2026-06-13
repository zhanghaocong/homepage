import { INITIAL_HOME_STATE, type HomeState, type HomeStatePatch } from '~/features/home/state/homeState'
import type { Signal } from '~/shared/lib/signal'

let homeStateSignal: Signal<HomeState> | null = null

export function bindHomeState(signal: Signal<HomeState>) {
  homeStateSignal = signal
}

export function unbindHomeState() {
  homeStateSignal = null
}

function requireHomeStateSignal(): Signal<HomeState> {
  if (!homeStateSignal) {
    throw new Error('HomeState is missing — bind it before reading or patching homepage state')
  }
  return homeStateSignal
}

export function getHomeState(): HomeState {
  return requireHomeStateSignal().getSnapshot()
}

export function patchHomeState(patch: HomeStatePatch) {
  const signal = requireHomeStateSignal()
  const prev = signal.getSnapshot()
  signal.set({
    ...prev,
    ...patch,
    shell: patch.shell ? { ...prev.shell, ...patch.shell } : prev.shell,
  })
}

/** Whether mesh layout should follow splash gather (not visibility culling). */
export function isHomeSplashLayoutActive() {
  const state = homeStateSignal?.getSnapshot()
  if (!state) return false
  return state.shell.gather || state.shell.load
}

export function getInitialHomeStateSnapshot(): HomeState {
  return homeStateSignal?.getSnapshot() ?? { ...INITIAL_HOME_STATE }
}
