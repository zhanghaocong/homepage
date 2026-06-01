import {
  appendCloneRoundToLayout,
  computeSectionLefts,
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
} from '~/lib/galleryLayout'
import { endSplashGather, getSplashFrameTween, isSplashGatherActive } from '~/lib/splashGatherState'

export type SectionScrollState = {
  index: number
  left: number
  scrollX: number
}

let layoutDoc: GalleryLayoutDocument | null = null
let metrics: GalleryGridMetrics | null = null
let sectionLefts: number[] = []
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
    sectionLefts = []
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
    sectionLefts = []
    return
  }
  sectionLefts = computeSectionLefts(layoutDoc.sections, metrics)
}

export function getGalleryMetrics() {
  return ensureMetrics()
}

export function getGallerySectionWidth() {
  return ensureMetrics().sectionWidth
}

export function syncGalleryLayoutScroll(entries: SectionScrollState[], power = 0) {
  scrollPow = power
  sectionScroll.clear()
  for (const entry of entries) {
    sectionScroll.set(entry.index, entry.scrollX)
    if (entry.left !== sectionLefts[entry.index]) {
      sectionLefts[entry.index] = entry.left
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

/** Row 2 (splash hero row) in the same column as `frameId`. */
export function getColumnCenterFrameSpec(frameId: string): GalleryFrameSpec | null {
  const spec = getFrameSpecById(frameId)
  if (!spec || !layoutDoc) return spec
  if (spec.row === 2) return spec
  for (const section of layoutDoc.sections) {
    if (section.index !== spec.sectionIndex) continue
    const center = section.frames.find((f) => f.col === spec.col && f.row === 2)
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
    sectionLeft(center.sectionIndex),
    sectionScrollX(center.sectionIndex),
    metrics,
    { y: 0, width: hero.width, height: hero.height },
    scrollPow,
  )
}

function sectionScrollX(sectionIndex: number) {
  return sectionScroll.get(sectionIndex) ?? 0
}

function sectionLeft(sectionIndex: number) {
  return sectionLefts[sectionIndex] ?? 0
}

export function getFrameScreenRect(frameId: string): GalleryFrameRect | null {
  const spec = getFrameSpecById(frameId)
  if (!spec || !layoutDoc) return null
  return frameScreenRect(
    spec,
    sectionLeft(spec.sectionIndex),
    sectionScrollX(spec.sectionIndex),
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
      sectionLeft(spec.sectionIndex),
      sectionScrollX(spec.sectionIndex),
      ensureMetrics(),
      splash,
      scrollPow,
    )
  }

  return frameWorldRect(
    spec,
    sectionLeft(spec.sectionIndex),
    sectionScrollX(spec.sectionIndex),
    ensureMetrics(),
    scrollPow,
  )
}

export function getFrameWorldRectForSpec(spec: GalleryFrameSpec): GalleryWorldRect {
  return frameWorldRect(
    spec,
    sectionLeft(spec.sectionIndex),
    sectionScrollX(spec.sectionIndex),
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
  sectionLefts = []
  sectionScroll.clear()
  scrollPow = 0
  metrics = null
}

export type { GalleryLayoutDocument, GallerySectionSpec }
