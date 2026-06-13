import { Signal } from '~/shared/lib/signal'

export type GalleryModeState = {
  mode: number
  modeChangePow: number
  APowF: number
}

export const INITIAL_GALLERY_MODE_STATE: GalleryModeState = {
  mode: 0,
  modeChangePow: 0,
  APowF: 0,
}

export const galleryModeState = new Signal<GalleryModeState>({ ...INITIAL_GALLERY_MODE_STATE })

export function getGalleryMode() {
  return galleryModeState.getSnapshot().mode
}

export function getGalleryModeChangePow() {
  return galleryModeState.getSnapshot().modeChangePow
}

export function initGalleryMode() {
  document.documentElement.dataset.mode = 'grid'
  galleryModeState.reset({ ...INITIAL_GALLERY_MODE_STATE })
  syncGalleryGsapTarget()
}

/**
 * GSAP tweens plain object properties; this bridge writes values into galleryModeState.
 */
export const galleryGsapTarget = {
  mode: 0,
  modeChangePow: 0,
  APowF: 0,
}

export function syncGalleryGsapTarget() {
  const state = galleryModeState.getSnapshot()
  galleryGsapTarget.mode = state.mode
  galleryGsapTarget.modeChangePow = state.modeChangePow
  galleryGsapTarget.APowF = state.APowF
}

export function applyGalleryGsapTarget() {
  galleryModeState.patch({
    mode: galleryGsapTarget.mode,
    modeChangePow: galleryGsapTarget.modeChangePow,
    APowF: galleryGsapTarget.APowF,
  })
}
