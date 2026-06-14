import type { CateImage, CateKey } from '~/data/gallery'
import { getViewportSize, VIEWPORT_SSR_DEFAULT } from '~/features/home/lib/viewport'

/** photoyoshi `max-aspect-ratio` / jsScroll `isWideAspect` threshold (~1.35). */
export const GALLERY_WIDE_ASPECT = 3039929748475085 / 2251799813685248

const GRID_VW_NARROW = 1.6667
const GRID_VW_MOBILE = 4.97512437811
const MOBILE_MAX_WIDTH = 680
const CELLS_MINI = 3
const CELLS_NORMAL = 5
const CELLS_MAX = 7
/** Ultra-wide (cinematic) aspect threshold for the 7-up row (≈ 2:1; captures 21:9 / 32:9, excludes 16:9). */
const ULTRAWIDE_ASPECT = 2.0
/** Stacked rows per section on the vertical axis (the horizontal count is responsive). */
const SECTION_ROWS = 2
/** Fraction of viewport width the horizontal row of cells should fill. */
const ROW_FILL_DESKTOP = 0.9
const ROW_FILL_MOBILE = 0.94
/** Inter-cell gap as a fraction of cell size. */
const CELL_GAP_RATIO = 0.16
/** Vertical gap between stacked cells (photoyoshi flex `row-gap`; tuned above default). */
const ROW_GAP_GRID_MULT = 2
/** Min loop length of scroll content (× viewport span); keep ≥ viewport + 2×wrap threshold to avoid edge gaps on fast scroll. */
export const GALLERY_CONTENT_MIN_VW = 5.5
/** Mesh visibility overscan beyond viewport edges (per side, × viewport span on the scroll axis). */
export const GALLERY_MESH_OVERSCAN_VW = 1.5
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
  /** Vertical offset to center the cell stack (unused in 90° CCW horizontal row layout). */
  columnStackOffset: number
  /** 90° CCW: horizontal centering offset for the rotated cell row. */
  rowStackOffset: number
  /** Responsive photos-per-row (3 / 5 / 7). */
  cellsPerColumn: number
  /** Center (hero) row index. */
  centerRow: number
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

/**
 * Photos across one horizontal row of the vertical marquee — responsive to viewport.
 * Mini (phones) 3 · Normal (wide screens) 5 · Max (ultra-wide / cinematic) 7.
 */
export function getCellsPerColumn(viewport: GalleryViewport = getViewport()): number {
  const { w, h } = viewport
  if (w < MOBILE_MAX_WIDTH) return CELLS_MINI
  if (w / h >= ULTRAWIDE_ASPECT) return CELLS_MAX
  return CELLS_NORMAL
}

/** Center (hero) row index of an N-cell row. */
export function getColumnCenterRow(cells: number): number {
  return Math.floor(cells / 2)
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
  const cellsPerColumn = getCellsPerColumn(viewport)
  const centerRow = getColumnCenterRow(cellsPerColumn)

  // Horizontal axis: pack `cellsPerColumn` square cells + gaps to fill viewport width.
  const fill = mobile ? ROW_FILL_MOBILE : ROW_FILL_DESKTOP
  const cell = (w * fill) / (cellsPerColumn + (cellsPerColumn - 1) * CELL_GAP_RATIO)
  const rowGap = cell * CELL_GAP_RATIO
  const cellStride = cell + rowGap

  // Vertical axis: square grid — identical stride; sections stack SECTION_ROWS rows seamlessly.
  const columnStride = cellStride
  const sectionWidth = columnStride * SECTION_ROWS
  const columnMargin = rowGap / 2
  const wrapTop = grid * -0.5
  const columnTop = 0
  const columnInnerHeight = getColumnInnerHeight(viewport, grid, useLargeCells)

  // 90° CCW: center the cell row along the horizontal axis (viewport width).
  const stackHeight = cell * cellsPerColumn + rowGap * (cellsPerColumn - 1)
  const rowStackLeft = Math.max(0, (w - stackHeight) / 2)
  const rowStackOffset = rowStackLeft - columnTop
  const columnStackOffset = 0

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
    cellsPerColumn,
    centerRow,
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

export function getCellParallaxOffset(row: number, centerRow: number, scrollPow: number, grid: number) {
  // Rows fan out from the hero center; the offset grows linearly toward the edges.
  const mult = centerRow - row
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
  const { cell, columnTop, rowStackOffset, cellStride, centerRow } = metrics
  if (spec.row === centerRow) return 0

  // `row` now maps to the horizontal axis (90° CCW); push frames off-screen left/right.
  const rowAxis = columnTop + rowStackOffset + spec.row * cellStride
  const { w: vw } = viewport

  if (spec.row < centerRow) {
    return -1 * (rowAxis + cell)
  }
  return -1 * (rowAxis + cell - vw - cell)
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
  const { grid, cell, columnStride, columnMargin, columnTop, rowStackOffset, cellStride, centerRow } = metrics
  // 90° CCW: row drives the horizontal axis, col drives the vertical axis.
  const rowAxis = columnTop + rowStackOffset + row * cellStride + getCellParallaxOffset(row, centerRow, scrollPow, grid)
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
  const { grid, cell, columnStride, columnMargin, columnTop, rowStackOffset, cellStride, centerRow } = metrics
  const aspect = getImageAspect(image)
  // 90° CCW: row drives the horizontal axis, col drives the vertical axis.
  const rowAxis = columnTop + rowStackOffset + row * cellStride + getCellParallaxOffset(row, centerRow, scrollPow, grid)
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
