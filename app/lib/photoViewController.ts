import gsap from "gsap";
import {
	CATE_ID_TO_KEY,
	findImageIndex,
	getPhotoViewState,
	normalizePhotoCategory,
	resetPhotoViewState,
	setPhotoViewState,
} from "~/lib/photoViewStore";
import { galleryImages, imageUrl } from "~/data/gallery";
import type { GalleryMeshEntry } from "~/components/gallery-canvas/galleryMeshRegistry";
import type { JsScroll } from "~/lib/jsScroll";

let scrollRef: JsScroll | null = null;
let wallWrap: HTMLElement | null = null;
let onOpenChange: ((open: boolean) => void) | null = null;
let closing = false;

const WALL_FADE_SEL =
	".js-canvas__wrap, .p-home .c-content, .p-home .js-page__cover";

export function registerPhotoViewContext(
	scroll: JsScroll,
	wrap: HTMLElement,
	onOpen: (open: boolean) => void,
) {
	scrollRef = scroll;
	wallWrap = wrap;
	onOpenChange = onOpen;
}

export function unregisterPhotoViewContext() {
	scrollRef?.setInputEnabled(true);
	scrollRef = null;
	wallWrap = null;
	onOpenChange = null;
}

export function getPhotoViewOpen() {
	return getPhotoViewState().open;
}

export function isPhotoViewClosing() {
	return closing;
}

function lockWallScroll(locked: boolean) {
	wallWrap?.classList.toggle("is-photo-view-locked", locked);
	scrollRef?.setInputEnabled(!locked);
}

function setHtmlPhotoView(on: boolean) {
	const html = document.documentElement;
	html.classList.toggle("l-photo-view", on);
	html.classList.toggle("l-cate", on);
	if (!on) html.classList.remove("l-photo-view-ui");
}

function fadeWallDom(hide: boolean) {
	gsap.to(WALL_FADE_SEL, {
		opacity: hide ? 0 : 1,
		duration: hide ? 0.45 : 0.55,
		ease: hide ? "power2.in" : "power2.out",
	});
}

export function requestOpenPhotoView(entry: GalleryMeshEntry) {
	if (closing || getPhotoViewOpen()) return;
	openPhotoViewFromFrame(entry.element);
}

export function openPhotoViewFromFrame(frame: HTMLElement) {
	const img = frame.querySelector<HTMLImageElement>(".gl-i");
	if (!img?.dataset.jsSrc) return;

	const category = normalizePhotoCategory(img.dataset.category);
	const cateKey = CATE_ID_TO_KEY[category];
	const images = galleryImages[cateKey];
	const clickedSrc = img.dataset.jsSrc;
	const foundIndex = findImageIndex(images, clickedSrc);
	const activeIndex = foundIndex >= 0 ? foundIndex : 0;
	const heroImage = images[activeIndex] ?? images[0];
	const heroSrc = heroImage
		? imageUrl(heroImage["2048x2048"])
		: clickedSrc;

	gsap.set(frame, { opacity: 0 });

	setPhotoViewState({
		open: true,
		uiReady: false,
		category,
		activeIndex,
		heroSrc,
		sourceFrame: frame,
	});

	setHtmlPhotoView(true);
	lockWallScroll(true);
	fadeWallDom(true);
	onOpenChange?.(true);
}

export function markPhotoViewUiReady() {
	setPhotoViewState({ uiReady: true });
	document.documentElement.classList.add("l-photo-view-ui");
}

export function closePhotoView() {
	if (closing || !getPhotoViewOpen()) return;
	closing = true;
	document.documentElement.classList.remove("l-photo-view-ui");
	setPhotoViewState({ uiReady: false });
}

export function completeClosePhotoView() {
	const { sourceFrame } = getPhotoViewState();
	if (sourceFrame) gsap.set(sourceFrame, { opacity: 1 });
	resetPhotoViewState();
	setHtmlPhotoView(false);
	lockWallScroll(false);
	fadeWallDom(false);
	onOpenChange?.(false);
	closing = false;
}
