import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector4,
  type WebGLRenderer,
} from 'three'
import {
  getGalleryAtlasManifest,
  type GalleryAtlasSprite,
} from '~/features/home/lib/galleryAtlasManifest'

export type { GalleryAtlasManifest, GalleryAtlasSprite } from '~/features/home/lib/galleryAtlasManifest'
export { galleryAtlasKeyFromSrc, getGalleryAtlasManifest, getGalleryAtlasSprite } from '~/features/home/lib/galleryAtlasManifest'

const manifest = getGalleryAtlasManifest()

let atlasTexture: Texture | null = null
let loadPromise: Promise<Texture> | null = null
let atlasDisposed = false

const loader = new TextureLoader()
loader.setCrossOrigin('anonymous')

function configureAtlasTexture(tex: Texture) {
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = ClampToEdgeWrapping
  tex.wrapT = ClampToEdgeWrapping
  tex.minFilter = LinearMipmapLinearFilter
  tex.magFilter = LinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 1
  tex.needsUpdate = true
  return tex
}

/** Call from R3F `onCreated` so anisotropy matches device (helps at high DPR). */
export function tuneGalleryAtlasForRenderer(gl: WebGLRenderer) {
  if (!atlasTexture) return
  const max = gl.capabilities.getMaxAnisotropy()
  atlasTexture.anisotropy = Math.min(8, max)
  atlasTexture.needsUpdate = true
}

export function loadGalleryAtlasTexture(): Promise<Texture> {
  if (atlasTexture && !atlasDisposed) return Promise.resolve(atlasTexture)
  atlasTexture = null
  atlasDisposed = false
  loadPromise = null

  loadPromise = new Promise((resolve, reject) => {
    loader.load(
      manifest.image,
      (tex) => {
        atlasTexture = configureAtlasTexture(tex)
        atlasDisposed = false
        resolve(atlasTexture)
      },
      undefined,
      reject,
    )
  })

  return loadPromise
}

export function getGalleryAtlasTexture(): Texture | null {
  return atlasTexture && !atlasDisposed ? atlasTexture : null
}

export function spriteToUvRect(sprite: GalleryAtlasSprite): Vector4 {
  return new Vector4(sprite.u0, sprite.v0, sprite.u1, sprite.v1)
}

export function disposeGalleryAtlas() {
  if (atlasTexture) {
    atlasTexture.dispose()
    atlasTexture = null
  }
  atlasDisposed = true
  loadPromise = null
}
