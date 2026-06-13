import { useFrame } from '@react-three/fiber'
import type { GalleryEngineHandle } from '~/features/home/canvas/gallery-canvas/types'
import type { JsScroll } from '~/features/home/lib/jsScroll'
type GallerySyncSystemProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
}

/**
 * Updates mesh uniforms from scroll power before EffectComposer renders (priority 1).
 */
export function GallerySyncSystem({ engineRef, scrollRef }: GallerySyncSystemProps) {
  useFrame(() => {
    const engine = engineRef.current
    const scroll = scrollRef.current
    if (!engine || !scroll) return
    // Keep syncing while photo view is open so wall layout is current on close.
    engine.tick(scroll.power, scroll.currentCategory)
  }, 1)

  return null
}
