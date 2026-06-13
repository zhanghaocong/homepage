import { useCallback, useEffect, useState } from 'react'
import { GalleryCamera } from '~/features/home/canvas/GalleryCamera'
import { GalleryEngineBridge } from '~/features/home/canvas/GalleryEngineBridge'
import { GalleryPhotoMeshes } from '~/features/home/canvas/GalleryPhotoMeshes'
import { GalleryPostProcessing } from '~/features/home/canvas/GalleryPostProcessing'
import { GallerySyncSystem } from '~/features/home/canvas/GallerySyncSystem'
import { getViewportSize } from '~/features/home/canvas/cameraUtils'
import type { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { registerGalleryMeshRegistry, unregisterGalleryMeshRegistry } from '~/features/home/lib/galleryRegistryBridge'
import type { JsScroll } from '~/features/home/lib/jsScroll'

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
