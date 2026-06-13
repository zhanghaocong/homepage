import React, { useSyncExternalStore } from 'react'
import type { PhotoViewHost } from '~/features/photo-view/lib/photoViewHost'
import { photoViewState, type PhotoViewState } from '~/features/photo-view/lib/photoViewStore'

export const PhotoViewHostContext = React.createContext<PhotoViewHost | null>(null)

export function usePhotoViewHost() {
  const host = React.useContext(PhotoViewHostContext)
  if (!host) {
    throw new Error('PhotoViewHost is missing — wrap the tree in PhotoViewHostContext')
  }
  return host
}

export function usePhotoViewState(): PhotoViewState {
  return useSyncExternalStore(
    photoViewState.subscribe,
    photoViewState.getSnapshot,
    photoViewState.getSnapshot,
  )
}
