import { PhotoView } from '~/features/photo-view/PhotoView'
import { GalleryCanvasHost } from '~/features/wall/components/gallery/GalleryCanvasHost'
import { GalleryCategoryNav } from '~/features/wall/components/gallery/GalleryCategoryNav'
import { GallerySplash } from '~/features/wall/components/gallery/GallerySplash'
import type { GalleryRuntime } from '~/features/wall/components/gallery/useGalleryRuntime'

type GalleryShellProps = {
  runtime: GalleryRuntime
}

export function GalleryShell({ runtime }: GalleryShellProps) {
  return (
    <div
      className={`xhr-wrap${runtime.photoViewOpen ? 'is-photo-view-open' : ''}`}
      data-xhr-namespace="home"
      ref={runtime.shellRef}
    >
      <PhotoView wrapRef={runtime.wrapRef} />
      <div className="js-wrapper p-home" ref={runtime.wrapRef}>
        <div className="js-page__cover" />
        <div className="js-page">
          <div className="js-body" data-dir="hr">
            <div className="c-content js-gl__wrap" aria-hidden="true" />
          </div>
        </div>

        <GalleryCategoryNav
          activeCategory={runtime.currentCategory}
          onCategorySelect={runtime.jumpToCategory}
        />

        <GalleryCanvasHost
          canvasReady={runtime.canvasReady}
          canvasWrapRef={runtime.canvasWrapRef}
          canvasEngineRef={runtime.canvasEngineRef}
          scrollRef={runtime.scrollRef}
          onEngineReady={runtime.handleEngineReady}
        />
      </div>

      <div className="c-scrollbar">
        <div className="c-thumb">
          <div className="c-pivot" />
          <div className="c-pivot" />
        </div>
      </div>

      <GallerySplash loadProgress={runtime.loadProgress} />
    </div>
  )
}
