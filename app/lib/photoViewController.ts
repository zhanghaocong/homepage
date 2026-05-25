import gsap from "gsap";
import {
	CATE_ID_TO_KEY,
	findImageIndex,
	getPhotoViewState,
	normalizePhotoCategory,
	rectFromDomRect,
	resetPhotoViewState,
	setPhotoViewState,
	type PhotoViewRect,
} from "~/lib/photoViewStore";
import { galleryImages, imageUrl } from "~/data/gallery";
import type { JsScroll } from "~/lib/jsScroll";

let scrollRef: JsScroll | null = null;
let wallWrap: HTMLElement | null = null;
let onOpenChange: ((open: boolean) => void) | null = null;
let flyEl: HTMLElement | null = null;
let flyTween: gsap.core.Tween | null = null;
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
	destroyFlyElement();
}

function resolveWallPhotoFrame(target: Element | null, root: HTMLElement) {
	if (!target) return null;
	const frame =
		target.closest<HTMLElement>(".gl-img") ??
		target.closest<HTMLElement>(".gl-img_w")?.querySelector<HTMLElement>(
			".gl-img",
		);
	if (!frame || !root.contains(frame)) return null;
	return frame;
}

function frameAtPoint(x: number, y: number, root: HTMLElement) {
	for (const el of document.elementsFromPoint(x, y)) {
		const frame = resolveWallPhotoFrame(el, root);
		if (frame) return frame;
	}
	return null;
}

export function bindWallPhotoClicks(root: HTMLElement, wrap?: HTMLElement | null) {
	const onClick = (event: MouseEvent) => {
		if (closing || getPhotoViewOpen()) return;
		if (event.button !== 0) return;
		const frame =
			resolveWallPhotoFrame(event.target as Element, root) ??
			frameAtPoint(event.clientX, event.clientY, root);
		if (!frame) return;
		event.preventDefault();
		event.stopPropagation();
		openPhotoViewFromFrame(frame);
	};

	const captureRoot = wrap ?? root;
	captureRoot.addEventListener("click", onClick, true);
	return () => captureRoot.removeEventListener("click", onClick, true);
}

export function getPhotoViewOpen() {
	return document.documentElement.classList.contains("l-photo-view");
}

function lockWallScroll(locked: boolean) {
	if (wallWrap) {
		wallWrap.classList.toggle("is-photo-view-locked", locked);
	}
	scrollRef?.setInputEnabled(!locked);
}

function setHtmlPhotoView(on: boolean) {
	const html = document.documentElement;
	html.classList.toggle("l-photo-view", on);
	html.classList.toggle("l-cate", on);
	if (!on) html.classList.remove("l-photo-view-ui");
}

function fadeWall(hide: boolean) {
	gsap.to(WALL_FADE_SEL, {
		opacity: hide ? 0 : 1,
		duration: hide ? 0.45 : 0.55,
		ease: hide ? "power2.in" : "power2.out",
	});
}

function destroyFlyElement() {
	flyTween?.kill();
	if (flyEl) {
		gsap.killTweensOf(flyEl);
		flyEl.remove();
		flyEl = null;
	}
}

/** Wall .gl-i is opacity:0 in photoyoshi CSS — photos are WebGL-only. Build a visible fly layer. */
function createFlyLayer(src: string, alt = "") {
	const fly = document.createElement("div");
	fly.className = "p-photo-view__fly";
	const img = document.createElement("img");
	img.className = "p-photo-view__fly-img";
	img.src = src;
	img.alt = alt;
	img.draggable = false;
	fly.appendChild(img);
	return fly;
}

function getImageAspect(img: HTMLImageElement) {
	const dw = Number(img.dataset.aspectW);
	const dh = Number(img.dataset.aspectH);
	if (dw > 0 && dh > 0) return dw / dh;
	if (img.naturalWidth > 0 && img.naturalHeight > 0) {
		return img.naturalWidth / img.naturalHeight;
	}
	return 1;
}

/** Visible size comes from .gl-img frame (WebGL sync target), not hidden .gl-i. */
function captureFlyRect(frame: HTMLElement, img: HTMLImageElement): PhotoViewRect {
	const frameRect = frame.getBoundingClientRect();
	if (frameRect.width >= 8 && frameRect.height >= 8) {
		return rectFromDomRect(frameRect);
	}

	const cell = frame.parentElement?.getBoundingClientRect();
	const aspect = getImageAspect(img);
	if (cell && cell.width > 8) {
		let width = cell.width * 0.65;
		let height = cell.height * 0.65;
		if (width / height > aspect) width = height * aspect;
		else height = width / aspect;
		return {
			left: cell.left + (cell.width - width) / 2,
			top: cell.top + (cell.height - height) / 2,
			width,
			height,
		};
	}

	const vh = window._h ?? window.innerHeight;
	const vw = window._w ?? window.innerWidth;
	const height = vh * 0.2;
	const width = height * aspect;
	return {
		left: (vw - width) / 2,
		top: (vh - height) / 2,
		width,
		height,
	};
}

