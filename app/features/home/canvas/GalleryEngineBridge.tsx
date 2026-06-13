import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PerspectiveCamera } from 'three'
import { attachGalleryRuntime } from '~/features/home/canvas/galleryEngine'
import type { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'

type GalleryEngineBridgeProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  meshRegistry: GalleryMeshRegistry
}

/**
 * Attaches scroll-direction state and resize handling for the gallery runtime.
 * Post-processing rendering is owned by GalleryPostProcessing.
 */
export function GalleryEngineBridge({ engineRef, meshRegistry }: GalleryEngineBridgeProps) {
  const { gl, camera } = useThree()

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return

    const engine = attachGalleryRuntime({
      gl,
      camera,
      canvas: gl.domElement,
      meshRegistry,
    })

    engineRef.current = engine

    return () => {
      engine.destroy()
      if (engineRef.current === engine) {
        engineRef.current = null
      }
    }
  }, [camera, engineRef, gl, meshRegistry])

  return null
}
