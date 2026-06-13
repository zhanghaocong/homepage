import type { MutableRefObject, RefObject } from 'react'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { createPhotoViewHost } from '~/features/home/lib/createPhotoViewHost'
import { clearHomeDocument, syncHomeShell } from '~/features/home/lib/homeDocument'
import {
  INITIAL_HOME_STATE,
  type HomeDocumentState,
  type HomeState,
} from '~/features/home/state/homeState'
import { closePhotoView } from '~/features/photo-view/lib/photoViewController'
import { registerPhotoViewHost, unregisterPhotoViewHost } from '~/features/photo-view/lib/photoViewHostRegistry'
import type { PhotoViewHost } from '~/features/photo-view/lib/photoViewHost'
import { buildGalleryLayout } from '~/features/home/lib/buildGalleryLayout'
import { disposeGalleryAtlas } from '~/features/home/lib/galleryAtlas'
import { resetGalleryLayoutStore } from '~/features/home/lib/galleryLayoutStore'
import { initGalleryMode } from '~/features/home/lib/galleryStore'
import { createJsScroll, type JsScroll } from '~/features/home/lib/jsScroll'
import { preloadGalleryImages } from '~/features/home/lib/preloadGalleryImages'
import { runHomeSplash } from '~/features/home/lib/splashAnimation'
import { initViewport } from '~/features/home/lib/viewport'
import { Signal } from '~/shared/lib/signal'

const LOADER_TICK_MS = 10.1010101010101
const LOADER_STEP = 3
const LOADER_CAP = 99

/** @deprecated Use HomeState from ~/features/home/state/homeState */
export type HomeUiState = HomeState

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
  readonly scrollThumbBeforeRef: RefObject<HTMLDivElement | null> = { current: null }
  readonly scrollThumbAfterRef: RefObject<HTMLDivElement | null> = { current: null }
  readonly canvasEngineRef: MutableRefObject<GalleryEngineHandle | null> = { current: null }
  readonly scrollRef: MutableRefObject<JsScroll | null> = { current: null }
  readonly state = new Signal<HomeState>({ ...INITIAL_HOME_STATE })

  private photoViewHost: PhotoViewHost | null = null
  private attached = false
  private scroll: JsScroll | null = null
  private stopViewport: (() => void) | null = null
  private stopLoader: (() => void) | null = null
  private splashStarted = false
  private scrollCategory = 'interior'
  private selectedCategory: string | null = null

  subscribe = this.state.subscribe
  getSnapshot = this.state.getSnapshot

  getPhotoViewHost(): PhotoViewHost {
    if (!this.photoViewHost) {
      this.photoViewHost = createPhotoViewHost({
        scrollRef: this.scrollRef,
        canvasEngineRef: this.canvasEngineRef,
        onPhotoViewOpenChange: (open) => {
          const prev = this.state.getSnapshot()
          this.patchState({
            photoViewOpen: open,
            phase: open ? 'photoView' : 'wall',
            doc: {
              photoView: open,
              photoViewUi: open ? prev.doc.photoViewUi : false,
              photoViewExit: false,
            },
          })
        },
        patchDocument: (patch) => this.patchState({ doc: patch }),
        afterPhotoViewClose: () => {},
      })
      registerPhotoViewHost(this.photoViewHost)
    }
    return this.photoViewHost
  }

  attach() {
    if (this.attached) return
    this.attached = true

    initGalleryMode()
    this.stopViewport = initViewport()
    buildGalleryLayout()

    const shell = this.shellRef.current
    const wrap = this.wrapRef.current
    if (!shell || !wrap) {
      this.attached = false
      return
    }

    this.patchState({ phase: 'loading', doc: { loadBefore: true } })
    this.startScroll(wrap)
    this.getPhotoViewHost()
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
    unregisterPhotoViewHost()
    this.photoViewHost = null
    this.stopViewport?.()
    this.stopViewport = null
    resetGalleryLayoutStore()
    disposeGalleryAtlas()
    this.canvasEngineRef.current = null
    this.splashStarted = false
    this.scrollCategory = 'interior'
    this.selectedCategory = null
    this.state.reset({ ...INITIAL_HOME_STATE })
    clearHomeDocument()
    syncHomeShell(this.wrapRef.current, INITIAL_HOME_STATE)
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

  private patchState(patch: Partial<Omit<HomeState, 'doc'>> & { doc?: Partial<HomeDocumentState> }) {
    const prev = this.state.getSnapshot()
    const next: HomeState = {
      ...prev,
      ...patch,
      doc: patch.doc ? { ...prev.doc, ...patch.doc } : prev.doc,
    }
    this.state.set(next)
    syncHomeShell(this.wrapRef.current, next)
  }

  private syncCurrentCategory() {
    this.patchState({ currentCategory: this.selectedCategory ?? this.scrollCategory })
  }

  private onScrollCategoryChange = (category: string) => {
    this.scrollCategory = category
    this.syncCurrentCategory()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closePhotoView()
  }

  private startScroll(wrap: HTMLElement) {
    const thumbBefore = this.scrollThumbBeforeRef.current
    const thumbAfter = this.scrollThumbAfterRef.current

    this.scroll = createJsScroll({
      wrap,
      scrollbar: thumbBefore && thumbAfter ? { thumbBefore, thumbAfter } : undefined,
      onCategoryChange: this.onScrollCategoryChange,
      onResizeAfter: () => {
        const canvas = this.canvasEngineRef.current
        if (canvas) syncCanvasAfterResize(canvas)
      },
    })
    this.scrollRef.current = this.scroll
    this.scroll.raf()
  }

  private stopScroll() {
    this.scroll?.destroy()
    this.scroll = null
    this.scrollRef.current = null
  }

  private startLoader() {
    if (this.splashStarted || this.stopLoader) return

    let countEnd = false
    let loadEnd = false
    let counter = 0
    let cancelled = false
    let completed = false

    const bumpProgress = (value: number) => {
      this.patchState({ loadProgress: Math.max(0, Math.min(100, value)) })
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
    this.patchState({ phase: 'splash' })

    const shell = this.shellRef.current
    const scroll = this.scroll
    if (!shell || !scroll) return

    const patchDocument = (doc: Partial<HomeDocumentState>) => this.patchState({ doc })

    runHomeSplash(shell, scroll, {
      patchDocument,
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
        this.patchState({ phase: 'wall' })
      },
    })
  }
}
