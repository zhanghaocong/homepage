import gsap from "gsap";
import { syncViewportGlobals } from "~/lib/viewport";

export type ScrollPower = {
	history: number[];
	delta1: number;
	delta2: number;
	max: number;
	pow0: { value: number };
	pow1: {
		value: number;
		duration: number;
		ease: string;
		tween: gsap.core.Tween | null;
	};
	pow2: {
		value: number;
		duration: number;
		ease: string;
		tween: gsap.core.Tween | null;
	};
};

type SectionEntry = {
	el: HTMLElement;
	left: number;
	width: number;
	x: number;
	cx: number;
	progress: number;
	selected: boolean;
	visible: boolean;
};

export type JsScroll = {
	power: ScrollPower;
	delta1: number;
	currentCategory: string;
	raf: () => void;
	onScrollTo: (target: number, duration?: number, delay?: number, ease?: string) => void;
	jumpToCategory: (category: string) => void;
	remeasure: () => void;
	destroy: () => void;
};

type JsScrollOptions = {
	wrap: HTMLElement;
	body: HTMLElement;
	content: HTMLElement;
	speed?: number;
	ease?: number;
	onUpdateAfter?: () => void;
	onResizeAfter?: () => void;
};

const clamp = (v: number, min: number, max: number) =>
	Math.min(Math.max(v, min), max);

const roundToNearest = (t: number, e = 1e-6) =>
	Math.abs(1 - Math.abs(t)) < e ? Math.sign(t) : t;

function getWheelDetail(event: WheelEvent) {
	const deltaX = event.deltaX ? -event.deltaX : 0;
	const deltaY = event.deltaY ? -event.deltaY : 0;
	return deltaX / 120 + deltaY / 120;
}

function createScrollPower(): ScrollPower {
	return {
		history: [],
		delta1: 0,
		delta2: 0,
		max: 3,
		pow0: { value: 0 },
		pow1: { value: 0, duration: 0.2, ease: "power1.out", tween: null },
		pow2: { value: 0, duration: 1, ease: "power1.out", tween: null },
	};
}

function getSpeed(power: ScrollPower, scale = 1) {
	if (power.history.length > 2) {
		power.history.shift();
		power.history.push(power.delta2);
		power.pow0.value =
			Math.min(
				Math.abs((power.history[0] - power.history[2]) * scale),
				power.max,
			) / power.max;
		power.pow1.tween?.kill();
		power.pow1.tween = gsap.to(power.pow1, {
			duration: power.pow1.duration,
			ease: power.pow1.ease,
			value: power.pow0.value,
		});
		power.pow2.tween?.kill();
		power.pow2.tween = gsap.to(power.pow2, {
			duration: power.pow2.duration,
			ease: power.pow2.ease,
			value: power.pow0.value,
		});
	} else {
		power.history.push(power.delta2);
	}
}

function onScrollPowerComplete(power: ScrollPower) {
	power.pow0.value = 0;
	power.pow1.tween?.kill();
	power.pow1.tween = gsap.to(power.pow1, {
		duration: power.pow1.duration,
		value: 0,
	});
	power.pow2.tween?.kill();
	power.pow2.tween = gsap.to(power.pow2, {
		duration: power.pow2.duration,
		value: 0,
	});
}

function getWindowSpan() {
	return window._w ?? window.innerWidth;
}

function minContentWidth() {
	return getWindowSpan() * 1.5;
}

/** Matches photoyoshi CSS: grid*6 below ~1.35 aspect, grid*4 above. */
function isWideAspect() {
	const w = window._w ?? window.innerWidth;
	const h = window._h ?? window.innerHeight;
	return w / h > 3039929748475085 / 2251799813685248;
}

function sectionTotalWidth(content: HTMLElement) {
	const windowSpan = getWindowSpan();
	let totalWidth = 0;
	for (const section of content.querySelectorAll<HTMLElement>(".c-section")) {
		totalWidth += section.offsetWidth || windowSpan;
	}
	return totalWidth;
}

