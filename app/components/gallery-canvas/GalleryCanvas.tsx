import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import { GalleryScene } from "~/components/gallery-canvas/GalleryScene";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
import {
	loadGalleryAtlasTexture,
	tuneGalleryAtlasForRenderer,
} from "~/lib/galleryAtlas";
import type { JsScroll } from "~/lib/jsScroll";
import { siteBgHex } from "~/lib/siteBg";
import { THEME_CHANGE_EVENT } from "~/lib/theme";

export type GalleryCanvasProps = {
	contentRef: React.RefObject<HTMLElement | null>;
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
	engineRef,
	scrollRef,
	onEngineReady,
}: GalleryCanvasProps) {
	const glRef = useRef<WebGLRenderer | null>(null);

	useEffect(() => {
		const syncClear = () => {
			glRef.current?.setClearColor(siteBgHex(), 1);
		};
		window.addEventListener(THEME_CHANGE_EVENT, syncClear);
		return () => window.removeEventListener(THEME_CHANGE_EVENT, syncClear);
	}, []);

	return (
		<Canvas
			frameloop="always"
			gl={{ antialias: true, alpha: true }}
			dpr={[1, 2]}
			style={{ display: "block", width: "100%", height: "100%" }}
			onCreated={({ gl, size }) => {
				glRef.current = gl;
				gl.setClearColor(siteBgHex(), 1);
				gl.setSize(size.width, size.height, false);
				void loadGalleryAtlasTexture().then(() => {
					tuneGalleryAtlasForRenderer(gl);
				});
			}}
		>
			<GalleryScene
				contentRef={contentRef}
				engineRef={engineRef}
				scrollRef={scrollRef}
				onEngineReady={onEngineReady}
			/>
		</Canvas>
	);
}
