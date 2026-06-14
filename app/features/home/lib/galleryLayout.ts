import type { CateImage, CateKey } from '~/data/gallery'
import { getViewportSize, VIEWPORT_SSR_DEFAULT } from '~/features/home/lib/viewport'

/** photoyoshi `max-aspect-ratio` / jsScroll `isWideAspect` threshold (~1.35). */
export const GALLERY_WIDE_ASPECT = 3039929748475085 / 2251799813685248

const GRID_VW_NARROW = 1.6667
const GRID_VW_MOBILE = 4.97512437811
const MOBILE_MAX_WIDTH = 680
const CELLS_PER_COLUMN = 5
/** Vertical gap between stacked cells (photoyoshi flex `row-gap`; tuned above default). */
const ROW_GAP_GRID_MULT = 2
/** Extra viewport width of scroll content beyond minimum loop length. */
export const GALLERY_CONTENT_MIN_VW = 2.5
/** Mesh visibility padding beyond viewport edges (per side, in viewport widths). */
export const GALLERY_MESH_OVERSCAN_VW = 1
/** Mobile column width (photoyoshi `.gl-inner` width). */
const MOBILE_COL_WIDTH_VW = 19.9004975124
const MOBILE_COL_MARGIN_VW = 2.4875621891

export type GalleryViewport = {
  w: number
  h: number
}

export type GalleryGridMetrics = {
  grid: number
  cell: number
  columnStride: number
  columnMargin: number
  rowGap: number
  cellStride: number
  sectionWidth: number
  /** `.c-content { margin-right: calc(var(--grid) * 4) }` */
  contentMarginRight: number
  columnTop: number
  columnInnerHeight: number
  /** Vertical offset to center the 5-cell stack inside the column. */
  columnStackOffset: number
  /** 90° CCW: horizontal centering offset for the rotated 5-cell stack. */
  rowStackOffset: number
  wrapTop: number
  useLargeCells: boolean
  mobile: boolean
}

export type GalleryFrameSpec = {
  id: string
  sectionIndex: number
  category: CateKey
  col: number
  row: number
  image: CateImage
  src: string
  jsSrc: string
  isClone: boolean
}

export type GallerySectionSpec = {
  index: number
  category: CateKey
  isClone: boolean
  frames: GalleryFrameSpec[]
}

export type GalleryLayoutDocument = {
  sections: GallerySectionSpec[]
}

export type GalleryFrameRect = {
  left: number
  top: number
  width: number
  height: number
}

export type GalleryWorldRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Desktop-ish default for SSR / module init (no window). */
export const GALLERY_SSR_VIEWPORT: GalleryViewport = VIEWPORT_SSR_DEFAULT

export function getViewport(): GalleryViewport {
  if (typeof window === 'undefined') {
    return GALLERY_SSR_VIEWPORT
  }
  return getViewportSize()
}

export function isGalleryWideAspect(w: number, h: number) {
  return w / h > GALLERY_WIDE_ASPECT
}

/** Parse `--grid: 1.6667vw` / `32px` from photoyoshi CSS variables. */
export function parseCssGridLength(raw: string, viewport: GalleryViewport = getViewport()): number | null {
  const value = raw.trim()
  if (!value) return null

  if (value.endsWith('vw')) {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? (viewport.w * n) / 100 : null
  }
  if (value.endsWith('vh')) {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? (viewport.h * n) / 100 : null
  }
  if (value.endsWith('px')) {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const n = Number.parseFloat(value)
  // Unsuffixed tiny values are usually a mistaken vw parse (e.g. 1.6667 from 1.6667vw).
  if (Number.isFinite(n) && n > 8) return n
  return null
}

/** Mirrors photoyoshi `:root --grid` and mobile override. */
export function getGridUnit(viewport: GalleryViewport = getViewport()) {
  if (typeof window !== 'undefined') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim()
    const parsed = parseCssGridLength(raw, viewport)
    if (parsed !== null) return parsed
  }
  const { w } = viewport
  if (w < MOBILE_MAX_WIDTH) {
    return w * (GRID_VW_MOBILE / 100)
  }
  return w * (GRID_VW_NARROW / 100)
}

function getColumnStride(viewport: GalleryViewport, grid: number, useLargeCells: boolean) {
  const { w } = viewport
  if (w < MOBILE_MAX_WIDTH) {
    const colWidth = w * (MOBILE_COL_WIDTH_VW / 100)
    const margin = w * (MOBILE_COL_MARGIN_VW / 100)
    return colWidth + margin * 2
  }
  const cellMult = useLargeCells ? 6 : 4
  const marginMult = useLargeCells ? 0.75 : 1.75
  return grid * cellMult + grid * marginMult * 2
}

/** Column block top offset (photoyoshi `.gl-inner { top }`). */
export function getColumnInnerTopMult(mobile: boolean) {
  return mobile ? 1.55 : 1.25
}

