export const galleryParams = {
	mode: 0,
	modeChangePow: 0,
	APowF: 0,
};

export function initGalleryMode() {
	document.documentElement.dataset.mode = "grid";
	galleryParams.mode = 0;
}
