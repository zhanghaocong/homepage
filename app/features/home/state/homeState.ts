/** Homepage runtime phase — drives loader, splash, wall scroll, and photo view. */
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
  photoViewOpen: boolean
  photoViewUi: boolean
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
  photoViewOpen: false,
  photoViewUi: false,
  shell: { ...INITIAL_HOME_SHELL },
}
