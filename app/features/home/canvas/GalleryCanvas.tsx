import { Canvas } from '@react-three/fiber'
import { GalleryScene } from '~/features/home/canvas/GalleryScene'
import type { GalleryEngineHandle } from '~/features/home/canvas/types'
import { loadGalleryAtlasTexture, tuneGalleryAtlasForRenderer } from '~/features/home/lib/galleryAtlas'
import type { JsScroll } from '~/features/home/lib/jsScroll'

export type GalleryCanvasProps = {
  engineRef: React.MutableRefObject<GalleryEngineHandle | null>
  scrollRef: React.MutableRefObject<JsScroll | null>
  photoViewOpenRef: React.MutableRefObject<boolean>
  onEngineReady?: () => void
}

/**
 * R3F entry for the gallery WebGL layer.
 * Scroll + mesh sync run in GallerySyncSystem (useFrame priority 1); post-processing at priority 2.
 */
export function GalleryCanvas({ engineRef, scrollRef, photoViewOpenRef, onEngineReady }: GalleryCanvasProps) {
  return (
    <Canvas
      frameloop="always"
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ display: 'block', width: '100%', height: '100%' }}
      onCreated={({ gl, size }) => {
        // photoyoshi.com: transparent clear so CSS page bg shows through meshes
        gl.setClearColor(0, 0)
        gl.setSize(size.width, size.height, false)

        const canvas = gl.domElement
        const onContextLost = (event: Event) => {
          event.preventDefault()
        }
        const onContextRestored = () => {
          void loadGalleryAtlasTexture().then(() => {
            tuneGalleryAtlasForRenderer(gl)
          })
        }
        canvas.addEventListener('webglcontextlost', onContextLost, false)
        canvas.addEventListener('webglcontextrestored', onContextRestored, false)

        void loadGalleryAtlasTexture().then(() => {
          tuneGalleryAtlasForRenderer(gl)
        })
      }}
    >
      <GalleryScene
        engineRef={engineRef}
        scrollRef={scrollRef}
        photoViewOpenRef={photoViewOpenRef}
        onEngineReady={onEngineReady}
      />
    </Canvas>
  )
}
