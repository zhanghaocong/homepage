import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { applyGalleryCamera, getViewportSize } from "~/components/gallery-canvas/cameraUtils";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import { createCompositeMaterial } from "~/components/gallery-canvas/materials";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
import type { ScrollPower } from "~/lib/jsScroll";

type AttachGalleryEngineOptions = {
	gl: WebGLRenderer;
	scene: Scene;
	camera: PerspectiveCamera;
	canvas: HTMLCanvasElement;
	meshRegistry: GalleryMeshRegistry;
};

export function attachGalleryEngine({
	gl,
	scene,
	camera,
	canvas,
	meshRegistry,
}: AttachGalleryEngineOptions): GalleryEngineHandle {
	const composer = new EffectComposer(gl);
	composer.addPass(new RenderPass(scene, camera));

	const compositeMat = createCompositeMaterial(meshRegistry.effectUniforms);
	const compositePass = new ShaderPass(compositeMat);
	compositePass.renderToScreen = true;
	composer.addPass(compositePass);

	const onWheelDir = (e: WheelEvent) => {
		const dx = e.deltaX || 0;
		const dy = e.deltaY || 0;
		const dir = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
		meshRegistry.pm.value = dir > 0 ? 0.1 : -0.1;
	};
	window.addEventListener("wheel", onWheelDir, { passive: true });

	const stillPower = {
		pow1: { value: 0 },
		pow2: { value: 0 },
	} as ScrollPower;

	const homeScene = {
		init: meshRegistry.init.bind(meshRegistry),
		syncMeshes: meshRegistry.syncMeshes.bind(meshRegistry),
		destroy: () => {},
	};

	const warmupRender = () => {
		meshRegistry.effectTick(stillPower);
		composer.render();
	};

	const tick = (power: ScrollPower, _currentCategory: string) => {
		meshRegistry.effectTick(power);
		composer.render();
	};

	const onResize = () => {
		const { w: nw, h: nh } = getViewportSize();
		applyGalleryCamera(camera, nw, nh);
		gl.setSize(nw, nh);
		gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		canvas.style.width = `${nw}px`;
		canvas.style.height = `${nh}px`;
		composer.setSize(nw, nh);
		meshRegistry.onResize();
	};

	const destroy = () => {
		window.removeEventListener("wheel", onWheelDir);
		composer.dispose();
	};

	return { homeScene, tick, warmupRender, onResize, destroy };
}
