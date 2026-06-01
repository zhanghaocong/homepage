import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import type { GalleryEngineHandle } from '~/components/gallery-canvas/types'
import { buildGallerySections } from '~/lib/buildGallerySections'
import { disposeGalleryAtlas } from '~/lib/galleryAtlas'
import { resetGalleryLayoutStore } from '~/lib/galleryLayoutStore'
import { initGalleryMode } from '~/lib/galleryStore'
import { destroyHomePageScript, homePageOnUpdateAfter, initHomePageScript } from '~/lib/homePageScript'
import { createJsScroll, type JsScroll } from '~/lib/jsScroll'
import { initKoalaLoader } from '~/lib/koalaLoader'
import { closePhotoView, registerPhotoViewContext, unregisterPhotoViewContext } from '~/lib/photoViewController'
import { runHomeSplash } from '~/lib/splashAnimation'
import { initViewport } from '~/lib/viewport'

export type GalleryRuntime = {
  shellRef: RefObject<HTMLDivElement | null>
  wrapRef: RefObject<HTMLDivElement | null>
  bodyRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  canvasWrapRef: RefObject<HTMLDivElement | null>
  canvasEngineRef: MutableRefObject<GalleryEngineHandle | null>
  scrollRef: MutableRefObject<JsScroll | null>
  canvasReady: boolean
  photoViewOpen: boolean
  handleEngineReady: () => void
  jumpToCategory: (category: string) => void
}

export function useGalleryRuntime(): GalleryRuntime {
  const shellRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const canvasEngineRef = useRef<GalleryEngineHandle | null>(null)
  const scrollRef = useRef<JsScroll | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [photoViewOpen, setPhotoViewOpen] = useState(false)
  const enginesRef = useRef<{
    scroll: JsScroll
    canvas: GalleryEngineHandle | null
  } | null>(null)

  useEffect(() => {
    const shell = shellRef.current
    const wrap = wrapRef.current
    const body = bodyRef.current
    const content = contentRef.current
    const canvasWrap = canvasWrapRef.current
    if (!shell || !wrap || !body || !content || !canvasWrap) return

    initGalleryMode()
    document.documentElement.classList.add('is-load__before')

    const stopViewport = initViewport()
    buildGallerySections(content)
    initHomePageScript(shell)

    let destroyed = false
    let raf = 0

    const syncCanvasAfterResize = () => {
      const canvas = canvasEngineRef.current
      if (!canvas) return
      const apply = () => {
        canvas.homeScene.syncMeshes()
        canvas.onResize()
        canvas.warmupRender()
      }
      apply()
      requestAnimationFrame(() => {
        apply()
        requestAnimationFrame(apply)
      })
    }

    const scroll = createJsScroll({
      wrap,
      body,
      content,
      onUpdateAfter: () => homePageOnUpdateAfter(scroll),
      onResizeAfter: syncCanvasAfterResize,
    })

    scrollRef.current = scroll
    enginesRef.current = { scroll, canvas: null }
    registerPhotoViewContext(
      scroll,
      wrap,
      setPhotoViewOpen,
      () => {
        const canvas = canvasEngineRef.current
        if (!canvas) return
        canvas.homeScene.syncMeshes()
        canvas.onResize()
        canvas.warmupRender()
        requestAnimationFrame(() => {
          canvas.warmupRender()
          canvas.onResize()
        })
      },
      shell,
    )
    setCanvasReady(true)

    const scrollLoop = () => {
      scroll.raf()
      raf = requestAnimationFrame(scrollLoop)
    }
    raf = requestAnimationFrame(scrollLoop)

    const stopLoader = initKoalaLoader(shell, () => {
      if (destroyed) return
      runHomeSplash(shell, scroll, {
        onGatherSet: () => {
          const canvas = canvasEngineRef.current
          const content = contentRef.current
          if (canvas && content) {
            canvas.homeScene.syncMeshes()
            canvas.warmupRender()
          }
        },
        onReveal: () => {
          const canvas = canvasEngineRef.current
          const content = contentRef.current
          if (canvas && content) {
            canvas.homeScene.syncMeshes()
            canvas.warmupRender()
          }
        },
        onGatherComplete: () => {
          scroll.remeasure()
          syncCanvasAfterResize()
        },
      })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePhotoView()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      destroyed = true
      window.removeEventListener('keydown', onKeyDown)
      unregisterPhotoViewContext()
      setCanvasReady(false)
      setPhotoViewOpen(false)
      stopLoader()
      cancelAnimationFrame(raf)
      stopViewport()
      scroll.destroy()
      scrollRef.current = null
      canvasEngineRef.current = null
      destroyHomePageScript()
      resetGalleryLayoutStore()
      disposeGalleryAtlas()
      enginesRef.current = null
    }
  }, [])

  const handleEngineReady = useCallback(() => {
    if (!enginesRef.current) return
    enginesRef.current.canvas = canvasEngineRef.current
    requestAnimationFrame(() => {
      canvasEngineRef.current?.warmupRender()
    })
  }, [])

  const jumpToCategory = useCallback((category: string) => {
    ;(window as Window & { selectedCategory?: string }).selectedCategory = category
    enginesRef.current?.scroll.jumpToCategory(category)
  }, [])

  return {
    shellRef,
    wrapRef,
    bodyRef,
    contentRef,
    canvasWrapRef,
    canvasEngineRef,
    scrollRef,
    canvasReady,
    photoViewOpen,
    handleEngineReady,
    jumpToCategory,
  }
}
