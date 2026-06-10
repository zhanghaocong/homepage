import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/wall/canvas/gallery-canvas/types'
import { createJsScroll, type JsScroll } from '~/features/wall/lib/jsScroll'

type UseGalleryScrollOptions = {
  enabled: boolean
  wrapRef: RefObject<HTMLDivElement | null>
  canvasEngineRef: MutableRefObject<GalleryEngineHandle | null>
  scrollRef: MutableRefObject<JsScroll | null>
  onCategoryChange: (category: string) => void
  onScrollUpdate?: () => void
}

function syncCanvasAfterResize(canvas: GalleryEngineHandle) {
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

export function useGalleryScroll({
  enabled,
  wrapRef,
  canvasEngineRef,
  scrollRef,
  onCategoryChange,
  onScrollUpdate,
}: UseGalleryScrollOptions) {
  const onCategoryChangeRef = useRef(onCategoryChange)
  onCategoryChangeRef.current = onCategoryChange
  const onScrollUpdateRef = useRef(onScrollUpdate)
  onScrollUpdateRef.current = onScrollUpdate

  useEffect(() => {
    if (!enabled) return

    const wrap = wrapRef.current
    if (!wrap) return

    let raf = 0

    const scroll = createJsScroll({
      wrap,
      onCategoryChange: (category) => onCategoryChangeRef.current(category),
      onUpdateAfter: () => onScrollUpdateRef.current?.(),
      onResizeAfter: () => {
        const canvas = canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
    })

    scrollRef.current = scroll

    const scrollLoop = () => {
      scroll.raf()
      raf = requestAnimationFrame(scrollLoop)
    }
    raf = requestAnimationFrame(scrollLoop)

    return () => {
      cancelAnimationFrame(raf)
      scroll.destroy()
      scrollRef.current = null
    }
  }, [canvasEngineRef, enabled, scrollRef, wrapRef])
}

export { syncCanvasAfterResize }
