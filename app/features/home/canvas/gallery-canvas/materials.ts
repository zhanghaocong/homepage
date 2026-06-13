import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { DoubleSide, Texture, Vector2, Vector4 } from 'three'
import photoFragmentShader from '~/features/home/canvas/gallery-canvas/shaders/photo.frag.glsl?raw'
import photoVertexShader from '~/features/home/canvas/gallery-canvas/shaders/photo.vert.glsl?raw'
export const GalleryPhotoMaterial = shaderMaterial(
  {
    tA: null as Texture | null,
    vUvScale: new Vector2(1, 1),
    vUvRect: new Vector4(0, 0, 1, 1),
    opacityN: 0,
    mode: 1,
    u_type: 1,
    pw: 0,
  },
  photoVertexShader,
  photoFragmentShader,
)

extend({ GalleryPhotoMaterial })

export type GalleryPhotoMaterialImpl = InstanceType<typeof GalleryPhotoMaterial>

export function createGalleryPhotoMaterial(
  texture: Texture,
  uvRect = new Vector4(0, 0, 1, 1),
): GalleryPhotoMaterialImpl {
  const material = new GalleryPhotoMaterial()
  material.tA = texture
  material.vUvScale = new Vector2(1, 1)
  material.vUvRect = uvRect.clone()
  material.opacityN = 0
  material.mode = 1
  material.u_type = 1
  material.pw = 0
  material.side = DoubleSide
  material.transparent = true
  return material
}

export { photoFragmentShader, photoVertexShader }
