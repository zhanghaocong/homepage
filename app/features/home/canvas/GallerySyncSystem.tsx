import { useFrame } from '@react-three/fiber'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import type { JsScroll } from '~/features/home/lib/jsScroll'

type GallerySyncSystemProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
}

/**
 * Single frame loop: scroll physics + layout sync, then mesh uniforms (priority 1).
 * Post-processing renders at priority 2.
 */
export function GallerySyncSystem({ engineRef, scrollRef }: GallerySyncSystemProps) {
  useFrame(() => {
    const scroll = scrollRef.current
    if (!scroll) return

    scroll.raf()

    const engine = engineRef.current
    if (!engine) return
    // Keep syncing while photo view is open so wall layout is current on close.
    engine.tick(scroll.power, scroll.currentCategory)
  }, 1)

  return null
}
