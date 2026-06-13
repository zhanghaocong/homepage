import React from 'react'
import type { PhotoViewHost } from '~/features/photo-view/lib/photoViewHost'

export const PhotoViewHostContext = React.createContext<PhotoViewHost | null>(null)

export function usePhotoViewHost() {
  const host = React.useContext(PhotoViewHostContext)
  if (!host) {
    throw new Error('PhotoViewHost is missing — wrap the tree in PhotoViewHostContext')
  }
  return host
}
