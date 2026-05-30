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
import { getFrameSpecById } from "~/lib/galleryLayoutStore";
import { rectFromLayoutId } from "~/lib/photoViewLayout";
import type { JsScroll } from "~/lib/jsScroll";

let scrollRef: JsScroll | null = null;
let wallWrap: HTMLElement | null = null;
let shellRef: HTMLElement | null = null;
let onOpenChange: ((open: boolean) => void) | null = null;
let onAfterClose: (() => void) | null = null;

/**
 * Do NOT fade `.js-page__cover` — it is a #222 fullscreen layer at z-index 150;
 * setting opacity to 1 after photo view covers the WebGL canvas and looks like a black screen.
 */
const WALL_FADE_SEL = ".p-home .c-content";
const PAGE_COVER_SEL = ".p-home .js-page__cover";

export function registerPhotoViewContext(
	scroll: JsScroll,
	wrap: HTMLElement,
	onOpen: (open: boolean) => void,
	afterClose?: () => void,
	shell?: HTMLElement | null,
) {
	scrollRef = scroll;
	wallWrap = wrap;
	shellRef = shell ?? null;
	onOpenChange = onOpen;
	onAfterClose = afterClose ?? null;
}

export function unregisterPhotoViewContext() {
	scrollRef?.setInputEnabled(true);
	scrollRef = null;
	wallWrap = null;
	shellRef = null;
	onOpenChange = null;
	onAfterClose = null;
}

export function getPhotoViewShell() {
	return shellRef;
}

export function getPhotoViewOpen() {
	return getPhotoViewState().open;
}

export function isPhotoViewClosing() {
	return getPhotoViewState().closing;
}

export function getPhotoViewScroll() {
	return scrollRef;
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
	gsap.killTweensOf(PAGE_COVER_SEL);
	gsap.set(PAGE_COVER_SEL, { opacity: 0 });
	if (!hide) {
		gsap.killTweensOf(WALL_FADE_SEL);
		gsap.set(WALL_FADE_SEL, { opacity: 1 });
	}
	gsap.to(WALL_FADE_SEL, {
		opacity: hide ? 0 : 1,
		duration: hide ? 0.45 : 0.55,
		ease: hide ? "power2.in" : "power2.out",
	});
}

/** Keep the fixed R3F canvas visible (splash / fades must not leave it at opacity 0). */
function ensureGalleryCanvasVisible() {
	gsap.set(".js-canvas__wrap canvas", { opacity: 1 });
}

export function requestOpenPhotoView(layoutId: string) {
	if (isPhotoViewClosing() || getPhotoViewOpen()) return;
	openPhotoViewFromLayoutId(layoutId);
}

/** @deprecated Use `openPhotoViewFromLayoutId` — mesh only supplies layout id. */
export function openPhotoViewFromMesh(entry: GalleryMeshEntry) {
	openPhotoViewFromLayoutId(entry.layoutId);
}

export function openPhotoViewFromLayoutId(layoutId: string) {
	const spec = getFrameSpecById(layoutId);
	if (!spec) return;

	const category = normalizePhotoCategory(spec.category);
	const cateKey = CATE_ID_TO_KEY[category];
	const images = galleryImages[cateKey];
	const clickedSrc = spec.jsSrc;
	const foundIndex = findImageIndex(images, clickedSrc);
	const activeIndex = foundIndex >= 0 ? foundIndex : 0;
	const heroImage = images[activeIndex] ?? images[0];
	const heroSrc = heroImage
		? imageUrl(heroImage["2048x2048"])
		: clickedSrc;

	setPhotoViewState({
		open: true,
		closing: false,
		uiReady: false,
		category,
		activeIndex,
		heroSrc,
		sourceLayoutId: layoutId,
		fromRect: rectFromLayoutId(layoutId),
	});

	setHtmlPhotoView(true);
	lockWallScroll(true);
	ensureGalleryCanvasVisible();
	fadeWallDom(true);
	onOpenChange?.(true);
}

export function markPhotoViewUiReady() {
	setPhotoViewState({ uiReady: true });
	document.documentElement.classList.add("l-photo-view-ui");
}

export function closePhotoView() {
	if (isPhotoViewClosing() || !getPhotoViewOpen()) return;
	document.documentElement.classList.remove("l-photo-view-ui");
	setPhotoViewState({ uiReady: false, closing: true });
}

/** Fade scroll wall back in before homepage-style gather/reveal. */
export function preparePhotoViewWallReveal() {
	ensureGalleryCanvasVisible();
	fadeWallDom(false);
}

export function completeClosePhotoView() {
	resetPhotoViewState();
	setHtmlPhotoView(false);
	lockWallScroll(false);
	gsap.set(PAGE_COVER_SEL, { opacity: 0 });
	ensureGalleryCanvasVisible();
	fadeWallDom(false);
	onOpenChange?.(false);
	onAfterClose?.();
}
