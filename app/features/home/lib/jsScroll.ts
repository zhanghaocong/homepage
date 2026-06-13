import gsap from 'gsap'
import { GALLERY_CONTENT_MIN_VW, GALLERY_MESH_OVERSCAN_VW, isGalleryWideAspect } from '~/features/home/lib/galleryLayout'
import {
  appendGalleryLayoutCloneRound,
  clearGalleryLayoutClones,
  getGalleryLayoutDocument,
  getGallerySectionWidth,
  recomputeGalleryMetrics,
  syncGalleryLayoutScroll,
} from '~/features/home/lib/galleryLayoutStore'
import { normalizeCategoryId } from '~/features/home/lib/galleryCategory'
import { getViewportSize, syncViewport } from '~/features/home/lib/viewport'

export type ScrollPower = {
  history: number[]
  delta1: number
  delta2: number
  max: number
  pow0: { value: number }
  pow1: {
    value: number
    duration: number
    ease: string
    tween: gsap.core.Tween | null
  }
  pow2: {
    value: number
    duration: number
    ease: string
    tween: gsap.core.Tween | null
  }
}

type SectionEntry = {
  index: number
  category: string
  isClone: boolean
  left: number
  width: number
  x: number
  cx: number
  progress: number
  selected: boolean
  visible: boolean
}

export type JsScroll = {
  power: ScrollPower
  delta1: number
  currentCategory: string
  raf: () => void
  isAnimating: () => boolean
  setRequestFrame: (fn: (() => void) | null) => void
  onScrollTo: (target: number, duration?: number, delay?: number, ease?: string) => void
  jumpToCategory: (category: string) => void
  remeasure: () => void
  setInputEnabled: (enabled: boolean) => void
  setIntroScrollBlend: (active: boolean) => void
  destroy: () => void
}

export type ScrollScrollbarElements = {
  thumbBefore: HTMLElement
  thumbAfter: HTMLElement
}

