import { Canvas } from "@react-three/fiber";
import { GalleryScene } from "~/components/gallery-canvas/GalleryScene";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
import {
	loadGalleryAtlasTexture,
	tuneGalleryAtlasForRenderer,
} from "~/lib/galleryAtlas";
import type { JsScroll } from "~/lib/jsScroll";

export type GalleryCanvasProps = {
	contentRef: React.RefObject<HTMLElement | null>;
	wrapRef: React.RefObject<HTMLElement | null>;
	engineRef: React.MutableRefObject<GalleryEngineHandle | null>;
	scrollRef: React.MutableRefObject<JsScroll | null>;
	onEngineReady?: () => void;
};

/**
 * R3F entry for the gallery WebGL layer.
 * Render loop is driven by GallerySyncSystem (useFrame), not gsap.ticker.
 */
export function GalleryCanvas({
	contentRef,
	wrapRef,
	engineRef,
	scrollRef,
	onEngineReady,
}: GalleryCanvasProps) {
	return (
		<Canvas
			frameloop="always"
			gl={{ antialias: true, alpha: true }}
			dpr={[1, 2]}
			style={{ display: "block", width: "100%", height: "100%" }}
			onCreated={({ gl, size }) => {
				// photoyoshi.com: transparent clear so CSS page bg shows through meshes
				gl.setClearColor(0, 0);
				gl.setSize(size.width, size.height, false);
				void loadGalleryAtlasTexture().then(() => {
					tuneGalleryAtlasForRenderer(gl);
				});
			}}
		>
			<GalleryScene
				contentRef={contentRef}
				wrapRef={wrapRef}
				engineRef={engineRef}
				scrollRef={scrollRef}
				onEngineReady={onEngineReady}
			/>
		</Canvas>
	);
}
