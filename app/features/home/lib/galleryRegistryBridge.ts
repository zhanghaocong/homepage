import type { GalleryMeshRegistry } from '~/features/home/canvas/gallery-canvas/galleryMeshRegistry'

let meshRegistry: GalleryMeshRegistry | null = null

export function registerGalleryMeshRegistry(registry: GalleryMeshRegistry) {
  meshRegistry = registry
}

export function unregisterGalleryMeshRegistry() {
  meshRegistry = null
}

export function getGalleryMeshRegistry() {
  return meshRegistry
}
