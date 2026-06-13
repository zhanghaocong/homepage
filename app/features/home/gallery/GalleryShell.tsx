import { PhotoView } from '~/features/photo-view/PhotoView'
import { PhotoViewHostContext } from '~/features/photo-view/ctx'
import { GalleryCanvasHost } from '~/features/home/gallery/GalleryCanvasHost'
import { GalleryCategoryNav } from '~/features/home/gallery/GalleryCategoryNav'
import { GalleryScrollbar } from '~/features/home/gallery/GalleryScrollbar'
import { GallerySplash } from '~/features/home/gallery/GallerySplash'
import { useHomeController, useHomeMount, useHomeState } from '~/features/home/ctx'
import { homeShellClassName, homeWrapClassName } from '~/features/home/lib/homeShellClassName'

export function GalleryShell() {
  const controller = useHomeController()
  const state = useHomeState()

  useHomeMount()

  return (
    <PhotoViewHostContext value={controller.getPhotoViewHost()}>
      <div className={homeShellClassName(state)} data-xhr-namespace="home" ref={controller.shellRef}>
        <PhotoView wrapRef={controller.wrapRef} />
        <div className={homeWrapClassName(state)} ref={controller.wrapRef}>
          <div className="js-page__cover" />
          <div className="js-page">
            <div className="js-body" data-dir="hr">
              <div className="c-content js-gl__wrap" aria-hidden="true" />
            </div>
          </div>

          <GalleryCategoryNav />
          <GalleryCanvasHost />
        </div>

        <GalleryScrollbar
          thumbBeforeRef={controller.scrollThumbBeforeRef}
          thumbAfterRef={controller.scrollThumbAfterRef}
        />

        <GallerySplash />
      </div>
    </PhotoViewHostContext>
  )
}
