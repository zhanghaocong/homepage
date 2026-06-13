/** Homepage runtime phase — drives loader, splash, wall scroll, and photo view. */
export type HomePhase = 'boot' | 'loading' | 'splash' | 'wall' | 'photoView' | 'photoViewExit'

/** `<html>` class flags — sole source of truth for document-level CSS hooks. */
export type HomeDocumentState = {
  loadBefore: boolean
  load: boolean
  gather: boolean
  photoView: boolean
  photoViewUi: boolean
  photoViewExit: boolean
}

export type HomeState = {
  phase: HomePhase
  loadProgress: number
  currentCategory: string
  photoViewOpen: boolean
  doc: HomeDocumentState
}

export const INITIAL_HOME_DOCUMENT: HomeDocumentState = {
  loadBefore: false,
  load: false,
  gather: false,
  photoView: false,
  photoViewUi: false,
  photoViewExit: false,
}

export const INITIAL_HOME_STATE: HomeState = {
  phase: 'boot',
  loadProgress: 0,
  currentCategory: 'interior',
  photoViewOpen: false,
  doc: { ...INITIAL_HOME_DOCUMENT },
}
