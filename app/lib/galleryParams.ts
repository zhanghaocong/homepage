export type GalleryMode = "grid" | "full";

export const galleryParams = {
	mode: 0,
	modeChangePow: 0,
	APowF: 0,
};

export function setGalleryMode(next: GalleryMode) {
	const target = next === "full" ? 1 : 0;
	document.documentElement.dataset.mode = next;
	galleryParams.mode = target;
}
