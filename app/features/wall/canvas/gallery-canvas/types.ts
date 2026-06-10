import type { ScrollPower } from '~/features/wall/lib/jsScroll'

export type GalleryHomeScene = {
  init: (onReady?: () => void) => void
  syncMeshes: () => void
  destroy: () => void
}

export type GalleryEngineHandle = {
  homeScene: GalleryHomeScene
  tick: (power: ScrollPower, currentCategory: string) => void
  warmupRender: () => void
  onResize: () => void
  destroy: () => void
}
