import { PerspectiveCamera, WebGLRenderer } from 'three'
import { applyGalleryCamera, getGalleryMaxDpr, getViewportSize } from '~/features/home/canvas/cameraUtils'
import type { GalleryMeshRegistry } from '~/features/home/canvas/galleryMeshRegistry'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import type { ScrollPower } from '~/features/home/lib/jsScroll'

type AttachGalleryRuntimeOptions = {
  gl: WebGLRenderer
  camera: PerspectiveCamera
  canvas: HTMLCanvasElement
  meshRegistry: GalleryMeshRegistry
}

export function attachGalleryRuntime({
  gl,
  camera,
  canvas,
  meshRegistry,
}: AttachGalleryRuntimeOptions): GalleryEngineHandle {
  const onWheelDir = (e: WheelEvent) => {
    const dx = e.deltaX || 0
    const dy = e.deltaY || 0
    const dir = Math.abs(dx) >= Math.abs(dy) ? dx : dy
    meshRegistry.pm.value = dir > 0 ? 0.1 : -0.1
  }
  window.addEventListener('wheel', onWheelDir, { passive: true })

  const stillPower = {
    pow1: { value: 0 },
    pow2: { value: 0 },
  } as ScrollPower

  const homeScene = {
    init: meshRegistry.init.bind(meshRegistry),
    syncMeshes: meshRegistry.syncMeshes.bind(meshRegistry),
    destroy: () => {},
  }

  const tick = (power: ScrollPower, _currentCategory: string) => {
    meshRegistry.effectTick(power)
  }

  const warmupRender = () => {
    meshRegistry.effectTick(stillPower)
  }

  const onResize = () => {
    const { w: nw, h: nh } = getViewportSize()
    applyGalleryCamera(camera, nw, nh)
    gl.setSize(nw, nh)
    gl.setPixelRatio(Math.min(window.devicePixelRatio, getGalleryMaxDpr()))
    canvas.style.width = `${nw}px`
    canvas.style.height = `${nh}px`
    meshRegistry.onResize()
  }

  const destroy = () => {
    window.removeEventListener('wheel', onWheelDir)
  }

  return { homeScene, tick, warmupRender, onResize, destroy }
}
