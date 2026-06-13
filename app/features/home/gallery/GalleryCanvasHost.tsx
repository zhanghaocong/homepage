import { GalleryCanvas } from '~/features/home/canvas/GalleryCanvas'
import { useHomeController } from '~/features/home/ctx'

export function GalleryCanvasHost() {
  const controller = useHomeController()

  return (
    <div className="js-canvas__wrap" ref={controller.canvasWrapRef} aria-hidden="true">
      <GalleryCanvas
        engineRef={controller.canvasEngineRef}
        scrollRef={controller.scrollRef}
        onEngineReady={() => controller.handleEngineReady()}
      />
    </div>
  )
}
