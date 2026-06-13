import gsap from 'gsap'
import type { MutableRefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { isFrameVisible, getGridUnit } from '~/features/home/lib/galleryLayout'
import {
  getFrameScreenRect,
  getFrameSpecById,
  getFrameSplashHandoffWorldRect,
  getFrameWorldRect,
  listAllFrameSpecs,
} from '~/features/home/lib/galleryLayoutStore'
import { getGalleryMeshRegistry } from '~/features/home/lib/galleryRegistryBridge'
import type { JsScroll } from '~/features/home/lib/jsScroll'
import { getViewportSize } from '~/features/home/lib/viewport'
import type {
  PhotoViewHost,
  PhotoViewScreenRect,
  PhotoViewWorldRect,
} from '~/features/photo-view/lib/photoViewHost'

const WALL_FADE_SEL = '.p-home .c-content'
const PAGE_COVER_SEL = '.p-home .js-page__cover'

function pointInRect(x: number, y: number, rect: PhotoViewScreenRect) {
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height
}

function pickFrameAt(clientX: number, clientY: number): string | null {
  let best: { id: string; area: number } | null = null

  for (const spec of listAllFrameSpecs()) {
    const screen = getFrameScreenRect(spec.id)
    if (!screen || !isFrameVisible(screen)) continue
    if (!pointInRect(clientX, clientY, screen)) continue
    const area = screen.width * screen.height
    if (!best || area < best.area) {
      best = { id: spec.id, area }
    }
  }

  return best?.id ?? null
}

function toWorldRect(rect: ReturnType<typeof getFrameWorldRect>): PhotoViewWorldRect | null {
  if (!rect) return null
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

export type CreatePhotoViewHostOptions = {
  scrollRef: MutableRefObject<JsScroll | null>
  canvasEngineRef: MutableRefObject<GalleryEngineHandle | null>
  afterPhotoViewClose: () => void
}

export function createPhotoViewHost({
  scrollRef,
  canvasEngineRef,
  afterPhotoViewClose,
}: CreatePhotoViewHostOptions): PhotoViewHost {
  const syncCanvasAfterClose = () => {
    const canvas = canvasEngineRef.current
    if (!canvas) return
    canvas.homeScene.syncMeshes()
    canvas.onResize()
    canvas.warmupRender()
  }

  return {
    getFrameSpec(id) {
      const spec = getFrameSpecById(id)
      if (!spec) return null
      return { id: spec.id, category: spec.category, jsSrc: spec.jsSrc }
    },

    getFrameWorldRect(id) {
      return toWorldRect(getFrameWorldRect(id))
    },

    getFrameScreenRect(id) {
      return getFrameScreenRect(id)
    },

    getSplashHandoffRect(id) {
      const world = getFrameSplashHandoffWorldRect(id)
      if (!world) return null
      return { x: world.x, y: world.y, width: world.width, height: world.height }
    },

    isFrameVisible(rect) {
      return isFrameVisible(rect)
    },

    pickFrameAt(clientX, clientY) {
      return pickFrameAt(clientX, clientY)
    },

    getViewport() {
      return getViewportSize()
    },

    getGridUnit() {
      return getGridUnit()
    },

    enterPhotoView() {
      const registry = getGalleryMeshRegistry()
      if (!registry) return false
      registry.setWallMeshesHidden(true)
      registry.effectUniforms.u_type.value = 0
      return true
    },

    exitPhotoView() {
      const registry = getGalleryMeshRegistry()
      registry?.restoreWallMeshes()
      registry?.onResize()
    },

    setEffectPassthrough(passthrough) {
      const registry = getGalleryMeshRegistry()
      if (!registry) return
      registry.effectUniforms.u_type.value = passthrough ? 0 : 1
    },

    setScrollLocked(locked) {
      scrollRef.current?.setInputEnabled(!locked)
    },

    hideWallDomImmediately() {
      gsap.killTweensOf(PAGE_COVER_SEL)
      gsap.killTweensOf(WALL_FADE_SEL)
      gsap.set(PAGE_COVER_SEL, { opacity: 0 })
      gsap.set(WALL_FADE_SEL, { opacity: 0 })
    },

    showWallDomImmediately() {
      gsap.killTweensOf(PAGE_COVER_SEL)
      gsap.killTweensOf(WALL_FADE_SEL)
      gsap.set(PAGE_COVER_SEL, { opacity: 0 })
      gsap.set(WALL_FADE_SEL, { opacity: 1 })
    },

    fadeWallDom(show) {
      gsap.killTweensOf(PAGE_COVER_SEL)
      gsap.set(PAGE_COVER_SEL, { opacity: 0 })
      if (show) {
        gsap.killTweensOf(WALL_FADE_SEL)
        gsap.set(WALL_FADE_SEL, { opacity: 1 })
      }
      gsap.to(WALL_FADE_SEL, {
        opacity: show ? 1 : 0,
        duration: show ? 0.55 : 0.45,
        ease: show ? 'power2.out' : 'power2.in',
      })
    },

    ensureCanvasVisible() {
      gsap.set('.js-canvas__wrap canvas', { opacity: 1 })
    },

    onPhotoViewAfterClose() {
      syncCanvasAfterClose()
      afterPhotoViewClose()
    },
  }
}
