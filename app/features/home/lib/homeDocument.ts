import {
  INITIAL_HOME_DOCUMENT,
  type HomeDocumentState,
  type HomeState,
} from '~/features/home/state/homeState'

let activeDocument: HomeDocumentState = { ...INITIAL_HOME_DOCUMENT }

/** Whether mesh layout should follow splash gather (not visibility culling). */
export function isHomeSplashLayoutActive() {
  return activeDocument.gather || activeDocument.load
}

export function syncHomeDocument(doc: HomeDocumentState) {
  activeDocument = doc
  const html = document.documentElement
  html.classList.toggle('is-load__before', doc.loadBefore)
  html.classList.toggle('is-load', doc.load)
  html.classList.toggle('is-gather', doc.gather)
  html.classList.toggle('l-photo-view', doc.photoView)
  html.classList.toggle('l-cate', doc.photoView)
  html.classList.toggle('l-photo-view-ui', doc.photoViewUi)
  html.classList.toggle('is-photo-view-exit', doc.photoViewExit)
}

export function syncHomeShell(wrap: HTMLElement | null, state: HomeState) {
  syncHomeDocument(state.doc)
  wrap?.classList.toggle('is-photo-view-locked', state.photoViewOpen)
}

export function clearHomeDocument() {
  syncHomeDocument({ ...INITIAL_HOME_DOCUMENT })
}
