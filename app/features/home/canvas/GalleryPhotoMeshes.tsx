import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'
import { useHomeController } from '~/features/home/ctx'

type GalleryPhotoMeshesProps = {
  isMobile: boolean
  onRegistry: (registry: GalleryMeshRegistry | null) => void
  onMeshesReady?: () => void
}

/** Owns gallery wall meshes; positions come from galleryLayoutStore. */
export function GalleryPhotoMeshes({ isMobile, onRegistry, onMeshesReady }: GalleryPhotoMeshesProps) {
  const controller = useHomeController()
  const scene = useThree((state) => state.scene)
  const pmRef = useRef({ value: 0.1 })
  const readyRef = useRef(onMeshesReady)
  readyRef.current = onMeshesReady

  useEffect(() => {
    const registry = new GalleryMeshRegistry({
      scene,
      isMobile,
      pm: pmRef.current,
      getHomeState: controller.getSnapshot,
    })

    onRegistry(registry)
    controller.meshRegistryRef.current = registry
    registry.init(() => readyRef.current?.())

    return () => {
      registry.destroy()
      controller.meshRegistryRef.current = null
      onRegistry(null)
    }
  }, [controller, isMobile, onRegistry, scene])

  return null
}
