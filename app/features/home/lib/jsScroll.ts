import gsap from 'gsap'
import { DragGesture, WheelGesture } from '@use-gesture/vanilla'
import { rebuildGalleryLayoutIfCellsChanged } from '~/features/home/lib/buildGalleryLayout'
import { GALLERY_CONTENT_MIN_VW, GALLERY_MESH_OVERSCAN_VW, isGalleryWideAspect } from '~/features/home/lib/galleryLayout'
import {
  appendGalleryLayoutCloneRound,
  clearGalleryLayoutClones,
  getGalleryLayoutDocument,
  getGallerySectionHeight,
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
  top: number
  height: number
  y: number
  cy: number
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
  /** Tap (press with negligible movement) at viewport coords — used to open a photo. */
  onTap?: (clientX: number, clientY: number) => void
}

/** Finger/pointer drag → content travel multiplier (drag feels 1:N). */
const DRAG_SPEED = 2.2
/** Fling: content px injected into the target per (px/ms) of release velocity (post-multiplier). */
const FLING_DISTANCE = 260
/** Cap one fling so a hard swipe can't overshoot wildly. */
const FLING_MAX_DISTANCE = 5200
/** Release speed (px/ms, post-multiplier) below which we don't fling. */
const FLING_MIN_VELOCITY = 0.08
/** A press that moves less than this (px) counts as a tap (open photo), not a drag. */
const TAP_THRESHOLD_PX = 8

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
  return getViewportSize().h
}

function minContentHeight() {
  return getWindowSpan() * GALLERY_CONTENT_MIN_VW
}

function isWideAspect() {
  const { w, h } = getViewportSize()
  return isGalleryWideAspect(w, h)
}

function sectionTotalHeight() {
  const doc = getGalleryLayoutDocument()
  if (!doc) return getWindowSpan()
  return doc.sections.length * getGallerySectionHeight()
}

function appendCloneRound() {
  const doc = getGalleryLayoutDocument()
  if (!doc?.sections.some((s) => !s.isClone)) return false
  return appendGalleryLayoutCloneRound()
}

function ensureContentTallEnough() {
  const target = minContentHeight()
  let guard = 0
  while (sectionTotalHeight() <= target && guard < 24) {
    if (!appendCloneRound()) break
    guard++
  }
  return guard > 0
}

function cloneSectionsUntilTallEnough() {
  clearGalleryLayoutClones()
  ensureContentTallEnough()
}