function appendCloneRound(content: HTMLElement) {
	const originals = content.querySelectorAll<HTMLElement>(
		".c-section:not(.c-clone)",
	);
	if (originals.length === 0) return false;

	for (const section of originals) {
		const clone = section.cloneNode(true) as HTMLElement;
		clone.classList.add("c-clone");
		content.appendChild(clone);
	}
	return true;
}

function ensureContentWideEnough(content: HTMLElement) {
	const target = minContentWidth();
	let guard = 0;
	while (sectionTotalWidth(content) <= target && guard < 24) {
		if (!appendCloneRound(content)) break;
		guard++;
	}
	return guard > 0;
}

function cloneSectionsUntilWideEnough(content: HTMLElement) {
	for (const section of content.querySelectorAll(".c-section.c-clone")) {
		section.remove();
	}
	ensureContentWideEnough(content);
}

function resetCellTransforms(content: HTMLElement) {
	for (const cell of content.querySelectorAll<HTMLElement>(".gl-img_w")) {
		cell.style.transform = "";
	}
}

function clearSectionMeasureStyles(content: HTMLElement) {
	for (const el of content.querySelectorAll<HTMLElement>(".c-section")) {
		el.style.width = "";
		el.style.height = "";
		el.style.flexShrink = "";
	}
}

