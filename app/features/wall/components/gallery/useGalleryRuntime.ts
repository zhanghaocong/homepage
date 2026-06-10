import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/wall/canvas/gallery-canvas/types'
import { syncCanvasAfterResize, useGalleryScroll } from '~/features/wall/hooks/useGalleryScroll'
import { useGalleryLoader } from '~/features/wall/hooks/useGalleryLoader'
import { buildGalleryLayout } from '~/features/wall/lib/buildGalleryLayout'
import { disposeGalleryAtlas } from '~/features/wall/lib/galleryAtlas'
import { resetGalleryLayoutStore } from '~/features/wall/lib/galleryLayoutStore'
import { initGalleryMode } from '~/features/wall/lib/galleryStore'
import type { JsScroll } from '~/features/wall/lib/jsScroll'
import { closePhotoView, registerPhotoViewContext, unregisterPhotoViewContext } from '~/features/photo-view/lib/photoViewController'
import { runHomeSplash } from '~/features/wall/lib/splashAnimation'
import { initViewport } from '~/features/wall/lib/viewport'

export type GalleryRuntime = {
  shellRef: RefObject<HTMLDivElement | null>
  wrapRef: RefObject<HTMLDivElement | null>
  canvasWrapRef: RefObject<HTMLDivElement | null>
  canvasEngineRef: MutableRefObject<GalleryEngineHandle | null>
  scrollRef: MutableRefObject<JsScroll | null>
  canvasReady: boolean
  photoViewOpen: boolean
  loadProgress: number
  currentCategory: string
  handleEngineReady: () => void
  jumpToCategory: (category: string) => void
}

export function useGalleryRuntime(): GalleryRuntime {
  const shellRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const canvasEngineRef = useRef<GalleryEngineHandle | null>(null)
  const scrollRef = useRef<JsScroll | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [photoViewOpen, setPhotoViewOpen] = useState(false)
  const [scrollCategory, setScrollCategory] = useState('interior')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [layoutReady, setLayoutReady] = useState(false)
  const [splashStarted, setSplashStarted] = useState(false)
  const enginesRef = useRef<{ scroll: JsScroll | null }>({ scroll: null })

  const currentCategory = selectedCategory ?? scrollCategory

  useEffect(() => {
    initGalleryMode()
    document.documentElement.classList.add('is-load__before')

    const stopViewport = initViewport()
    buildGalleryLayout()
    setLayoutReady(true)

    return () => {
      stopViewport()
      setLayoutReady(false)
      setSplashStarted(false)
      resetGalleryLayoutStore()
      disposeGalleryAtlas()
    }
  }, [])

  useGalleryScroll({
    enabled: layoutReady,
    wrapRef,
    canvasEngineRef,
    scrollRef,
    onCategoryChange: setScrollCategory,
    onScrollUpdate: () => {
      const scroll = scrollRef.current
      if (scroll) enginesRef.current.scroll = scroll
    },
  })

  useEffect(() => {
    if (!layoutReady) return

    const shell = shellRef.current
    const wrap = wrapRef.current
    if (!shell || !wrap) return

    const scroll = scrollRef.current
    if (!scroll) return

    enginesRef.current.scroll = scroll
    registerPhotoViewContext(
      scroll,
      wrap,
      setPhotoViewOpen,
      () => {
        const canvas = canvasEngineRef.current
        if (!canvas) return
        syncCanvasAfterResize(canvas)
      },
      shell,
    )
    setCanvasReady(true)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePhotoView()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      unregisterPhotoViewContext()
      setCanvasReady(false)
      setPhotoViewOpen(false)
      canvasEngineRef.current = null
      enginesRef.current.scroll = null
    }
  }, [layoutReady])

  const startSplash = useCallback(() => {
    if (splashStarted) return
    setSplashStarted(true)

    const shell = shellRef.current
    const scroll = scrollRef.current
    if (!shell || !scroll) return

    runHomeSplash(shell, scroll, {
      onGatherSet: () => {
        const canvas = canvasEngineRef.current
        if (canvas) {
          canvas.homeScene.syncMeshes()
          canvas.warmupRender()
        }
      },
      onReveal: () => {
        const canvas = canvasEngineRef.current
        if (canvas) {
          canvas.homeScene.syncMeshes()
          canvas.warmupRender()
        }
      },
      onGatherComplete: () => {
        scroll.remeasure()
        const canvas = canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
    })
  }, [splashStarted])

  const loadProgress = useGalleryLoader(layoutReady && !splashStarted, startSplash)

  const handleEngineReady = useCallback(() => {
    requestAnimationFrame(() => {
      canvasEngineRef.current?.warmupRender()
    })
  }, [])

  const jumpToCategory = useCallback((category: string) => {
    setSelectedCategory(category)
    enginesRef.current.scroll?.jumpToCategory(category)
  }, [])

  return {
    shellRef,
    wrapRef,
    canvasWrapRef,
    canvasEngineRef,
    scrollRef,
    canvasReady,
    photoViewOpen,
    loadProgress,
    currentCategory,
    handleEngineReady,
    jumpToCategory,
  }
}
