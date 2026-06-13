import type { Signal } from '~/shared/lib/signal'

/** Homepage runtime phase — drives loader, splash, wall scroll, and photo view shell CSS. */
export type HomePhase = 'boot' | 'loading' | 'splash' | 'wall' | 'photoView' | 'photoViewExit'

/** Shell presentation flags — applied as React className on `.xhr-wrap`, never written to `<html>`. */
export type HomeShellFlags = {
  loadBefore: boolean
  load: boolean
  gather: boolean
  photoViewExit: boolean
}

export type HomeState = {
  phase: HomePhase
  loadProgress: number
  currentCategory: string
  shell: HomeShellFlags
}

export type HomeStatePatch = Partial<Omit<HomeState, 'shell'>> & {
  shell?: Partial<HomeShellFlags>
}

export const INITIAL_HOME_SHELL: HomeShellFlags = {
  loadBefore: false,
  load: false,
  gather: false,
  photoViewExit: false,
}

export const INITIAL_HOME_STATE: HomeState = {
  phase: 'boot',
  loadProgress: 0,
  currentCategory: 'interior',
  shell: { ...INITIAL_HOME_SHELL },
}

type HomeStateStore = {
  getSnapshot(): HomeState
  set(next: HomeState): void
}

/** Immutable merge for nested `shell` — shared by HomeController and splash hooks. */
export function applyHomeStatePatch(state: HomeStateStore, patch: HomeStatePatch) {
  const prev = state.getSnapshot()
  state.set({
    ...prev,
    ...patch,
    shell: patch.shell ? { ...prev.shell, ...patch.shell } : prev.shell,
  })
}

/** Sync homepage phase when photo-view opens/closes — keeps photo-view free of home imports. */
export function syncHomePhaseFromPhotoView(state: Signal<HomeState>, photoViewOpen: boolean) {
  const home = state.getSnapshot()

  if (photoViewOpen) {
    if (home.phase !== 'photoView' && home.phase !== 'photoViewExit') {
      applyHomeStatePatch(state, { phase: 'photoView' })
    }
    return
  }

  if (home.phase === 'photoView') {
    applyHomeStatePatch(state, { phase: 'wall', shell: { photoViewExit: false } })
  }
}

export function isHomeSplashLayoutActive(state: HomeState) {
  return state.shell.gather || state.shell.load
}

/** Loading / splash / exit-reveal — canvas should keep rendering; scroll input stays off until wall. */
export function isHomeIntroActive(state: HomeState) {
  return (
    state.phase === 'loading' ||
    state.phase === 'splash' ||
    state.phase === 'photoViewExit' ||
    state.shell.loadBefore ||
    state.shell.load ||
    state.shell.gather
  )
}
