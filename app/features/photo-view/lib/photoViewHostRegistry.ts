import type { PhotoViewHost } from '~/features/photo-view/lib/photoViewHost'
import { bindPhotoViewLayoutHost, unbindPhotoViewLayoutHost } from '~/features/photo-view/lib/photoViewLayout'

let host: PhotoViewHost | null = null

export function registerPhotoViewHost(next: PhotoViewHost) {
  host = next
  bindPhotoViewLayoutHost(next)
}

export function unregisterPhotoViewHost() {
  host = null
  unbindPhotoViewLayoutHost()
}

export function getPhotoViewHost(): PhotoViewHost {
  if (!host) {
    throw new Error('PhotoViewHost is missing — register it before opening photo view')
  }
  return host
}
