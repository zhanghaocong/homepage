import { lazy, Suspense } from 'react'
import { useHomeController, useHomeUi } from '~/features/home/ctx'

const GalleryCanvas = lazy(() =>
  import('~/features/home/canvas/gallery-canvas/GalleryCanvas').then((module) => ({
    default: module.GalleryCanvas,
  })),
)

export function GalleryCanvasHost() {
  const controller = useHomeController()
  const { canvasReady } = useHomeUi()

  return (
    <div className="js-canvas__wrap" ref={controller.canvasWrapRef} aria-hidden="true">
      {canvasReady ? (
        <Suspense fallback={null}>
          <GalleryCanvas
            engineRef={controller.canvasEngineRef}
            scrollRef={controller.scrollRef}
            onEngineReady={() => controller.handleEngineReady()}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
