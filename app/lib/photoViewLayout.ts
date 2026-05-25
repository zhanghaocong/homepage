import type { Mesh } from "three";
import { PlaneGeometry } from "three";
import type { CateImage } from "~/data/gallery";
import { getGridUnit as layoutGridUnit } from "~/lib/galleryLayout";
import {
	getFrameSplashHandoffWorldRect,
	getFrameWorldRect,
} from "~/lib/galleryLayoutStore";

export type PhotoViewWorldRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export function getViewport() {
	return {
		w: window._w ?? window.innerWidth,
		h: window._h ?? window.innerHeight,
	};
}

/** photoyoshi grid column width from viewport (no DOM read). */
export function getGridUnit() {
	return layoutGridUnit();
}

export function getImageAspect(img: {
	width: number;
	height: number;
}) {
	if (img.width > 0 && img.height > 0) return img.width / img.height;
	return 1;
}

export function meshWorldRect(mesh: Mesh): PhotoViewWorldRect {
	const geo = mesh.geometry as PlaneGeometry;
	const width = geo.parameters.width * mesh.scale.x;
	const height = geo.parameters.height * mesh.scale.y;
	return {
		x: mesh.position.x,
		y: mesh.position.y,
		width,
		height,
	};
}

export function rectFromLayoutId(layoutId: string): PhotoViewWorldRect | null {
	return getFrameWorldRect(layoutId);
}

export function getHeroTargetSize(aspect: number) {
	const { w: vw, h: vh } = getViewport();
	const maxH = vh * 0.72;
	const maxW = vw * 0.46;
	let height = maxH;
	let width = height * aspect;
	if (width > maxW) {
		width = maxW;
		height = width / aspect;
	}
	return { width, height };
}

export function heroCenterRect(aspect: number): PhotoViewWorldRect {
	const { width, height } = getHeroTargetSize(aspect);
	return { x: 0, y: 0, width, height };
}

/** Photo view close → splash gather hero slot (same as homepage `splashHeroFrameSize`). */
export function heroSplashHandoffRect(layoutId: string | null): PhotoViewWorldRect | null {
	if (!layoutId) return null;
	const world = getFrameSplashHandoffWorldRect(layoutId);
	if (!world) return null;
	return {
		x: world.x,
		y: world.y,
		width: world.width,
		height: world.height,
	};
}

export function thumbRailX() {
	const { w: vw } = getViewport();
	const grid = getGridUnit();
	return vw / 2 - grid * 4 - grid * 1.25;
}

export function categoryLabelX() {
	return -getViewport().w / 2 + getGridUnit();
}

export function thumbLayoutForIndex(
	images: CateImage[],
	index: number,
	scrollOffset: number,
) {
	const grid = getGridUnit();
	const railX = thumbRailX();
	const gap = grid * 0.35;
	let y = getViewport().h * 0.5 + scrollOffset;

	for (let i = 0; i < index; i++) {
		const aspect = getImageAspect(images[i]);
		const thumbW = grid * 2.5;
		const thumbH = thumbW / aspect;
		y -= thumbH + gap;
	}

	const img = images[index];
	const aspect = getImageAspect(img);
	const width = grid * 2.5;
	const height = width / aspect;
	y -= height / 2;

	return { x: railX, y, width, height };
}

export function thumbScrollBounds(images: CateImage[]) {
	const { h: vh } = getViewport();
	const grid = getGridUnit();
	const gap = grid * 0.35;
	let total = 0;
	for (const img of images) {
		total += grid * 2.5 / getImageAspect(img) + gap;
	}
	const maxScroll = vh * 0.5 + total - vh * 0.5;
	return { min: -maxScroll, max: vh * 0.5 };
}

/** Scroll offset that places thumb `index` at viewport vertical center. */
export function scrollOffsetForThumbCenter(
	images: CateImage[],
	index: number,
) {
	const { y } = thumbLayoutForIndex(images, index, 0);
	return -y;
}

export function nearestThumbIndex(
	images: CateImage[],
	scrollOffset: number,
) {
	let best = 0;
	let bestDist = Number.POSITIVE_INFINITY;
	for (let i = 0; i < images.length; i++) {
		const { y } = thumbLayoutForIndex(images, i, scrollOffset);
		const dist = Math.abs(y);
		if (dist < bestDist) {
			bestDist = dist;
			best = i;
		}
	}
	return best;
}

export function clientToNdc(
	clientX: number,
	clientY: number,
	canvas: HTMLCanvasElement,
) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: ((clientX - rect.left) / rect.width) * 2 - 1,
		y: -((clientY - rect.top) / rect.height) * 2 + 1,
	};
}

export function applyMeshRect(mesh: Mesh, rect: PhotoViewWorldRect) {
	const geo = mesh.geometry as PlaneGeometry;
	const baseW = geo.parameters.width;
	const baseH = geo.parameters.height;
	mesh.position.set(rect.x, rect.y, 1);
	mesh.scale.set(rect.width / baseW, rect.height / baseH, 1);
}
