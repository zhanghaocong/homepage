import {
	frameSizeInCell,
	getImageAspect,
	getViewport,
	splashGatherOffsetY,
	splashHeroFrameSize,
	type GalleryFrameSpec,
	type GalleryGridMetrics,
	type GalleryViewport,
} from "~/lib/galleryLayout";

/** Per-frame splash tween target (GSAP mutates these; mesh reads each frame). */
export type SplashFrameTween = {
	y: number;
	width: number;
	height: number;
};

let gatherActive = false;
const tweens = new Map<string, SplashFrameTween>();

export function isSplashGatherActive() {
	return gatherActive;
}

export function beginSplashGather() {
	gatherActive = true;
	tweens.clear();
}

export function endSplashGather() {
	gatherActive = false;
	tweens.clear();
}

export function getSplashFrameTween(frameId: string): SplashFrameTween | null {
	if (!gatherActive) return null;
	return tweens.get(frameId) ?? null;
}

export function groupLayoutColumns(specs: GalleryFrameSpec[]): GalleryFrameSpec[][] {
	const map = new Map<string, GalleryFrameSpec[]>();
	for (const spec of specs) {
		const key = `${spec.sectionIndex}:${spec.col}`;
		if (!map.has(key)) map.set(key, []);
		map.get(key)!.push(spec);
	}
	const columns: GalleryFrameSpec[][] = [];
	for (const frames of map.values()) {
		frames.sort((a, b) => a.row - b.row);
		if (frames.length >= 5) columns.push(frames);
	}
	return columns;
}

/** Seed tween state for one column (rows 0–4). */
export function initSplashColumn(
	frames: GalleryFrameSpec[],
	metrics: GalleryGridMetrics,
	viewport: GalleryViewport = getViewport(),
) {
	for (const spec of frames) {
		const aspect = getImageAspect(spec.image);
		const final = frameSizeInCell(metrics.cell, aspect);
		if (spec.row === 2) {
			const hero = splashHeroFrameSize(metrics, viewport);
			tweens.set(spec.id, {
				y: 0,
				width: hero.width,
				height: hero.height,
			});
		} else {
			tweens.set(spec.id, {
				y: splashGatherOffsetY(spec, metrics, viewport),
				width: final.width,
				height: final.height,
			});
		}
	}
}

export function splashFinalFrameSize(
	spec: GalleryFrameSpec,
	metrics: GalleryGridMetrics,
) {
	return frameSizeInCell(metrics.cell, getImageAspect(spec.image));
}
