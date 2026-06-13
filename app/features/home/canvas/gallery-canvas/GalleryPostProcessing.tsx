import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, EffectPass, RenderPass } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import { NoToneMapping, UnsignedByteType } from 'three'
import { GalleryCompositeEffectImpl } from '~/features/home/canvas/gallery-canvas/galleryCompositeEffect'
import type { GalleryMeshRegistry } from '~/features/home/canvas/gallery-canvas/galleryMeshRegistry'
import { getPhotoViewState } from '~/features/photo-view/lib/photoViewStore'

type GalleryPostProcessingProps = {
  meshRegistry: GalleryMeshRegistry
}

/**
 * Stable post-processing: one EffectComposer for the gallery lifetime.
 * Always render through the composer (u_type=0 passthrough during photo view).
 * Do not use @react-three/postprocessing's EffectComposer — wrapEffect re-instantiates
 * effects when uniform values change (JSON.stringify deps) and can lose the GL context.
 */
export function GalleryPostProcessing({ meshRegistry }: GalleryPostProcessingProps) {
  const { gl, scene, camera, size, invalidate } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const wasPhotoViewOpenRef = useRef(false)

  const effect = useMemo(
    () =>
      new GalleryCompositeEffectImpl({
        effectUniforms: meshRegistry.effectUniforms,
      }),
    [meshRegistry],
  )

  useEffect(() => {
    const composer = new EffectComposer(gl, {
      multisampling: 0,
      frameBufferType: UnsignedByteType,
    })
    const renderPass = new RenderPass(scene, camera)
    renderPass.renderToScreen = false
    const effectPass = new EffectPass(camera, effect)
    effectPass.renderToScreen = true
    composer.addPass(renderPass)
    composer.addPass(effectPass)

    const prevToneMapping = gl.toneMapping
    gl.toneMapping = NoToneMapping

    composerRef.current = composer

    return () => {
      gl.toneMapping = prevToneMapping
      composer.dispose()
      composerRef.current = null
    }
  }, [camera, effect, gl, scene])

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height)
  }, [size.height, size.width])

  useFrame((_, delta) => {
    if (gl.getContext().isContextLost()) return

    const photoViewOpen = getPhotoViewState().open

    if (wasPhotoViewOpenRef.current && !photoViewOpen) {
      meshRegistry.restoreWallMeshes()
      meshRegistry.onResize()
      composerRef.current?.setSize(size.width, size.height)
      for (let i = 0; i < 3; i++) {
        requestAnimationFrame(() => invalidate())
      }
    }
    wasPhotoViewOpenRef.current = photoViewOpen

    const composer = composerRef.current
    if (!composer) return

    gl.setRenderTarget(null)
    gl.autoClear = true
    gl.setClearColor(0, 0)
    composer.render(delta)
  }, 2)

  return null
}
