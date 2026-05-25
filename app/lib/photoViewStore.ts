import { atom, createStore } from "jotai";
import type { CateImage, CateKey } from "~/data/gallery";

export type PhotoViewCategory = "interior" | "portrait" | "landscape";

export type PhotoViewRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PhotoViewState = {
	open: boolean;
	/** Side panels (thumbs, category) visible after fly-to-center completes. */
	uiReady: boolean;
	category: PhotoViewCategory;
	activeIndex: number;
	heroSrc: string;
	sourceFrame: HTMLElement | null;
};

const initialState: PhotoViewState = {
	open: false,
	uiReady: false,
	category: "interior",
	activeIndex: 0,
	heroSrc: "",
	sourceFrame: null,
};

export const photoViewStore = createStore();

export const photoViewAtom = atom<PhotoViewState>(initialState);

export function getPhotoViewState() {
	return photoViewStore.get(photoViewAtom);
}

export function setPhotoViewState(patch: Partial<PhotoViewState>) {
	photoViewStore.set(photoViewAtom, { ...getPhotoViewState(), ...patch });
}

export function resetPhotoViewState() {
	photoViewStore.set(photoViewAtom, { ...initialState });
}

export const CATE_ID_TO_KEY: Record<PhotoViewCategory, CateKey> = {
	interior: "Interior",
	portrait: "Portrait",
	landscape: "Landscape",
};

export function normalizePhotoCategory(raw?: string | null): PhotoViewCategory {
	const id = (raw ?? "interior").toLowerCase();
	if (id === "portrait" || id === "landscape") return id;
	return "interior";
}

export function findImageIndex(images: CateImage[], src: string) {
	const normalized = src.replace(/\.webp$/, "").split("/").pop() ?? src;
	return images.findIndex((img) => {
		const medium = img.medium.split("/").pop()?.replace(/\.webp$/, "") ?? "";
		const large =
			img["2048x2048"].split("/").pop()?.replace(/\.webp$/, "") ?? "";
		const srcFile = normalized.split("/").pop() ?? normalized;
		return (
			srcFile.includes(medium) ||
			srcFile.includes(large) ||
			medium.includes(srcFile) ||
			large.includes(srcFile)
		);
	});
}

export function rectFromDomRect(rect: DOMRect): PhotoViewRect {
	return {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	};
}
