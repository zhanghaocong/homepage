import gsap from "gsap";
import { galleryParams } from "~/lib/galleryParams";
import type { JsScroll } from "~/lib/jsScroll";

declare global {
	interface Window {
		selectedCategory?: string | null;
		scrollCategory?: string;
		currentCategory?: string;
	}
}

type Mode = "grid" | "full";

let childElements: NodeListOf<Element>[] = [];
let modeGridBtn: HTMLButtonElement | null = null;
let modeFullBtn: HTMLButtonElement | null = null;
let jsScroll: JsScroll | null = null;
let pageMode: Mode = "grid";

function killAllTweens(elements: NodeListOf<Element> | Element[]) {
	for (const el of elements) gsap.killTweensOf(el);
}

function isMobile() {
	return window.innerWidth < 680;
}

function onFull(scrollDistance = isMobile() ? 4.5 : 2.5) {
	pageMode = "full";
	document.documentElement.dataset.mode = "full";
	document.documentElement.classList.remove("l-light");
	document.documentElement.classList.add("l-dark");

	setTimeout(() => {
		if (jsScroll) {
			jsScroll.onScrollTo(
				jsScroll.delta1 + window._w * scrollDistance,
				2,
			);
		}
	}, 50);

	gsap.to(galleryParams, { mode: 1, duration: 2, delay: 0.5 });
	gsap.to(".p-home__category--title", { opacity: 0, duration: 0.3 });
	gsap.to(".p-home__category--title", {
		opacity: 1,
		duration: 0.5,
		delay: 1.25,
	});

	childElements.forEach((items, index) => {
		killAllTweens(items);
		const center = items[2] as HTMLElement;
		if (index % 4 === 0) {
			if (isMobile()) {
				if (window._w > window._h) {
					gsap.to(center, { width: "49vw", duration: 2, ease: "power3.out" });
					gsap.to(center, {
						height: "150vh",
						duration: 2,
						ease: "power3.inOut",
					});
				} else {
					gsap.to(center, {
						width: "calc(100vw - var(--grid))",
						duration: 2,
						ease: "power4.out",
					});
					gsap.to(center, {
						height: "120vh",
						duration: 2,
						ease: "power2.inOut",
					});
				}
			} else {
				gsap.to(center, { width: "49vw", duration: 2, ease: "power3.out" });
				gsap.to(center, {
					height: "150vh",
					duration: 2,
					ease: "power3.inOut",
				});
			}
		} else {
			gsap.to(center, { width: 0, duration: 0.6, ease: "power4.out" });
		}

		const collapse = (el: Element, delay: number, duration = 0.5) => {
			const node = el as HTMLElement;
			const rect = node.getBoundingClientRect();
			const y =
				-0.5 *
				(rect.top +
					node.clientHeight -
					(items[0] === el ? 0 : items[4] === el ? window._h : 0));
			gsap.to(node, {
				height: 0,
				y,
				duration,
				ease: "power2.out",
				delay,
			});
		};

		collapse(items[0], 0, 0.4);
		collapse(items[1], 0.1);
		collapse(items[3], 0.1);
		collapse(items[4], 0, 0.4);
	});

	const tl = gsap.timeline();
	tl.to(galleryParams, {
		modeChangePow: 1,
		duration: 0.75,
		ease: "power1.out",
	});
	tl.to(galleryParams, {
		modeChangePow: 0,
		duration: 2.5,
		ease: "power2.out",
	});
}

function onGrid(scrollDistance = isMobile() ? 4.5 : 2.5) {
	pageMode = "grid";
	document.documentElement.dataset.mode = "grid";
	document.documentElement.classList.remove("l-dark");
	document.documentElement.classList.add("l-light");

	gsap.to(galleryParams, { mode: 0, duration: 1 });
	gsap.to(".p-home__category--title", { opacity: 0, duration: 0.3 });
	gsap.to(".p-home__category--title", {
		opacity: 1,
		duration: 0.5,
		delay: 1.25,
	});

	setTimeout(() => {
		if (jsScroll) {
			jsScroll.onScrollTo(
				jsScroll.delta1 + window._w * scrollDistance,
				3,
				0,
				"expo.out",
			);
		}
	}, 50);

	childElements.forEach((items) => {
		killAllTweens(items);
		for (let i = 0; i < items.length; i++) {
			const node = items[i] as HTMLElement;
			const img = node.querySelector(".gl-i");
			const rect = img?.getBoundingClientRect();
			const landscape = rect ? rect.width / rect.height > 1 : true;

			if (i === 2) {
				gsap.to(node, {
					width: landscape ? "100%" : "65%",
					height: landscape ? "65%" : "100%",
					duration: 1.5,
					ease: "power4.out",
				});
			} else {
				gsap.to(node, { width: "", height: "", y: 0, duration: 1.2, ease: "power2.out" });
			}
		}
	});

	const tl = gsap.timeline();
	tl.to(galleryParams, {
		modeChangePow: 1,
		duration: 0.75,
		ease: "power1.out",
	});
	tl.to(galleryParams, {
		modeChangePow: 0,
		duration: 1.5,
		ease: "power1.out",
	});
}

export function initModeSwitch(root: HTMLElement, scroll: JsScroll) {
	jsScroll = scroll;
	pageMode = "grid";
	document.documentElement.dataset.mode = "grid";

	const glInner = root.querySelectorAll(
		".c-section:not(.c-clone) .gl-inner",
	);
	childElements = Array.from(glInner).map((inner) =>
		inner.querySelectorAll(".gl-img"),
	);

	modeGridBtn = root.querySelector(".js-modeGrid");
	modeFullBtn = root.querySelector(".js-modeFull");

	modeGridBtn?.addEventListener("click", () => {
		if (pageMode !== "grid") onGrid();
	});
	modeFullBtn?.addEventListener("click", () => {
		if (pageMode !== "full") onFull();
	});
}

export function destroyModeSwitch() {
	modeGridBtn?.replaceWith(modeGridBtn.cloneNode(true));
	modeFullBtn?.replaceWith(modeFullBtn.cloneNode(true));
	jsScroll = null;
	childElements = [];
}

export function getPageMode() {
	return pageMode;
}
