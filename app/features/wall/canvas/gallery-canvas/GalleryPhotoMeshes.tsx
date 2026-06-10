import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { GalleryMeshRegistry } from '~/features/wall/canvas/gallery-canvas/galleryMeshRegistry'

type GalleryPhotoMeshesProps = {
  contentRef: React.RefObject<HTMLElement | null>
  isMobile: boolean
  onRegistry: (registry: GalleryMeshRegistry | null) => void
  onMeshesReady?: () => void
}

/** Owns gallery wall meshes; positions come from galleryLayoutStore. */
export function GalleryPhotoMeshes({ contentRef, isMobile, onRegistry, onMeshesReady }: GalleryPhotoMeshesProps) {
  const scene = useThree((state) => state.scene)
  const pmRef = useRef({ value: 0.1 })
  const readyRef = useRef(onMeshesReady)
  readyRef.current = onMeshesReady

  useEffect(() => {
    if (!contentRef.current) return

    const registry = new GalleryMeshRegistry({
      scene,
      isMobile,
      pm: pmRef.current,
    })

    onRegistry(registry)
    registry.init(() => readyRef.current?.())

    return () => {
      registry.destroy()
      onRegistry(null)
    }
  }, [contentRef, isMobile, onRegistry, scene])

  return null
}
