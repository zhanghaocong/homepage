import type { CateImage, CateKey } from '~/data/gallery'
import type { PhotoViewWorldRect } from '~/features/photo-view/lib/photoViewLayout'
import { Signal } from '~/shared/lib/signal'

export type PhotoViewCategory = 'interior' | 'portrait' | 'landscape'

export type PhotoViewState = {
  open: boolean
  /** Fly-out + wall reveal in progress. */
  closing: boolean
  /** Side panels (thumbs, category) visible after fly-to-center completes. */
  uiReady: boolean
  category: PhotoViewCategory
  activeIndex: number
  heroSrc: string
  sourceLayoutId: string | null
  fromRect: PhotoViewWorldRect | null
}

export const INITIAL_PHOTO_VIEW_STATE: PhotoViewState = {
  open: false,
  closing: false,
  uiReady: false,
  category: 'interior',
  activeIndex: 0,
  heroSrc: '',
  sourceLayoutId: null,
  fromRect: null,
}

export const photoViewState = new Signal<PhotoViewState>({ ...INITIAL_PHOTO_VIEW_STATE })

export function getPhotoViewState() {
  return photoViewState.getSnapshot()
}

export function setPhotoViewState(patch: Partial<PhotoViewState>) {
  photoViewState.patch(patch)
}

export function resetPhotoViewState() {
  photoViewState.reset({ ...INITIAL_PHOTO_VIEW_STATE })
}

export const CATE_ID_TO_KEY: Record<PhotoViewCategory, CateKey> = {
  interior: 'Interior',
  portrait: 'Portrait',
  landscape: 'Landscape',
}

export function normalizePhotoCategory(raw?: string | null): PhotoViewCategory {
  const id = (raw ?? 'interior').toLowerCase()
  if (id === 'portrait' || id === 'landscape') return id
  return 'interior'
}

export function findImageIndex(images: CateImage[], src: string) {
  const normalized =
    src
      .replace(/\.webp$/, '')
      .split('/')
      .pop() ?? src
  return images.findIndex((img) => {
    const medium =
      img.medium
        .split('/')
        .pop()
        ?.replace(/\.webp$/, '') ?? ''
    const large =
      img['2048x2048']
        .split('/')
        .pop()
        ?.replace(/\.webp$/, '') ?? ''
    const srcFile = normalized.split('/').pop() ?? normalized
    return srcFile.includes(medium) || srcFile.includes(large) || medium.includes(srcFile) || large.includes(srcFile)
  })
}
