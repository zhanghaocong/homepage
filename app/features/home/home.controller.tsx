import type { MutableRefObject, RefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { closePhotoView, registerPhotoViewContext, unregisterPhotoViewContext } from '~/features/photo-view/lib/photoViewController'
import { buildGalleryLayout } from '~/features/home/lib/buildGalleryLayout'
import { disposeGalleryAtlas } from '~/features/home/lib/galleryAtlas'
import { resetGalleryLayoutStore } from '~/features/home/lib/galleryLayoutStore'
import { initGalleryMode } from '~/features/home/lib/galleryStore'
import { createJsScroll, type JsScroll } from '~/features/home/lib/jsScroll'
import { preloadGalleryImages } from '~/features/home/lib/preloadGalleryImages'
import { runHomeSplash } from '~/features/home/lib/splashAnimation'
import { initViewport } from '~/features/home/lib/viewport'

const LOADER_TICK_MS = 10.1010101010101
const LOADER_STEP = 3
const LOADER_CAP = 99

const INITIAL_UI: HomeUiState = {
  photoViewOpen: false,
  loadProgress: 0,
  currentCategory: 'interior',
}

export type HomeUiState = {
  photoViewOpen: boolean
  loadProgress: number
  currentCategory: string
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

export class HomeController {
  readonly shellRef: RefObject<HTMLDivElement | null> = { current: null }
  readonly wrapRef: RefObject<HTMLDivElement | null> = { current: null }
  readonly canvasWrapRef: RefObject<HTMLDivElement | null> = { current: null }
  readonly canvasEngineRef: MutableRefObject<GalleryEngineHandle | null> = { current: null }
  readonly scrollRef: MutableRefObject<JsScroll | null> = { current: null }

  private uiState: HomeUiState = { ...INITIAL_UI }
  private uiListeners = new Set<() => void>()
  private attached = false
  private scroll: JsScroll | null = null
  private stopViewport: (() => void) | null = null
  private stopLoader: (() => void) | null = null
  private splashStarted = false
  private scrollCategory = 'interior'
  private selectedCategory: string | null = null

  subscribe = (listener: () => void) => {
    this.uiListeners.add(listener)
    return () => this.uiListeners.delete(listener)
  }

  getSnapshot = (): HomeUiState => this.uiState

  attach() {
    if (this.attached) return
    this.attached = true

    initGalleryMode()
    document.documentElement.classList.add('is-load__before')
    this.stopViewport = initViewport()
    buildGalleryLayout()

    const shell = this.shellRef.current
    const wrap = this.wrapRef.current
    if (!shell || !wrap) {
      this.attached = false
      return
    }

    this.startScroll(wrap)
    this.registerPhotoView(shell, wrap)
    this.startLoader()

    window.addEventListener('keydown', this.onKeyDown)
  }

  detach() {
    if (!this.attached) return
    this.attached = false

    window.removeEventListener('keydown', this.onKeyDown)
    this.stopScroll()
    this.stopLoader?.()
    this.stopLoader = null
    unregisterPhotoViewContext()
    this.stopViewport?.()
    this.stopViewport = null
    resetGalleryLayoutStore()
    disposeGalleryAtlas()
    document.documentElement.classList.remove('is-load__before')
    this.canvasEngineRef.current = null
    this.splashStarted = false
    this.scrollCategory = 'interior'
    this.selectedCategory = null
    this.uiState = { ...INITIAL_UI }
    this.notifyUi()
  }

  jumpToCategory(category: string) {
    this.selectedCategory = category
    this.syncCurrentCategory()
    this.scroll?.jumpToCategory(category)
  }

  handleEngineReady() {
    requestAnimationFrame(() => {
      this.canvasEngineRef.current?.warmupRender()
    })
  }

  private patchUi(patch: Partial<HomeUiState>) {
    this.uiState = { ...this.uiState, ...patch }
    this.notifyUi()
  }

  private notifyUi() {
    for (const listener of this.uiListeners) listener()
  }

  private syncCurrentCategory() {
    this.patchUi({ currentCategory: this.selectedCategory ?? this.scrollCategory })
  }

  private onScrollCategoryChange = (category: string) => {
    this.scrollCategory = category
    this.syncCurrentCategory()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closePhotoView()
  }

  private startScroll(wrap: HTMLElement) {
    this.scroll = createJsScroll({
      wrap,
      onCategoryChange: this.onScrollCategoryChange,
      onResizeAfter: () => {
        const canvas = this.canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
    })
    this.scrollRef.current = this.scroll
    // Bootstrap layout before R3F's first useFrame.
    this.scroll.raf()
  }

  private stopScroll() {
    this.scroll?.destroy()
    this.scroll = null
    this.scrollRef.current = null
  }

  private registerPhotoView(shell: HTMLElement, wrap: HTMLElement) {
    if (!this.scroll) return

    registerPhotoViewContext(
      this.scroll,
      wrap,
      (open) => this.patchUi({ photoViewOpen: open }),
      () => {
        const canvas = this.canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
      shell,
    )
  }

  private startLoader() {
    if (this.splashStarted || this.stopLoader) return

    let countEnd = false
    let loadEnd = false
    let counter = 0
    let cancelled = false
    let completed = false

    const bumpProgress = (value: number) => {
      this.patchUi({ loadProgress: Math.max(0, Math.min(100, value)) })
    }

    const tryComplete = () => {
      if (cancelled || completed || !loadEnd || !countEnd) return
      completed = true
      bumpProgress(100)
      this.startSplash()
    }

    const { promise, cancel } = preloadGalleryImages(({ ratio }) => {
      bumpProgress(Math.min(LOADER_CAP, Math.floor(ratio * 100)))
      if (ratio >= 1) {
        loadEnd = true
        tryComplete()
      }
    })

    const counterId = window.setInterval(() => {
      if (counter < LOADER_CAP) {
        counter += LOADER_STEP
        bumpProgress(counter)
        return
      }
      window.clearInterval(counterId)
      countEnd = true
      tryComplete()
    }, LOADER_TICK_MS)

    void promise.catch(() => {
      loadEnd = true
      tryComplete()
    })

    this.stopLoader = () => {
      cancelled = true
      cancel()
      window.clearInterval(counterId)
    }
  }

  private startSplash() {
    if (this.splashStarted) return
    this.splashStarted = true

    const shell = this.shellRef.current
    const scroll = this.scroll
    if (!shell || !scroll) return

    runHomeSplash(shell, scroll, {
      onGatherSet: () => {
        const canvas = this.canvasEngineRef.current
        if (canvas) {
          canvas.homeScene.syncMeshes()
          canvas.warmupRender()
        }
      },
      onReveal: () => {
        const canvas = this.canvasEngineRef.current
        if (canvas) {
          canvas.homeScene.syncMeshes()
          canvas.warmupRender()
        }
      },
      onGatherComplete: () => {
        scroll.remeasure()
        const canvas = this.canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
    })
  }
}
