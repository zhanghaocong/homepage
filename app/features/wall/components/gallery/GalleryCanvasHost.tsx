import { lazy, Suspense, type MutableRefObject, type RefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/wall/canvas/gallery-canvas/types'
import type { JsScroll } from '~/features/wall/lib/jsScroll'

const GalleryCanvas = lazy(() =>
  import('~/features/wall/canvas/gallery-canvas/GalleryCanvas').then((module) => ({
    default: module.GalleryCanvas,
  })),
)

type GalleryCanvasHostProps = {
  canvasReady: boolean
  canvasWrapRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  canvasEngineRef: MutableRefObject<GalleryEngineHandle | null>
  scrollRef: MutableRefObject<JsScroll | null>
  onEngineReady: () => void
}

export function GalleryCanvasHost({
  canvasReady,
  canvasWrapRef,
  contentRef,
  canvasEngineRef,
  scrollRef,
  onEngineReady,
}: GalleryCanvasHostProps) {
  return (
    <div className="js-canvas__wrap" ref={canvasWrapRef} aria-hidden="true">
      {canvasReady ? (
        <Suspense fallback={null}>
          <GalleryCanvas
            contentRef={contentRef}
            engineRef={canvasEngineRef}
            scrollRef={scrollRef}
            onEngineReady={onEngineReady}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
