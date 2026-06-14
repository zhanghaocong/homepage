import {
  appendCloneRoundToLayout,
  computeSectionTops,
  frameScreenRect,
  frameWorldRect,
  frameWorldRectForSplash,
  getGalleryGridMetrics,
  getViewport,
  splashHeroFrameSize,
  type GalleryFrameRect,
  type GalleryFrameSpec,
  type GalleryGridMetrics,
  type GalleryLayoutDocument,
  type GallerySectionSpec,
  type GalleryWorldRect,
} from '~/features/home/lib/galleryLayout'
import { endSplashGather, getSplashFrameTween, isSplashGatherActive } from '~/features/home/lib/splashGatherState'

export type SectionScrollState = {
  index: number
  top: number
  scrollOffset: number
}

let layoutDoc: GalleryLayoutDocument | null = null
let metrics: GalleryGridMetrics | null = null
let sectionTops: number[] = []
const sectionScroll = new Map<number, number>()
let scrollPow = 0

function ensureMetrics(): GalleryGridMetrics {
  if (!metrics) metrics = getGalleryGridMetrics()
  return metrics
}

export function getGalleryLayoutDocument() {
  return layoutDoc
}

export function setGalleryLayoutDocument(doc: GalleryLayoutDocument | null) {
  layoutDoc = doc
  if (!doc) {
    sectionTops = []
    sectionScroll.clear()
    return
  }
  recomputeMetrics()
}

export function recomputeGalleryMetrics() {
  recomputeMetrics()
}

function recomputeMetrics() {
  metrics = getGalleryGridMetrics()
  if (!layoutDoc) {
    sectionTops = []
    return
  }
  sectionTops = computeSectionTops(layoutDoc.sections, metrics)
}

export function getGalleryMetrics() {
  return ensureMetrics()
}

export function getGallerySectionWidth() {
  return ensureMetrics().sectionWidth
}

/** Vertical span per section — equals section width (scroll axis rotated 90° CCW). */
export function getGallerySectionHeight() {
  return ensureMetrics().sectionWidth
}

export function syncGalleryLayoutScroll(entries: SectionScrollState[], power = 0) {
  scrollPow = power
  sectionScroll.clear()
  for (const entry of entries) {
    sectionScroll.set(entry.index, entry.scrollOffset)
    if (entry.top !== sectionTops[entry.index]) {
      sectionTops[entry.index] = entry.top
    }
  }
}

export function appendGalleryLayoutCloneRound(): boolean {
  if (!layoutDoc) return false
  const next = appendCloneRoundToLayout(layoutDoc)
  if (!next) return false
  layoutDoc = next
  recomputeMetrics()
  return true
}

export function clearGalleryLayoutClones() {
  if (!layoutDoc) return
  layoutDoc = {
    sections: layoutDoc.sections.filter((s) => !s.isClone),
  }
  recomputeMetrics()
}

export function getFrameSpecById(id: string): GalleryFrameSpec | null {
  if (!layoutDoc) return null
  for (const section of layoutDoc.sections) {
    const frame = section.frames.find((f) => f.id === id)
    if (frame) return frame
  }
  return null
}

/** Center (splash hero) row in the same column as `frameId`. */
export function getColumnCenterFrameSpec(frameId: string): GalleryFrameSpec | null {
  const spec = getFrameSpecById(frameId)
  if (!spec || !layoutDoc) return spec
  const centerRow = ensureMetrics().centerRow
  if (spec.row === centerRow) return spec
  for (const section of layoutDoc.sections) {
    if (section.index !== spec.sectionIndex) continue
    const center = section.frames.find((f) => f.col === spec.col && f.row === centerRow)
    if (center) return center
  }
  return spec
}

/** Splash gather hero pose in world space (photoyoshi handoff target on photo-view close). */
export function getFrameSplashHandoffWorldRect(frameId: string): GalleryWorldRect | null {
  const center = getColumnCenterFrameSpec(frameId)
  if (!center) return null
  const metrics = ensureMetrics()
  const hero = splashHeroFrameSize(metrics)
  return frameWorldRectForSplash(
    center,
    sectionTop(center.sectionIndex),
    sectionScrollOffset(center.sectionIndex),
    metrics,
    { x: 0, width: hero.width, height: hero.height },
    scrollPow,
  )
}

function sectionScrollOffset(sectionIndex: number) {
  return sectionScroll.get(sectionIndex) ?? 0
}

function sectionTop(sectionIndex: number) {
  return sectionTops[sectionIndex] ?? 0
}

export function getFrameScreenRect(frameId: string): GalleryFrameRect | null {
  const spec = getFrameSpecById(frameId)
  if (!spec || !layoutDoc) return null
  return frameScreenRect(
    spec,
    sectionTop(spec.sectionIndex),
    sectionScrollOffset(spec.sectionIndex),
    ensureMetrics(),
    scrollPow,
  )
}

export function getFrameWorldRect(frameId: string): GalleryWorldRect | null {
  const spec = getFrameSpecById(frameId)
  if (!spec || !layoutDoc) return null

  const splash = getSplashFrameTween(frameId)
  if (isSplashGatherActive() && splash) {
    return frameWorldRectForSplash(
      spec,
      sectionTop(spec.sectionIndex),
      sectionScrollOffset(spec.sectionIndex),
      ensureMetrics(),
      splash,
      scrollPow,
    )
  }

  return frameWorldRect(
    spec,
    sectionTop(spec.sectionIndex),
    sectionScrollOffset(spec.sectionIndex),
    ensureMetrics(),
    scrollPow,
  )
}

export function getFrameWorldRectForSpec(spec: GalleryFrameSpec): GalleryWorldRect {
  return frameWorldRect(
    spec,
    sectionTop(spec.sectionIndex),
    sectionScrollOffset(spec.sectionIndex),
    ensureMetrics(),
    scrollPow,
    getViewport(),
  )
}

export function listAllFrameSpecs(): GalleryFrameSpec[] {
  if (!layoutDoc) return []
  return layoutDoc.sections.flatMap((s) => s.frames)
}

export function listOriginalFrameSpecs(): GalleryFrameSpec[] {
  if (!layoutDoc) return []
  return layoutDoc.sections.filter((s) => !s.isClone).flatMap((s) => s.frames)
}

export function resetGalleryLayoutStore() {
  endSplashGather()
  layoutDoc = null
  sectionTops = []
  sectionScroll.clear()
  scrollPow = 0
  metrics = null
}

export type { GalleryLayoutDocument, GallerySectionSpec }