export function createJsScroll({
	wrap,
	body: _body,
	content,
	speed = 80,
	ease = 0.125,
	onUpdateAfter,
	onResizeAfter,
}: JsScrollOptions): JsScroll {
	const power = createScrollPower();
	let delta1 = 0;
	let scrollX = 0;
	let scrollLeft = 0;
	let ready = false;
	let currentCategory = "interior";
	let scrollToTween: gsap.core.Tween | null = null;
	const sections: SectionEntry[] = [];

	const scrollbar = document.querySelector<HTMLElement>(".c-scrollbar");
	const thumb = document.querySelector<HTMLElement>(".c-thumb");
	const thumbBefore = thumb?.querySelector<HTMLElement>(".c-pivot");
	const thumbAfter = thumb?.querySelectorAll<HTMLElement>(".c-pivot")[1];

	if (scrollbar) scrollbar.dataset.dir = "hr";

	const MEASURE_CONTENT_WIDTH = "99999px";

	let lastWideAspect = isWideAspect();

	const syncSectionsFromDom = () => {
		const els = content.querySelectorAll<HTMLElement>(".c-section");
		sections.length = 0;
		for (const el of els) {
			sections.push({
				el,
				left: 0,
				width: 0,
				x: 0,
				cx: 0,
				progress: 0,
				selected: false,
				visible: true,
			});
		}
	};

	/** Mirrors photoyoshi scroll onResize measure (in-place, viewport rects). */
	const measure = () => {
		for (const entry of sections) {
			entry.el.style.width = "auto";
			entry.el.style.height = "auto";
			entry.el.style.flexShrink = "0";
			entry.el.style.transform = "translate3d(0px, 0px, 0px)";
		}
		content.style.width = MEASURE_CONTENT_WIDTH;

		let totalWidth = 0;
		for (const entry of sections) {
			const rect = entry.el.getBoundingClientRect();
			entry.width = entry.el.offsetWidth || rect.width;
			entry.left = rect.left;
			totalWidth += entry.width;
		}
		content.style.width = `${totalWidth}px`;

		for (const entry of sections) {
			entry.el.style.transform = "translate3d(0px, 0px, 0px)";
			const rect = entry.el.getBoundingClientRect();
			entry.width = entry.el.offsetWidth || rect.width;
			entry.left = rect.left;
		}

		ready = sections.length > 0;
	};

	const contentWidth = () => {
		let total = 0;
		for (const entry of sections) total += entry.width;
		return total || content.scrollWidth;
	};

	const layoutInit = () => {
		syncSectionsFromDom();
		cloneSectionsUntilWideEnough(content);
		syncSectionsFromDom();
		measure();
		let guard = 0;
		while (contentWidth() <= minContentWidth() && guard < 24) {
			appendCloneRound(content);
			syncSectionsFromDom();
			measure();
			guard++;
		}
		clearSectionMeasureStyles(content);
		resetCellTransforms(content);
	};

	layoutInit();

	const getThreshold = () => {
		const w = getWindowSpan();
		return w < 768 ? w * 0.5 : w / 2;
	};

	let completeTimer: ReturnType<typeof window.setTimeout> | null = null;
	let resizeRafId = 0;
	const completeWait = 30;

	const clearScrollTimers = () => {
		if (completeTimer !== null) {
			window.clearTimeout(completeTimer);
			completeTimer = null;
		}
	};

	const scheduleScrollComplete = () => {
		clearScrollTimers();
		completeTimer = window.setTimeout(() => {
			onScrollPowerComplete(power);
		}, completeWait);
	};

	const applyScrollImpulse = (detail: number) => {
		power.delta1 += Math.abs(detail);
		power.delta2 += Math.abs(detail);
		getSpeed(power, 1);
		scheduleScrollComplete();
	};

	const onWheel = (event: WheelEvent) => {
		event.preventDefault();
		clearScrollTimers();
		const detail = getWheelDetail(event);
		delta1 += -detail * speed;
		applyScrollImpulse(detail);
	};

	let dragging = false;
	let dragStartX = 0;
	let dragStartDelta = 0;

	const onPointerDown = (event: PointerEvent) => {
		if ((event.target as Element).closest("a, button, input, label")) return;
		dragging = true;
		dragStartX = event.clientX;
		dragStartDelta = delta1;
		wrap.setPointerCapture(event.pointerId);
		power.pow0.value = 0;
		clearScrollTimers();
		scrollToTween?.kill();
	};

	const onPointerMove = (event: PointerEvent) => {
		if (!dragging) return;
		const nextDelta = dragStartDelta - (event.clientX - dragStartX) * 1.8;
		const dragDetail = Math.abs(nextDelta - delta1) / speed;
		delta1 = nextDelta;
		if (dragDetail > 0) applyScrollImpulse(dragDetail);
	};

	const onPointerUp = () => {
		dragging = false;
		scheduleScrollComplete();
	};

	window.addEventListener("wheel", onWheel, { passive: false });
	wrap.addEventListener("pointerdown", onPointerDown);
	wrap.addEventListener("pointermove", onPointerMove);
	wrap.addEventListener("pointerup", onPointerUp);
	wrap.addEventListener("pointercancel", onPointerUp);

	const raf = () => {
		if (!ready) return;

		scrollX += (delta1 - scrollX) * ease;
		if (Math.abs(scrollX) < 1e-3) scrollX = 0;

		const cw = contentWidth();
		scrollLeft = cw > 0 ? scrollX % cw : 0;

		const position = cw > 0 ? scrollLeft / cw : 0;
		const threshold = getThreshold();
		const viewportW = getWindowSpan();
		let activeSet = false;

		for (const entry of sections) {
			entry.x = -scrollLeft;
			if (entry.x < -entry.width - entry.left - threshold) {
				entry.x += cw;
			}
			if (entry.left + entry.x - viewportW > threshold) {
				entry.x -= cw;
			}

			const iLeft = entry.left + entry.x;
			const iRight = iLeft + entry.width;
			const inView =
				iRight > -threshold &&
				iLeft - entry.width < viewportW + threshold;

			entry.cx = clamp(
				(iLeft + viewportW / 2) / viewportW - 0.5,
				-1,
				1,
			);

			if (Math.abs(entry.cx) < 0.5 && !activeSet) {
				entry.selected = true;
				activeSet = true;
				const cat = entry.el.dataset.category;
				if (cat) {
					currentCategory = cat;
					(window as Window & { scrollCategory?: string }).scrollCategory =
						cat;
				}
			} else {
				entry.selected = false;
			}

			if (inView) {
				entry.progress =
					Math.abs(iLeft / viewportW) < 1e-3
						? 0
						: roundToNearest(iLeft / viewportW);
				entry.el.style.transform = `translate3d(${entry.x}px, 0px, 0px)`;
				entry.visible = true;
			} else {
				entry.el.style.transform = "translate3d(9999px, 0px, 0px)";
				entry.visible = false;
			}
		}

		if (scrollbar && thumb && thumbBefore && thumbAfter) {
			const trackWidth = scrollbar.getBoundingClientRect().width;
			const progressPx = position * trackWidth;
			thumbBefore.style.transform = `translate3d(${progressPx - trackWidth}px, 0, 0)`;
			thumbAfter.style.transform = `translate3d(${progressPx}px, 0, 0)`;
		}

		onUpdateAfter?.();
	};

	const remeasure = () => {
		syncViewportGlobals();
		void content.offsetWidth;

		resetCellTransforms(content);

		const nowWide = isWideAspect();
		if (nowWide !== lastWideAspect) {
			cloneSectionsUntilWideEnough(content);
			lastWideAspect = nowWide;
		} else {
			ensureContentWideEnough(content);
		}
		resetCellTransforms(content);

		syncSectionsFromDom();
		measure();

		let guard = 0;
		while (contentWidth() <= minContentWidth() && guard < 24) {
			appendCloneRound(content);
			syncSectionsFromDom();
			measure();
			guard++;
		}

		clearSectionMeasureStyles(content);
		resetCellTransforms(content);

		scrollX = delta1;
		raf();
		onResizeAfter?.();
		requestAnimationFrame(() => {
			scrollX = delta1;
			raf();
			onResizeAfter?.();
		});
	};

	const scheduleRemeasure = () => {
		syncViewportGlobals();
		if (resizeRafId !== 0) return;
		resizeRafId = requestAnimationFrame(() => {
			resizeRafId = 0;
			remeasure();
		});
	};

	const onResize = () => scheduleRemeasure();
	window.addEventListener("resize", onResize);

	const resizeObserver =
		typeof ResizeObserver !== "undefined"
			? new ResizeObserver(() => scheduleRemeasure())
			: null;
	resizeObserver?.observe(wrap);

	const onScrollTo = (
		target: number,
		duration = 2,
		delay = 0,
		easeName = "power2.out",
	) => {
		scrollToTween?.kill();
		const proxy = { value: delta1 };
		scrollToTween = gsap.to(proxy, {
			value: target,
			duration,
			delay,
			ease: easeName,
			onUpdate: () => {
				delta1 = proxy.value;
			},
		});
	};

	const jumpToCategory = (category: string) => {
		const entry = sections.find(
			(s) =>
				!s.el.classList.contains("c-clone") &&
				s.el.dataset.category === category,
		);
		if (!entry) return;
		const viewportW = getWindowSpan();
		onScrollTo(entry.left - (viewportW - entry.width) / 2, 2);
	};

	const destroy = () => {
		clearScrollTimers();
		if (resizeRafId !== 0) {
			cancelAnimationFrame(resizeRafId);
			resizeRafId = 0;
		}
		resizeObserver?.disconnect();
		window.removeEventListener("wheel", onWheel);
		window.removeEventListener("resize", onResize);
		wrap.removeEventListener("pointerdown", onPointerDown);
		wrap.removeEventListener("pointermove", onPointerMove);
		wrap.removeEventListener("pointerup", onPointerUp);
		wrap.removeEventListener("pointercancel", onPointerUp);
		power.pow1.tween?.kill();
		power.pow2.tween?.kill();
		scrollToTween?.kill();
	};

	return {
		power,
		get delta1() {
			return delta1;
		},
		get currentCategory() {
			return currentCategory;
		},
		raf,
		onScrollTo,
		jumpToCategory,
		remeasure,
		destroy,
	};
}
