import { useMemo } from 'react'
import { GalleryCompositeEffectImpl } from '~/components/gallery-canvas/galleryCompositeEffect'
import type { GalleryEffectUniforms } from '~/components/gallery-canvas/galleryMeshRegistry'

export type GalleryCompositeProps = {
  effectUniforms: GalleryEffectUniforms
}

/**
 * Stable effect instance — never use wrapEffect here; it recreates the Effect when
 * uniform values change and triggers EffectComposer.addPass on a lost context.
 */
export function useGalleryCompositeEffect(effectUniforms: GalleryEffectUniforms) {
  return useMemo(() => new GalleryCompositeEffectImpl({ effectUniforms }), [effectUniforms])
}