/** Column block height — `100vh - 4g` or `100vh - 7.5g` (mobile / large cells). */
export function getColumnInnerHeight(viewport: GalleryViewport, grid: number, useLargeCells: boolean) {
  const { w, h } = viewport
  if (w < MOBILE_MAX_WIDTH) {
    return h - grid * 7.5
  }
  if (useLargeCells) {
    return h - grid * 7.5
  }
  return h - grid * 4
}

export function getGalleryGridMetrics(viewport: GalleryViewport = getViewport()): GalleryGridMetrics {
  const { w, h } = viewport
  const grid = getGridUnit(viewport)
  const mobile = w < MOBILE_MAX_WIDTH
  const useLargeCells = !mobile && !isGalleryWideAspect(w, h)
  const cellMult = useLargeCells ? 6 : 4
  const marginMult = useLargeCells ? 0.75 : 1.75
  const cell = grid * cellMult
  const columnStride = getColumnStride(viewport, grid, useLargeCells)
  const sectionWidth = columnStride * 2
  const columnMargin = mobile ? w * (MOBILE_COL_MARGIN_VW / 100) : grid * marginMult
  const wrapTop = grid * -0.5
  const columnTop = wrapTop + grid * getColumnInnerTopMult(mobile)
  const rowGap = grid * ROW_GAP_GRID_MULT
  const cellStride = cell + rowGap
  const columnInnerHeight = getColumnInnerHeight(viewport, grid, useLargeCells)
  const stackHeight = cell * CELLS_PER_COLUMN + rowGap * (CELLS_PER_COLUMN - 1)
  // Center the 5-row stack in the viewport (photoyoshi `align-content: center`).
  const stackTop = Math.max(0, (h - stackHeight) / 2)
  const columnStackOffset = stackTop - columnTop
  // 90° CCW: center the same 5-cell stack along the horizontal axis (viewport width).
  const rowStackLeft = Math.max(0, (w - stackHeight) / 2)
  const rowStackOffset = rowStackLeft - columnTop

  return {
    grid,
    cell,
    columnStride,
    columnMargin,
    rowGap,
    cellStride,
    sectionWidth,
    contentMarginRight: grid * 4,
    columnTop,
    columnInnerHeight,
    columnStackOffset,
    rowStackOffset,
    wrapTop,
    useLargeCells,
    mobile,
  }
}

export function getImageAspect(img: { width: number; height: number }) {
  if (img.width > 0 && img.height > 0) return img.width / img.height
  return 1
}

/** Frame inner size inside a square cell. */
export function frameSizeInCell(cell: number, aspect: number) {
  const landscape = aspect >= 1
  return {
    width: landscape ? cell : cell * 0.65,
    height: landscape ? cell * 0.65 : cell,
  }
}

const PARALLAX_ROW_MULT: Record<number, number> = {
  0: 2,
  1: 1,
  3: -1,
  4: -2,
}

export function getCellParallaxOffset(row: number, scrollPow: number, grid: number) {
  const mult = PARALLAX_ROW_MULT[row]
  if (mult === undefined) return 0
  return scrollPow * grid * mult
}

/**
 * Splash gather X — photoyoshi `-(top + clientHeight)` rotated 90° CCW onto the horizontal axis.
 */
/** Splash hero frame size before reveal — 90° CCW from photoyoshi 187% × 20vw (tall banner). */
export function splashHeroFrameSize(metrics: GalleryGridMetrics, viewport: GalleryViewport = getViewport()) {
  return {
    width: viewport.w * 0.2,
    height: metrics.cell * 1.87,
  }
}

export function splashGatherOffsetX(
  spec: GalleryFrameSpec,
  metrics: GalleryGridMetrics,
  viewport: GalleryViewport = getViewport(),
): number {
  if (spec.row === 2) return 0

  const { cell, columnTop, rowStackOffset, cellStride } = metrics
  // `row` now maps to the horizontal axis (90° CCW); push frames off-screen left/right.
  const rowAxis = columnTop + rowStackOffset + spec.row * cellStride
  const { w: vw } = viewport

  if (spec.row === 0 || spec.row === 1) {
    return -1 * (rowAxis + cell)
  }
  if (spec.row === 3 || spec.row === 4) {
    return -1 * (rowAxis + cell - vw - cell)
  }
  return 0
}

export type SplashFramePose = {
  x: number
  width: number
  height: number
}

export function frameRectInSectionForSplash(
  spec: Pick<GalleryFrameSpec, 'col' | 'row'>,
  metrics: GalleryGridMetrics,
  pose: SplashFramePose,
  scrollPow = 0,
): GalleryFrameRect {
  const { col, row } = spec
  const { grid, cell, columnStride, columnMargin, columnTop, rowStackOffset, cellStride } = metrics
  // 90° CCW: row drives the horizontal axis, col drives the vertical axis.
  const rowAxis = columnTop + rowStackOffset + row * cellStride + getCellParallaxOffset(row, scrollPow, grid)
  const colAxis = col * columnStride + columnMargin

  return {
    left: rowAxis + (cell - pose.width) / 2,
    top: colAxis + (cell - pose.height) / 2,
    width: pose.width,
    height: pose.height,
  }
}

