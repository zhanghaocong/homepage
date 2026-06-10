import allCateImages from '~/data/allCateImages.json'
import { imageUrl } from '~/data/gallery'
import { getGalleryAtlasManifest } from '~/features/wall/lib/galleryAtlas'

export type GalleryLoadProgress = {
  loaded: number
  total: number
  ratio: number
}

function uniqueGalleryUrls() {
  const urls = new Set<string>()
  const { image: atlasImage, sprites } = getGalleryAtlasManifest()
  if (Object.keys(sprites).length > 0) {
    urls.add(atlasImage)
  }
  for (const arr of Object.values(allCateImages)) {
    for (const img of arr) {
      urls.add(imageUrl(img.medium))
      urls.add(imageUrl(img['2048x2048']))
    }
  }
  return [...urls]
}

export function preloadGalleryImages(onProgress?: (progress: GalleryLoadProgress) => void): {
  promise: Promise<void>
  cancel: () => void
} {
  const urls = uniqueGalleryUrls()
  let loaded = 0
  let cancelled = false

  const report = () => {
    onProgress?.({
      loaded,
      total: urls.length,
      ratio: urls.length > 0 ? loaded / urls.length : 1,
    })
  }

  const promise = new Promise<void>((resolve) => {
    if (urls.length === 0) {
      report()
      resolve()
      return
    }

    report()

    for (const url of urls) {
      const img = new Image()
      const onDone = () => {
        if (cancelled) return
        loaded += 1
        report()
        if (loaded >= urls.length) resolve()
      }
      img.onload = onDone
      img.onerror = onDone
      img.src = url
    }
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
    },
  }
}
