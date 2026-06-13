import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'

type GalleryPhotoMeshesProps = {
  isMobile: boolean
  onRegistry: (registry: GalleryMeshRegistry | null) => void
  onMeshesReady?: () => void
}

/** Owns gallery wall meshes; positions come from galleryLayoutStore. */
export function GalleryPhotoMeshes({ isMobile, onRegistry, onMeshesReady }: GalleryPhotoMeshesProps) {
  const scene = useThree((state) => state.scene)
  const pmRef = useRef({ value: 0.1 })
  const readyRef = useRef(onMeshesReady)
  readyRef.current = onMeshesReady

  useEffect(() => {
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
  }, [isMobile, onRegistry, scene])

  return null
}