export function frameRectInSectionForImage(
  spec: Pick<GalleryFrameSpec, 'col' | 'row' | 'image'>,
  metrics: GalleryGridMetrics,
  scrollPow = 0,
): GalleryFrameRect {
  const { col, row, image } = spec
  const { grid, cell, columnStride, columnMargin, columnTop, rowStackOffset, cellStride } = metrics
  const aspect = getImageAspect(image)
  // 90° CCW: row drives the horizontal axis, col drives the vertical axis.
  const rowAxis = columnTop + rowStackOffset + row * cellStride + getCellParallaxOffset(row, scrollPow, grid)
  const colAxis = col * columnStride + columnMargin
  const frame = frameSizeInCell(cell, aspect)

  return {
    left: rowAxis + (cell - frame.width) / 2,
    top: colAxis + (cell - frame.height) / 2,
    width: frame.width,
    height: frame.height,
  }
}

export function screenRectToWorld(rect: GalleryFrameRect, viewport: GalleryViewport = getViewport()): GalleryWorldRect {
  const { w: vw, h: vh } = viewport
  return {
    x: rect.left + rect.width / 2 - vw / 2,
    y: vh / 2 - rect.top - rect.height / 2,
    width: Math.max(rect.width, 1),
    height: Math.max(rect.height, 1),
  }
}

export function frameScreenRect(
  spec: GalleryFrameSpec,
  sectionTop: number,
  sectionScrollOffset: number,
  metrics: GalleryGridMetrics,
  scrollPow = 0,
  viewport: GalleryViewport = getViewport(),
): GalleryFrameRect {
  const local = frameRectInSectionForImage(spec, metrics, scrollPow)
  return {
    left: local.left,
    top: sectionTop + sectionScrollOffset + local.top,
    width: local.width,
    height: local.height,
  }
}

export function frameWorldRect(
  spec: GalleryFrameSpec,
  sectionTop: number,
  sectionScrollOffset: number,
  metrics: GalleryGridMetrics,
  scrollPow = 0,
  viewport: GalleryViewport = getViewport(),
): GalleryWorldRect {
  return screenRectToWorld(
    frameScreenRect(spec, sectionTop, sectionScrollOffset, metrics, scrollPow, viewport),
    viewport,
  )
}

export function frameWorldRectForSplash(
  spec: GalleryFrameSpec,
  sectionTop: number,
  sectionScrollOffset: number,
  metrics: GalleryGridMetrics,
  pose: SplashFramePose,
  scrollPow = 0,
  viewport: GalleryViewport = getViewport(),
): GalleryWorldRect {
  const local = frameRectInSectionForSplash(spec, metrics, pose, scrollPow)
  const screen: GalleryFrameRect = {
    left: local.left + pose.x,
    top: sectionTop + sectionScrollOffset + local.top,
    width: local.width,
    height: local.height,
  }
  return screenRectToWorld(screen, viewport)
}

export function computeSectionTops(sections: GallerySectionSpec[], metrics: GalleryGridMetrics) {
  const tops: number[] = []
  let y = 0
  for (const section of sections) {
    tops[section.index] = y
    y += metrics.sectionWidth
  }
  return tops
}

export function appendCloneRoundToLayout(doc: GalleryLayoutDocument): GalleryLayoutDocument | null {
  const originals = doc.sections.filter((s) => !s.isClone)
  if (originals.length === 0) return null

  const startIndex = doc.sections.length
  const clones: GallerySectionSpec[] = originals.map((section, i) => {
    const index = startIndex + i
    return {
      index,
      category: section.category,
      isClone: true,
      frames: section.frames.map((frame) => ({
        ...frame,
        id: `${frame.id}-clone-${index}`,
        sectionIndex: index,
        isClone: true,
      })),
    }
  })

  return { sections: [...doc.sections, ...clones] }
}

export function getMeshOverscanPx(viewport: GalleryViewport = getViewport()) {
  return viewport.w * GALLERY_MESH_OVERSCAN_VW
}

export function isFrameVisible(rect: GalleryFrameRect, viewport: GalleryViewport = getViewport()) {
  const { w: vw, h: vh } = viewport
  // Vertical scroll axis → generous vertical overscan, modest horizontal padding.
  const padX = vw * 0.35
  const padY = vh * GALLERY_MESH_OVERSCAN_VW
  return (
    rect.height > 2 &&
    rect.width > 2 &&
    rect.left + rect.width > -padX &&
    rect.left < vw + padX &&
    rect.top + rect.height > -padY &&
    rect.top < vh + padY
  )
}