export function createJsScroll({
  wrap,
  scrollbar,
  speed = 80,
  ease = 0.125,
  onCategoryChange,
  onUpdateAfter,
  onResizeAfter,
  onTap,
}: JsScrollOptions): JsScroll {
  const power = createScrollPower()
  let delta1 = 0
  let scrollX = 0
  let scrollTop = 0
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
        top: 0,
        height: 0,
        y: 0,
        cy: 0,
        progress: 0,
        selected: false,
        visible: true,
      })
    }
  }

  const measure = () => {
    recomputeGalleryMetrics()
    const sectionHeight = getGallerySectionHeight()
    let top = 0

    for (const entry of sections) {
      entry.height = sectionHeight
      entry.top = top
      top += sectionHeight
    }

    ready = sections.length > 0
  }

  const contentHeight = () => {
    let total = 0
    for (const entry of sections) total += entry.height
    return total || sectionTotalHeight()
  }

  const layoutInit = () => {
    cloneSectionsUntilTallEnough()
    syncSectionsFromLayout()
    measure()
    let guard = 0
    while (contentHeight() <= minContentHeight() && guard < 24) {
      appendCloneRound()
      syncSectionsFromLayout()
      measure()
      guard++
    }
  }

  layoutInit()

  const getThreshold = () => {
    const h = getWindowSpan()
    const overscan = h * GALLERY_MESH_OVERSCAN_VW
    return h < 768 ? h * 0.5 + overscan : h / 2 + overscan
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

  // One-shot displacement injected into the scroll target (a wheel notch or a
  // release fling). The shared raf lerp + power decay below carry the easing,
  // so every device eases and uncurls identically — no separate inertia tween.
  const injectImpulse = (deltaContentPx: number) => {
    if (scrollToTween) interruptAutoScroll()
    clearScrollTimers()
    delta1 += deltaContentPx
    applyScrollImpulse(deltaContentPx / speed)
    markInputBoost()
    emitFrameRequest()
  }

  let dragging = false
  let dragStartDelta = 0

  const wheelGesture = new WheelGesture(
    window,
    (state) => {
      const event = state.event as WheelEvent
      if (!inputEnabled) {
        event.preventDefault()
        return
      }
      event.preventDefault()
      injectImpulse(-getWheelDetail(event) * speed)
    },
    { eventOptions: { passive: false } },
  )

  const dragGesture = new DragGesture(
    wrap,
    (state) => {
      if (!inputEnabled) return
      if (state.canceled) {
        dragging = false
        return
      }

      const { first, last, movement, velocity, direction, tap, event } = state

      if (first) {
        const target = event.target as Element | null
        if (target?.closest('a, button, input, label')) {
          state.cancel()
          return
        }
        dragging = true
        dragStartDelta = delta1
        power.pow0.value = 0
        if (scrollToTween) interruptAutoScroll()
        clearScrollTimers()
        markInputBoost()
      }

      // Negligible-movement press → tap (open photo), never a scroll.
      if (last && tap) {
        dragging = false
        onTap?.((event as PointerEvent).clientX, (event as PointerEvent).clientY)
        scheduleScrollComplete()
        emitFrameRequest()
        return
      }

      // Follow the finger 1:1 while dragging.
      const nextDelta = dragStartDelta + movement[1] * DRAG_SPEED
      const moved = nextDelta - delta1
      delta1 = nextDelta
      if (moved !== 0) applyScrollImpulse(Math.abs(moved) / speed)
      markInputBoost()
      emitFrameRequest()

      if (last) {
        dragging = false
        // Fling is a one-shot displacement; the SAME raf lerp + power decay as
        // wheel then eases it to rest, so release feels identical on every device.
        const v = velocity[1] * direction[1] * DRAG_SPEED
        if (Math.abs(v) >= FLING_MIN_VELOCITY) {
          const fling = clamp(v * FLING_DISTANCE, -FLING_MAX_DISTANCE, FLING_MAX_DISTANCE)
          delta1 += fling
          applyScrollImpulse(Math.abs(fling) / speed)
        }
        scheduleScrollComplete()
        emitFrameRequest()
      }
    },
    {
      filterTaps: true,
      tapsThreshold: TAP_THRESHOLD_PX,
      axis: 'y',
      eventOptions: { passive: false },
    },
  )

  const raf = () => {
    if (!ready) return

    scrollX += (delta1 - scrollX) * getScrollEase()
    if (Math.abs(scrollX) < 1e-3) scrollX = 0

    const ch = contentHeight()
    scrollTop = ch > 0 ? scrollX % ch : 0

    const position = ch > 0 ? scrollTop / ch : 0
    const threshold = getThreshold()
    const viewportH = getWindowSpan()
    let activeSet = false

    for (const entry of sections) {
      // `delta1` grows → sections move down → photos enter from the top, exit at the bottom.
      entry.y = scrollTop
      if (entry.top + entry.y - viewportH > threshold) {
        entry.y -= ch
      }
      if (entry.top + entry.y < -entry.height - threshold) {
        entry.y += ch
      }

      const iTop = entry.top + entry.y
      const iBottom = iTop + entry.height
      const inView = iBottom > -threshold && iTop - entry.height < viewportH + threshold

      entry.cy = clamp((iTop + viewportH / 2) / viewportH - 0.5, -1, 1)

      if (Math.abs(entry.cy) < 0.5 && !activeSet) {
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
        entry.progress = Math.abs(iTop / viewportH) < 1e-3 ? 0 : roundToNearest(iTop / viewportH)
        entry.visible = true
      } else {
        entry.visible = false
      }
    }

    if (scrollbar) {
      const trackHeight = getWindowSpan()
      const progressPx = position * trackHeight
      scrollbar.thumbBefore.style.transform = `translate3d(0, ${progressPx - trackHeight}px, 0)`
      scrollbar.thumbAfter.style.transform = `translate3d(0, ${progressPx}px, 0)`
    }

    syncGalleryLayoutScroll(
      sections.map((entry) => ({
        index: entry.index,
        top: entry.top,
        scrollOffset: entry.y,
      })),
      power.pow1.value ?? 0,
    )

    onUpdateAfter?.()
  }

  const remeasure = () => {
    syncViewport()

    const layoutRebuilt = rebuildGalleryLayoutIfCellsChanged()
    if (layoutRebuilt) {
      cloneSectionsUntilTallEnough()
      lastWideAspect = isWideAspect()
    } else {
      const nowWide = isWideAspect()
      if (nowWide !== lastWideAspect) {
        cloneSectionsUntilTallEnough()
        lastWideAspect = nowWide
      } else {
        ensureContentTallEnough()
      }
    }
    syncSectionsFromLayout()
    measure()

    let guard = 0
    while (contentHeight() <= minContentHeight() && guard < 24) {
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
    const viewportH = getWindowSpan()
    onScrollTo((viewportH - entry.height) / 2 - entry.top, 2)
  }

  const destroy = () => {
    clearScrollTimers()
    if (resizeRafId !== 0) {
      cancelAnimationFrame(resizeRafId)
      resizeRafId = 0
    }
    resizeObserver?.disconnect()
    window.removeEventListener('resize', onResize)
    wheelGesture.destroy()
    dragGesture.destroy()
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
    // Keep rendering while the lerp still chases the target (wheel coast / fling glide).
    if (Math.abs(delta1 - scrollX) > 0.5) return true
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
