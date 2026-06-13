import { PhotoView } from '~/features/photo-view/PhotoView'
import { GalleryCanvasHost } from '~/features/home/components/gallery/GalleryCanvasHost'
import { GalleryCategoryNav } from '~/features/home/components/gallery/GalleryCategoryNav'
import { GallerySplash } from '~/features/home/components/gallery/GallerySplash'
import { useHomeController, useHomeMount, useHomeUi } from '~/features/home/ctx'

export function GalleryShell() {
  const controller = useHomeController()
  const ui = useHomeUi()

  useHomeMount()

  return (
    <div
      className={`xhr-wrap${ui.photoViewOpen ? 'is-photo-view-open' : ''}`}
      data-xhr-namespace="home"
      ref={controller.shellRef}
    >
      <PhotoView wrapRef={controller.wrapRef} />
      <div className="js-wrapper p-home" ref={controller.wrapRef}>
        <div className="js-page__cover" />
        <div className="js-page">
          <div className="js-body" data-dir="hr">
            <div className="c-content js-gl__wrap" aria-hidden="true" />
          </div>
        </div>

        <GalleryCategoryNav />
        <GalleryCanvasHost />
      </div>

      <div className="c-scrollbar">
        <div className="c-thumb">
          <div className="c-pivot" />
          <div className="c-pivot" />
        </div>
      </div>

      <GallerySplash />
    </div>
  )
}