function getHeroTargetSize(img: HTMLImageElement) {
	const aspect = getImageAspect(img);
	const vh = window._h ?? window.innerHeight;
	const vw = window._w ?? window.innerWidth;
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

function centerRect(img: HTMLImageElement): PhotoViewRect {
	const { width, height } = getHeroTargetSize(img);
	const vw = window._w ?? window.innerWidth;
	const vh = window._h ?? window.innerHeight;
	return {
		left: (vw - width) / 2,
		top: (vh - height) / 2,
		width,
		height,
	};
}

function mountFlyAtRect(fly: HTMLElement, rect: PhotoViewRect) {
	document.body.appendChild(fly);
	gsap.set(fly, {
		position: "fixed",
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
		margin: 0,
		zIndex: 300,
		overflow: "hidden",
		opacity: 1,
		transform: "none",
	});
}

function animateFlyTo(
	fly: HTMLElement,
	to: PhotoViewRect,
	duration: number,
	ease: string,
	onComplete?: () => void,
) {
	flyTween?.kill();
	flyTween = gsap.to(fly, {
		left: to.left,
		top: to.top,
		width: to.width,
		height: to.height,
		duration,
		ease,
		onComplete,
	});
}

export function updateFlyHeroSrc(src: string) {
	const img = flyEl?.querySelector<HTMLImageElement>(".p-photo-view__fly-img");
	if (!img) return;
	gsap.to(img, {
		opacity: 0,
		duration: 0.15,
		onComplete: () => {
			img.src = src;
			gsap.to(img, { opacity: 1, duration: 0.25 });
		},
	});
}

export function animateCategoryEnter(root: HTMLElement) {
	const items = root.querySelectorAll<HTMLElement>(".p-photo-view .to");
	gsap.fromTo(
		items,
		{ opacity: 0, x: "-8vw" },
		{
			opacity: 1,
			x: 0,
			duration: 0.6,
			stagger: 0.08,
			delay: 0.1,
			ease: "power3.out",
		},
	);
}

export function openPhotoViewFromFrame(frame: HTMLElement) {
	const img = frame.querySelector<HTMLImageElement>(".gl-i");
	if (!img?.dataset.jsSrc) return;

	const fromRect = captureFlyRect(frame, img);
	const clickedSrc = img.dataset.jsSrc;

	const category = normalizePhotoCategory(img.dataset.category);
	const cateKey = CATE_ID_TO_KEY[category];
	const images = galleryImages[cateKey];
	const foundIndex = findImageIndex(images, clickedSrc);
	const activeIndex = foundIndex >= 0 ? foundIndex : 0;
	const heroImage = images[activeIndex] ?? images[0];
	const heroSrc = heroImage
		? imageUrl(heroImage["2048x2048"])
		: clickedSrc;

	destroyFlyElement();
	const fly = createFlyLayer(clickedSrc);
	flyEl = fly;

	gsap.set(frame, { opacity: 0 });

	setPhotoViewState({
		open: true,
		uiReady: false,
		category,
		activeIndex,
		heroSrc,
		sourceFrame: frame,
		fromRect,
	});

	setHtmlPhotoView(true);
	lockWallScroll(true);
	fadeWall(true);
	onOpenChange?.(true);

	mountFlyAtRect(fly, fromRect);
	const target = centerRect(img);

	animateFlyTo(fly, target, 1.2, "power4.inOut", () => {
		setPhotoViewState({ uiReady: true });
		document.documentElement.classList.add("l-photo-view-ui");
	});
}

export function closePhotoView() {
	if (closing || !getPhotoViewOpen()) return;
	closing = true;

	const { sourceFrame, fromRect } = getPhotoViewState();
	document.documentElement.classList.remove("l-photo-view-ui");
	setPhotoViewState({ uiReady: false });

	const finish = () => {
		if (sourceFrame) gsap.set(sourceFrame, { opacity: 1 });
		destroyFlyElement();
		gsap.set(".p-photo-view", { opacity: 1 });
		resetPhotoViewState();
		setHtmlPhotoView(false);
		lockWallScroll(false);
		fadeWall(false);
		onOpenChange?.(false);
		closing = false;
	};

	let targetRect: PhotoViewRect | null = fromRect;
	if (sourceFrame?.isConnected) {
		targetRect = captureFlyRect(
			sourceFrame,
			sourceFrame.querySelector(".gl-i")!,
		);
	}

	if (flyEl && targetRect) {
		gsap.to(".p-photo-view", {
			opacity: 0,
			duration: 0.25,
			ease: "power2.in",
		});
		animateFlyTo(flyEl, targetRect, 0.9, "power4.inOut", finish);
	} else {
		finish();
	}
}
