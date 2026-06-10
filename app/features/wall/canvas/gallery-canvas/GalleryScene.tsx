import { useCallback, useEffect, useState } from 'react'
import { GalleryCamera } from '~/features/wall/canvas/gallery-canvas/GalleryCamera'
import { GalleryEngineBridge } from '~/features/wall/canvas/gallery-canvas/GalleryEngineBridge'
import { GalleryPhotoMeshes } from '~/features/wall/canvas/gallery-canvas/GalleryPhotoMeshes'
import { GalleryPostProcessing } from '~/features/wall/canvas/gallery-canvas/GalleryPostProcessing'
import { GallerySyncSystem } from '~/features/wall/canvas/gallery-canvas/GallerySyncSystem'
import { getViewportSize } from '~/features/wall/canvas/gallery-canvas/cameraUtils'
import type { GalleryMeshRegistry } from '~/features/wall/canvas/gallery-canvas/galleryMeshRegistry'
import type { GalleryEngineHandle } from '~/features/wall/canvas/gallery-canvas/types'
import { registerGalleryMeshRegistry, unregisterGalleryMeshRegistry } from '~/features/wall/lib/galleryRegistryBridge'
import type { JsScroll } from '~/features/wall/lib/jsScroll'

type GallerySceneProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
  onEngineReady?: () => void
}

export function GalleryScene({ engineRef, scrollRef, onEngineReady }: GallerySceneProps) {
  const [meshRegistry, setMeshRegistry] = useState<GalleryMeshRegistry | null>(null)
  const isMobile = getViewportSize().w < 680

  const handleRegistry = useCallback((registry: GalleryMeshRegistry | null) => {
    setMeshRegistry(registry)
  }, [])

  useEffect(() => {
    if (!meshRegistry) return
    registerGalleryMeshRegistry(meshRegistry)
    return () => unregisterGalleryMeshRegistry()
  }, [meshRegistry])

  return (
    <>
      <GalleryCamera />
      <GalleryPhotoMeshes isMobile={isMobile} onRegistry={handleRegistry} onMeshesReady={onEngineReady} />
      {meshRegistry ? (
        <>
          <GalleryEngineBridge engineRef={engineRef} meshRegistry={meshRegistry} />
          <GalleryPostProcessing meshRegistry={meshRegistry} />
        </>
      ) : null}
      <GallerySyncSystem engineRef={engineRef} scrollRef={scrollRef} />
    </>
  )
}
