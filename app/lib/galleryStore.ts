import { atom, createStore } from 'jotai'

export const galleryStore = createStore()

export const galleryModeAtom = atom(0)
export const galleryModeChangePowAtom = atom(0)
export const galleryAPowFAtom = atom(0)

export function getGalleryMode() {
  return galleryStore.get(galleryModeAtom)
}

export function getGalleryModeChangePow() {
  return galleryStore.get(galleryModeChangePowAtom)
}

export function initGalleryMode() {
  document.documentElement.dataset.mode = 'grid'
  galleryStore.set(galleryModeAtom, 0)
  galleryStore.set(galleryModeChangePowAtom, 0)
  galleryStore.set(galleryAPowFAtom, 0)
  syncGalleryGsapTarget()
}

/**
 * GSAP tweens plain object properties; this bridge writes values into the jotai store.
 */
export const galleryGsapTarget = {
  mode: 0,
  modeChangePow: 0,
  APowF: 0,
}

export function syncGalleryGsapTarget() {
  galleryGsapTarget.mode = galleryStore.get(galleryModeAtom)
  galleryGsapTarget.modeChangePow = galleryStore.get(galleryModeChangePowAtom)
  galleryGsapTarget.APowF = galleryStore.get(galleryAPowFAtom)
}

export function applyGalleryGsapTarget() {
  galleryStore.set(galleryModeAtom, galleryGsapTarget.mode)
  galleryStore.set(galleryModeChangePowAtom, galleryGsapTarget.modeChangePow)
  galleryStore.set(galleryAPowFAtom, galleryGsapTarget.APowF)
}
