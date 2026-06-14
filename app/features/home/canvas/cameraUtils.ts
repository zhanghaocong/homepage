import type { PerspectiveCamera } from 'three'
import { getViewportSize as readViewportSize } from '~/features/home/lib/viewport'

export const GALLERY_FOV = 50

export function getGalleryCameraParams(w: number, h: number) {
  const far = -h / 2 / Math.tan((GALLERY_FOV * Math.PI) / 180 / 2)
  return {
    fov: GALLERY_FOV,
    near: 0.1,
    far: far - w,
    positionZ: -far,
    aspect: w / h,
  }
}

export function applyGalleryCamera(camera: PerspectiveCamera, w: number, h: number) {
  const params = getGalleryCameraParams(w, h)
  camera.fov = params.fov
  camera.near = params.near
  camera.far = params.far
  camera.aspect = params.aspect
  camera.position.set(0, 0, params.positionZ)
  camera.updateProjectionMatrix()
}

export function getViewportSize() {
  return readViewportSize()
}

/**
 * Max device pixel ratio for the gallery renderer.
 * Touch devices (phones/tablets) often report DPR 2–3; rendering at full res plus the
 * full-screen post-processing pass is fill-rate bound there, so cap lower to keep FPS up.
 */
export function getGalleryMaxDpr(): number {
  if (typeof window === 'undefined') return 2
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  return coarsePointer ? 1.5 : 2
}
