import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { applyGalleryCamera, getGalleryCameraParams, getViewportSize, GALLERY_FOV } from "~/components/gallery-canvas/cameraUtils";
import { attachGalleryEngine } from "~/components/gallery-canvas/galleryEngine";
import { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";

export type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
export { attachGalleryEngine } from "~/components/gallery-canvas/galleryEngine";
export { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";

/** @deprecated Use GalleryCanvas + attachGalleryEngine via R3F bridge. */
export function createCanvasEngine(canvasWrap: HTMLElement): GalleryEngineHandle {
	const { w, h } = getViewportSize();
	const res = Math.min(window.devicePixelRatio, 2);

	const scene = new Scene();
	const canvas = document.createElement("canvas");
	canvasWrap.appendChild(canvas);

	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setClearColor(0, 0);
	renderer.setPixelRatio(res);
	renderer.setSize(w, h);

	const camera = new PerspectiveCamera(
		GALLERY_FOV,
		w / h,
		0.1,
		getGalleryCameraParams(w, h).far,
	);
	applyGalleryCamera(camera, w, h);

	const pm = { value: 0.1 };
	const meshRegistry = new GalleryMeshRegistry({
		scene,
		isMobile: w < 680,
		pm,
	});

	const engine = attachGalleryEngine({
		gl: renderer,
		scene,
		camera,
		canvas,
		meshRegistry,
	});

	const destroy = () => {
		engine.destroy();
		meshRegistry.destroy();
		renderer.dispose();
		canvas.remove();
	};

	return { ...engine, destroy };
}

export type CanvasEngine = GalleryEngineHandle;
