import { GalleryCanvas } from '~/features/home/canvas/GalleryCanvas'
import { useHomeController, useHomeUi } from '~/features/home/ctx'

export function GalleryCanvasHost() {
  const controller = useHomeController()
  const { canvasReady } = useHomeUi()

  return (
    <div className="js-canvas__wrap" ref={controller.canvasWrapRef} aria-hidden="true">
      {canvasReady ? (
        <GalleryCanvas
          engineRef={controller.canvasEngineRef}
          scrollRef={controller.scrollRef}
          onEngineReady={() => controller.handleEngineReady()}
        />
      ) : null}
    </div>
  )
}
