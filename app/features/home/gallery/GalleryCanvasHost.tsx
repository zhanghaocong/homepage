import { lazy, Suspense, type ComponentProps } from 'react'
import { useHomeController } from '~/features/home/ctx'

const GalleryCanvas = lazy(() =>
  import('~/features/home/canvas/GalleryCanvas').then((m) => ({ default: m.GalleryCanvas })),
)

type GalleryCanvasProps = ComponentProps<typeof GalleryCanvas>

function GalleryCanvasLoader(props: GalleryCanvasProps) {
  return (
    <Suspense fallback={null}>
      <GalleryCanvas {...props} />
    </Suspense>
  )
}

export function GalleryCanvasHost() {
  const controller = useHomeController()

  return (
    <div className="js-canvas__wrap" ref={controller.canvasWrapRef} aria-hidden="true">
      <GalleryCanvasLoader
        engineRef={controller.canvasEngineRef}
        scrollRef={controller.scrollRef}
        canvasInvalidateRef={controller.canvasInvalidateRef}
        onEngineReady={() => controller.handleEngineReady()}
      />
    </div>
  )
}
