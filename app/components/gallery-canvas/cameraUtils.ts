import type { PerspectiveCamera } from "three";

export const GALLERY_FOV = 50;

export function getGalleryCameraParams(w: number, h: number) {
	const far = -h / 2 / Math.tan((GALLERY_FOV * Math.PI) / 180 / 2);
	return {
		fov: GALLERY_FOV,
		near: 0.1,
		far: far - w,
		positionZ: -far,
		aspect: w / h,
	};
}

export function applyGalleryCamera(camera: PerspectiveCamera, w: number, h: number) {
	const params = getGalleryCameraParams(w, h);
	camera.fov = params.fov;
	camera.near = params.near;
	camera.far = params.far;
	camera.aspect = params.aspect;
	camera.position.set(0, 0, params.positionZ);
	camera.updateProjectionMatrix();
}

export function getViewportSize() {
	return {
		w: window._w ?? window.innerWidth,
		h: window._h ?? window.innerHeight,
	};
}
