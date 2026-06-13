import { galleryImages, imageUrl } from '~/data/gallery'
import { getPhotoViewHost } from '~/features/photo-view/lib/photoViewHostRegistry'
import { rectFromLayoutId } from '~/features/photo-view/lib/photoViewLayout'
import {
  CATE_ID_TO_KEY,
  findImageIndex,
  getPhotoViewState,
  normalizePhotoCategory,
  resetPhotoViewState,
  setPhotoViewState,
} from '~/features/photo-view/lib/photoViewStore'

export function getPhotoViewOpen() {
  return getPhotoViewState().open
}

export function isPhotoViewClosing() {
  return getPhotoViewState().closing
}

export function requestOpenPhotoView(layoutId: string) {
  if (isPhotoViewClosing() || getPhotoViewOpen()) return
  openPhotoViewFromLayoutId(layoutId)
}

export function openPhotoViewFromLayoutId(layoutId: string) {
  const host = getPhotoViewHost()
  const spec = host.getFrameSpec(layoutId)
  if (!spec) return

  const category = normalizePhotoCategory(spec.category)
  const cateKey = CATE_ID_TO_KEY[category]
  const images = galleryImages[cateKey]
  const clickedSrc = spec.jsSrc
  const foundIndex = findImageIndex(images, clickedSrc)
  const activeIndex = foundIndex >= 0 ? foundIndex : 0
  const heroImage = images[activeIndex] ?? images[0]
  const heroSrc = heroImage ? imageUrl(heroImage['2048x2048']) : clickedSrc

  setPhotoViewState({
    open: true,
    closing: false,
    uiReady: false,
    category,
    activeIndex,
    heroSrc,
    sourceLayoutId: layoutId,
    fromRect: rectFromLayoutId(layoutId),
  })

  host.setScrollLocked(true)
  host.ensureCanvasVisible()
  host.hideWallDomImmediately()
}

export function markPhotoViewUiReady() {
  setPhotoViewState({ uiReady: true })
}

export function closePhotoView() {
  if (isPhotoViewClosing() || !getPhotoViewOpen()) return
  completeClosePhotoView()
}

/** Fade scroll wall back in before homepage-style gather/reveal. */
export function preparePhotoViewWallReveal() {
  const host = getPhotoViewHost()
  host.ensureCanvasVisible()
  host.fadeWallDom(true)
}

export function completeClosePhotoView() {
  const host = getPhotoViewHost()
  resetPhotoViewState()
  host.setScrollLocked(false)
  host.ensureCanvasVisible()
  host.showWallDomImmediately()
  host.onPhotoViewAfterClose()
}
