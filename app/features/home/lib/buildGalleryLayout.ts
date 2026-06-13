import { galleryCategoryOrder, galleryImages, imageUrl, type CateImage, type CateKey } from '~/data/gallery'
import type { GalleryFrameSpec, GalleryLayoutDocument, GallerySectionSpec } from '~/features/home/lib/galleryLayout'
import { getGalleryLayoutDocument, setGalleryLayoutDocument } from '~/features/home/lib/galleryLayoutStore'

const CELLS_PER_COLUMN = 5
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

function buildSectionSpec(category: CateKey, sectionIndex: number): GallerySectionSpec {
  const pool = [...galleryImages[category]]
  const frames: GalleryFrameSpec[] = []

  for (let col = 0; col < COLUMNS; col++) {
    const images = pickImages(pool, CELLS_PER_COLUMN)
    for (let row = 0; row < images.length; row++) {
      const img = images[row]
      const id = `s${sectionIndex}-c${col}-r${row}`
      const src = row === 2 ? imageUrl(img['2048x2048']) : imageUrl(img.medium)
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
  const sections: GallerySectionSpec[] = []
  for (let i = 0; i < galleryCategoryOrder.length; i++) {
    sections.push(buildSectionSpec(galleryCategoryOrder[i], i))
  }
  return { sections }
}

/** Build gallery layout model only — scroll positions live in jsScroll + layout store. */
export function buildGalleryLayout(): GalleryLayoutDocument {
  const cached = getGalleryLayoutDocument()
  if (cached?.sections.length && cached.sections.some((s) => s.frames.length > 0)) {
    return cached
  }

  const doc = buildFreshLayout()
  setGalleryLayoutDocument(doc)
  return doc
}
