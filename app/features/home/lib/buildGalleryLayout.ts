import { galleryCategoryOrder, galleryImages, imageUrl, type CateImage, type CateKey } from '~/data/gallery'
import {
  getCellsPerColumn,
  getColumnCenterRow,
  type GalleryFrameSpec,
  type GalleryLayoutDocument,
  type GallerySectionSpec,
} from '~/features/home/lib/galleryLayout'
import { getGalleryLayoutDocument, setGalleryLayoutDocument } from '~/features/home/lib/galleryLayoutStore'

const COLUMNS = 2

function pickImages(pool: CateImage[], count: number) {
  const copy = [...pool]
  const picked: CateImage[] = []
  for (let n = 0; n < count && copy.length > 0; n++) {
    const idx = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(idx, 1)[0])
  }
  return picked
}

function buildSectionSpec(
  category: CateKey,
  sectionIndex: number,
  cells: number,
  centerRow: number,
): GallerySectionSpec {
  const pool = [...galleryImages[category]]
  const frames: GalleryFrameSpec[] = []

  for (let col = 0; col < COLUMNS; col++) {
    const images = pickImages(pool, cells)
    for (let row = 0; row < images.length; row++) {
      const img = images[row]
      const id = `s${sectionIndex}-c${col}-r${row}`
      const src = row === centerRow ? imageUrl(img['2048x2048']) : imageUrl(img.medium)
      frames.push({
        id,
        sectionIndex,
        category,
        col,
        row,
        image: img,
        src,
        jsSrc: src,
        isClone: false,
      })
    }
  }

  return {
    index: sectionIndex,
    category,
    isClone: false,
    frames,
  }
}

function buildFreshLayout(): GalleryLayoutDocument {
  const cells = getCellsPerColumn()
  const centerRow = getColumnCenterRow(cells)
  const sections: GallerySectionSpec[] = []
  for (let i = 0; i < galleryCategoryOrder.length; i++) {
    sections.push(buildSectionSpec(galleryCategoryOrder[i], i, cells, centerRow))
  }
  return { sections }
}

/** Cells in one original (non-clone) column of the currently built layout. */
function builtCellsPerColumn(doc: GalleryLayoutDocument | null): number {
  const original = doc?.sections.find((s) => !s.isClone)
  if (!original) return 0
  return original.frames.filter((f) => f.col === 0).length
}

/** Build gallery layout model only — scroll positions live in jsScroll + layout store. */
export function buildGalleryLayout(): GalleryLayoutDocument {
  const cached = getGalleryLayoutDocument()
  if (cached?.sections.length && cached.sections.some((s) => s.frames.length > 0)) {
    if (builtCellsPerColumn(cached) !== getCellsPerColumn()) {
      const doc = buildFreshLayout()
      setGalleryLayoutDocument(doc)
      return doc
    }
    return cached
  }

  const doc = buildFreshLayout()
  setGalleryLayoutDocument(doc)
  return doc
}

/** Rebuild a fresh layout when responsive cells-per-row changes (resize across a breakpoint). */
export function rebuildGalleryLayoutIfCellsChanged(): boolean {
  const cached = getGalleryLayoutDocument()
  if (builtCellsPerColumn(cached) === getCellsPerColumn()) return false
  setGalleryLayoutDocument(buildFreshLayout())
  return true
}