type JsScrollOptions = {
  wrap: HTMLElement
  scrollbar?: ScrollScrollbarElements
  speed?: number
  ease?: number
  onCategoryChange?: (category: string) => void
  onUpdateAfter?: () => void
  onResizeAfter?: () => void
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

const roundToNearest = (t: number, e = 1e-6) => (Math.abs(1 - Math.abs(t)) < e ? Math.sign(t) : t)

function getWheelDetail(event: WheelEvent) {
  const deltaX = event.deltaX ? -event.deltaX : 0
  const deltaY = event.deltaY ? -event.deltaY : 0
  return deltaX / 120 + deltaY / 120
}

function createScrollPower(): ScrollPower {
  return {
    history: [],
    delta1: 0,
    delta2: 0,
    max: 3,
    pow0: { value: 0 },
    pow1: { value: 0, duration: 0.2, ease: 'power1.out', tween: null },
    pow2: { value: 0, duration: 1, ease: 'power1.out', tween: null },
  }
}

function getSpeed(power: ScrollPower, scale = 1, requestFrame?: () => void) {
  if (power.history.length > 2) {
    power.history.shift()
    power.history.push(power.delta2)
    power.pow0.value = Math.min(Math.abs((power.history[0] - power.history[2]) * scale), power.max) / power.max
    power.pow1.tween?.kill()
    power.pow1.tween = gsap.to(power.pow1, {
      duration: power.pow1.duration,
      ease: power.pow1.ease,
      value: power.pow0.value,
      onUpdate: requestFrame,
    })
    power.pow2.tween?.kill()
    power.pow2.tween = gsap.to(power.pow2, {
      duration: power.pow2.duration,
      ease: power.pow2.ease,
      value: power.pow0.value,
      onUpdate: requestFrame,
    })
  } else {
    power.history.push(power.delta2)
  }
}

function onScrollPowerComplete(power: ScrollPower, requestFrame?: () => void) {
  power.pow0.value = 0
  power.pow1.tween?.kill()
  power.pow1.tween = gsap.to(power.pow1, {
    duration: power.pow1.duration,
    value: 0,
    onUpdate: requestFrame,
  })
  power.pow2.tween?.kill()
  power.pow2.tween = gsap.to(power.pow2, {
    duration: power.pow2.duration,
    value: 0,
    onUpdate: requestFrame,
  })
}

function getWindowSpan() {
  return getViewportSize().w
}

function minContentWidth() {
  return getWindowSpan() * GALLERY_CONTENT_MIN_VW
}

function isWideAspect() {
  const { w, h } = getViewportSize()
  return isGalleryWideAspect(w, h)
}

function sectionTotalWidth() {
  const doc = getGalleryLayoutDocument()
  if (!doc) return getWindowSpan()
  return doc.sections.length * getGallerySectionWidth()
}

function appendCloneRound() {
  const doc = getGalleryLayoutDocument()
  if (!doc?.sections.some((s) => !s.isClone)) return false
  return appendGalleryLayoutCloneRound()
}

function ensureContentWideEnough() {
  const target = minContentWidth()
  let guard = 0
  while (sectionTotalWidth() <= target && guard < 24) {
    if (!appendCloneRound()) break
    guard++
  }
  return guard > 0
}

function cloneSectionsUntilWideEnough() {
  clearGalleryLayoutClones()
  ensureContentWideEnough()
}

export function createJsScroll({
  wrap,
  scrollbar,
  speed = 80,
  ease = 0.125,
  onCategoryChange,
  onUpdateAfter,
  onResizeAfter,
}: JsScrollOptions): JsScroll {
  const power = createScrollPower()
  let delta1 = 0
  let scrollX = 0
  let scrollLeft = 0
  let ready = false
  let inputEnabled = true
  let currentCategory = 'interior'
  let scrollToTween: gsap.core.Tween | null = null
  let scrollToProxy: { value: number } | null = null
  let introScrollBlend = false
  let inputBoostUntil = 0
  const sections: SectionEntry[] = []
  let requestFrame: (() => void) | null = null

  const emitFrameRequest = () => requestFrame?.()

  let lastWideAspect = isWideAspect()

  const syncSectionsFromLayout = () => {
    const doc = getGalleryLayoutDocument()
    sections.length = 0
    if (!doc) return

    for (const spec of doc.sections) {
      sections.push({
        index: spec.index,
        category: normalizeCategoryId(spec.category),
        isClone: spec.isClone,
        left: 0,
        width: 0,
        x: 0,
        cx: 0,
        progress: 0,
        selected: false,
        visible: true,
      })
    }
  }

  const measure = () => {
    recomputeGalleryMetrics()
    const sectionWidth = getGallerySectionWidth()
    let left = 0

    for (const entry of sections) {
      entry.width = sectionWidth
      entry.left = left
      left += sectionWidth
    }

    ready = sections.length > 0
  }

  const contentWidth = () => {
    let total = 0
    for (const entry of sections) total += entry.width
    return total || sectionTotalWidth()
  }

  const layoutInit = () => {
    cloneSectionsUntilWideEnough()
    syncSectionsFromLayout()
    measure()
    let guard = 0
    while (contentWidth() <= minContentWidth() && guard < 24) {
      appendCloneRound()
      syncSectionsFromLayout()
      measure()
      guard++
    }
  }

  layoutInit()

  const getThreshold = () => {
    const w = getWindowSpan()
    const overscan = w * GALLERY_MESH_OVERSCAN_VW
    return w < 768 ? w * 0.5 + overscan : w / 2 + overscan
  }

  let completeTimer: ReturnType<typeof window.setTimeout> | null = null
  let resizeRafId = 0
  const completeWait = 30

  const clearScrollTimers = () => {
    if (completeTimer !== null) {
      window.clearTimeout(completeTimer)
      completeTimer = null
    }
  }

  const scheduleScrollComplete = () => {
    clearScrollTimers()
    completeTimer = window.setTimeout(() => {
      onScrollPowerComplete(power, emitFrameRequest)
    }, completeWait)
  }

  const markInputBoost = () => {
    inputBoostUntil = performance.now() + 150
  }

  const getScrollEase = () => {
    if (introScrollBlend && performance.now() < inputBoostUntil) return 0.5
    if (introScrollBlend) return 0.28
    return ease
  }

  const absorbScrollToTween = () => {
    if (scrollToProxy) {
      delta1 = scrollToProxy.value
    }
    scrollToTween?.kill()
    scrollToTween = null
    scrollToProxy = null
    scrollX = delta1
  }

  const interruptAutoScroll = () => {
    absorbScrollToTween()
  }

  const applyScrollImpulse = (detail: number) => {
    power.delta1 += Math.abs(detail)
    power.delta2 += Math.abs(detail)
    getSpeed(power, 1, emitFrameRequest)
    scheduleScrollComplete()
    emitFrameRequest()
  }

  const onWheel = (event: WheelEvent) => {
    if (!inputEnabled) {
      event.preventDefault()
      return
    }
    event.preventDefault()
    if (scrollToTween) interruptAutoScroll()
    clearScrollTimers()
    const detail = getWheelDetail(event)
    delta1 += -detail * speed
    applyScrollImpulse(detail)
    markInputBoost()
    emitFrameRequest()
  }

  let dragging = false
  let dragStartX = 0
  let dragStartDelta = 0

  const onPointerDown = (event: PointerEvent) => {
    if (!inputEnabled) return
    if ((event.target as Element).closest('a, button, input, label')) return
    dragging = true
    dragStartX = event.clientX
    dragStartDelta = delta1
    wrap.setPointerCapture(event.pointerId)
    power.pow0.value = 0
    if (scrollToTween) interruptAutoScroll()
    clearScrollTimers()
    markInputBoost()
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    const nextDelta = dragStartDelta - (event.clientX - dragStartX) * 1.8
    const dragDetail = Math.abs(nextDelta - delta1) / speed
    delta1 = nextDelta
    if (dragDetail > 0) applyScrollImpulse(dragDetail)
    markInputBoost()
    emitFrameRequest()
  }

  const onPointerUp = () => {
    dragging = false
    scheduleScrollComplete()
    emitFrameRequest()
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  wrap.addEventListener('pointerdown', onPointerDown)
  wrap.addEventListener('pointermove', onPointerMove)
  wrap.addEventListener('pointerup', onPointerUp)
  wrap.addEventListener('pointercancel', onPointerUp)

  const raf = () => {
    if (!ready) return

    scrollX += (delta1 - scrollX) * getScrollEase()
    if (Math.abs(scrollX) < 1e-3) scrollX = 0

    const cw = contentWidth()
    scrollLeft = cw > 0 ? scrollX % cw : 0

    const position = cw > 0 ? scrollLeft / cw : 0
    const threshold = getThreshold()
    const viewportW = getWindowSpan()
    let activeSet = false

    for (const entry of sections) {
      entry.x = -scrollLeft
      if (entry.x < -entry.width - entry.left - threshold) {
        entry.x += cw
      }
      if (entry.left + entry.x - viewportW > threshold) {
        entry.x -= cw
      }

      const iLeft = entry.left + entry.x
      const iRight = iLeft + entry.width
      const inView = iRight > -threshold && iLeft - entry.width < viewportW + threshold

      entry.cx = clamp((iLeft + viewportW / 2) / viewportW - 0.5, -1, 1)

      if (Math.abs(entry.cx) < 0.5 && !activeSet) {
        entry.selected = true
        activeSet = true
        if (entry.category !== currentCategory) {
          currentCategory = entry.category
          onCategoryChange?.(entry.category)
        }
      } else {
        entry.selected = false
      }

      if (inView) {
        entry.progress = Math.abs(iLeft / viewportW) < 1e-3 ? 0 : roundToNearest(iLeft / viewportW)
        entry.visible = true
      } else {
        entry.visible = false
      }
    }

    if (scrollbar) {
      const trackWidth = getWindowSpan()
      const progressPx = position * trackWidth
      scrollbar.thumbBefore.style.transform = `translate3d(${progressPx - trackWidth}px, 0, 0)`
      scrollbar.thumbAfter.style.transform = `translate3d(${progressPx}px, 0, 0)`
    }

    syncGalleryLayoutScroll(
      sections.map((entry) => ({
        index: entry.index,
        left: entry.left,
        scrollX: entry.x,
      })),
      power.pow1.value ?? 0,
    )

    onUpdateAfter?.()
  }

  const remeasure = () => {
    syncViewport()

    const nowWide = isWideAspect()
    if (nowWide !== lastWideAspect) {
      cloneSectionsUntilWideEnough()
      lastWideAspect = nowWide
    } else {
      ensureContentWideEnough()
    }
    syncSectionsFromLayout()
    measure()

    let guard = 0
    while (contentWidth() <= minContentWidth() && guard < 24) {
      appendCloneRound()
      syncSectionsFromLayout()
      measure()
      guard++
    }

    scrollX = delta1
    raf()
    onResizeAfter?.()
    requestAnimationFrame(() => {
      scrollX = delta1
      raf()
      onResizeAfter?.()
    })
  }

  const scheduleRemeasure = () => {
    syncViewport()
    if (resizeRafId !== 0) return
    resizeRafId = requestAnimationFrame(() => {
      resizeRafId = 0
      remeasure()
    })
  }

  const onResize = () => scheduleRemeasure()
  window.addEventListener('resize', onResize)

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleRemeasure()) : null
  resizeObserver?.observe(wrap)

  const onScrollTo = (target: number, duration = 2, delay = 0, easeName = 'power2.out') => {
    scrollToTween?.kill()
    scrollToProxy = { value: delta1 }
    scrollToTween = gsap.to(scrollToProxy, {
      value: target,
      duration,
      delay,
      ease: easeName,
      onUpdate: () => {
        delta1 = scrollToProxy!.value
        emitFrameRequest()
      },
      onComplete: () => {
        scrollToProxy = null
        scrollToTween = null
      },
    })
    emitFrameRequest()
  }

  const jumpToCategory = (category: string) => {
    const id = normalizeCategoryId(category)
    const entry = sections.find((s) => !s.isClone && s.category === id)
    if (!entry) return
    const viewportW = getWindowSpan()
    onScrollTo(entry.left - (viewportW - entry.width) / 2, 2)
  }

  const destroy = () => {
    clearScrollTimers()
    if (resizeRafId !== 0) {
      cancelAnimationFrame(resizeRafId)
      resizeRafId = 0
    }
    resizeObserver?.disconnect()
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('resize', onResize)
    wrap.removeEventListener('pointerdown', onPointerDown)
    wrap.removeEventListener('pointermove', onPointerMove)
    wrap.removeEventListener('pointerup', onPointerUp)
    wrap.removeEventListener('pointercancel', onPointerUp)
    power.pow1.tween?.kill()
    power.pow2.tween?.kill()
    scrollToTween?.kill()
    scrollToProxy = null
  }

  const setInputEnabled = (enabled: boolean) => {
    inputEnabled = enabled
    if (!enabled) {
      dragging = false
      interruptAutoScroll()
    }
  }

  const setIntroScrollBlend = (active: boolean) => {
    introScrollBlend = active
    if (!active) inputBoostUntil = 0
  }

  const isAnimating = () => {
    const eps = 0.001
    if (dragging) return true
    if (scrollToTween?.isActive()) return true
    if (power.pow1.tween?.isActive() || power.pow2.tween?.isActive()) return true
    if (Math.abs(power.pow1.value) > eps || Math.abs(power.pow2.value) > eps) return true
    if (Math.abs(power.pow0.value) > eps) return true
    return false
  }

  const setRequestFrame = (fn: (() => void) | null) => {
    requestFrame = fn
  }

  return {
    power,
    get delta1() {
      return delta1
    },
    get currentCategory() {
      return currentCategory
    },
    raf,
    isAnimating,
    setRequestFrame,
    onScrollTo,
    jumpToCategory,
    remeasure,
    setInputEnabled,
    setIntroScrollBlend,
    destroy,
  }
}
