import galleryAtlasManifest from '~/data/galleryAtlas.json'

export type GalleryAtlasSprite = {
  u0: number
  v0: number
  u1: number
  v1: number
  w: number
  h: number
}

export type GalleryAtlasManifest = {
  image: string
  width: number
  height: number
  maxThumb: number
  extrude: number
  /** Unique photos in atlas (path aliases may exceed this). */
  spriteCount?: number
  sprites: Record<string, GalleryAtlasSprite>
}

const manifest = galleryAtlasManifest as GalleryAtlasManifest

/** Path key without `.webp` suffix (matches `imageUrl()` input). */
export function galleryAtlasKeyFromSrc(src: string) {
  return src.replace(/\.webp$/i, '')
}

export function getGalleryAtlasManifest() {
  return manifest
}

export function getGalleryAtlasSprite(key: string): GalleryAtlasSprite | null {
  return manifest.sprites[key] ?? null
}
