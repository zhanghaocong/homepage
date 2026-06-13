import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useHomeController } from '~/features/home/ctx'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { getGalleryMode, getGalleryModeChangePow } from '~/features/home/lib/galleryStore'
import type { JsScroll } from '~/features/home/lib/jsScroll'
import { isHomeIntroActive } from '~/features/home/state/homeState'
import { usePhotoViewState } from '~/features/photo-view/ctx'
import { photoViewState } from '~/features/photo-view/lib/photoViewStore'

type GallerySyncSystemProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
  canvasInvalidateRef: React.MutableRefObject<(() => void) | null>
}

const MODE_EPS = 0.001

function needsContinuousFrames(
  scroll: JsScroll | null,
  homeState: ReturnType<ReturnType<typeof useHomeController>['getSnapshot']>,
  photoViewOpen: boolean,
) {
  if (isHomeIntroActive(homeState)) return true
  if (photoViewOpen) return true
  if (scroll?.isAnimating()) return true
  if (getGalleryModeChangePow() > MODE_EPS || getGalleryMode() > MODE_EPS) return true
  return false
}

/**
 * Single frame loop: scroll physics + layout sync, then mesh uniforms (priority 1).
 * Post-processing renders at priority 2. Schedules the next frame when frameloop is "demand".
 */
export function GallerySyncSystem({ engineRef, scrollRef, canvasInvalidateRef }: GallerySyncSystemProps) {
  const controller = useHomeController()
  const photoView = usePhotoViewState()
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    canvasInvalidateRef.current = invalidate
    return () => {
      canvasInvalidateRef.current = null
    }
  }, [canvasInvalidateRef, invalidate])

  useEffect(() => {
    const scroll = scrollRef.current
    scroll?.setRequestFrame(invalidate)
    return () => scroll?.setRequestFrame(null)
  }, [scrollRef, invalidate])

  useEffect(() => {
    return photoViewState.subscribe(() => {
      if (photoViewState.getSnapshot().open) invalidate()
    })
  }, [invalidate])

  useEffect(() => {
    return controller.subscribe(() => {
      if (isHomeIntroActive(controller.getSnapshot())) invalidate()
    })
  }, [controller, invalidate])

  useFrame(() => {
    const scroll = scrollRef.current
    if (!scroll) return

    scroll.raf()

    const engine = engineRef.current
    if (engine) {
      // Keep syncing while photo view is open so wall layout is current on close.
      engine.tick(scroll.power, scroll.currentCategory)
    }

    const homeState = controller.getSnapshot()
    if (needsContinuousFrames(scroll, homeState, photoView.open)) {
      invalidate()
    }
  }, 1)

  return null
}
