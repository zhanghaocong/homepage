import { useCallback, useState } from 'react'
import { GalleryCamera } from '~/features/home/canvas/GalleryCamera'
import { GalleryEngineBridge } from '~/features/home/canvas/GalleryEngineBridge'
import { GalleryPhotoMeshes } from '~/features/home/canvas/GalleryPhotoMeshes'
import { GalleryPostProcessing } from '~/features/home/canvas/GalleryPostProcessing'
import { GallerySyncSystem } from '~/features/home/canvas/GallerySyncSystem'
import { getViewportSize } from '~/features/home/canvas/cameraUtils'
import type { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import type { JsScroll } from '~/features/home/lib/jsScroll'

type GallerySceneProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
  canvasInvalidateRef: React.MutableRefObject<(() => void) | null>
  onEngineReady?: () => void
}

export function GalleryScene({ engineRef, scrollRef, canvasInvalidateRef, onEngineReady }: GallerySceneProps) {
  const [meshRegistry, setMeshRegistry] = useState<GalleryMeshRegistry | null>(null)
  const isMobile = getViewportSize().w < 680

  const handleRegistry = useCallback((registry: GalleryMeshRegistry | null) => {
    setMeshRegistry(registry)
  }, [])

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
      <GallerySyncSystem
        engineRef={engineRef}
        scrollRef={scrollRef}
        canvasInvalidateRef={canvasInvalidateRef}
      />
    </>
  )
}
