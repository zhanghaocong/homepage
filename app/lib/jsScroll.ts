import gsap from "gsap";

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
};

const clamp = (v: number, min: number, max: number) =>
	Math.min(Math.max(v, min), max);

const positiveMod = (n: number, m: number) => ((n % m) + m) % m;

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

function cloneSectionsUntilWideEnough(content: HTMLElement) {
	const windowSpan = window.innerWidth;
	let totalWidth = 0;
	const originals = content.querySelectorAll<HTMLElement>(
		".c-section:not(.c-clone)",
	);

	for (const section of content.querySelectorAll(".c-section.c-clone")) {
		section.remove();
	}

	const measureTotal = () => {
		totalWidth = 0;
		for (const section of content.querySelectorAll<HTMLElement>(".c-section")) {
			totalWidth += section.offsetWidth || windowSpan;
		}
	};

	measureTotal();
	while (totalWidth <= windowSpan * 1.5) {
		for (const section of originals) {
			const clone = section.cloneNode(true) as HTMLElement;
			clone.classList.add("c-clone");
			content.appendChild(clone);
		}
		measureTotal();
		if (originals.length === 0) break;
	}
}

export function createJsScroll({
	wrap,
	body: _body,
	content,
	speed = 80,
	ease = 0.125,
	onUpdateAfter,
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

	const measure = () => {
		sections.length = 0;
		for (const el of content.querySelectorAll<HTMLElement>(".c-section")) {
			el.style.transform = "translate3d(0px, 0px, 0px)";
		}

		let totalWidth = 0;
		for (const el of content.querySelectorAll<HTMLElement>(".c-section")) {
			const rect = el.getBoundingClientRect();
			sections.push({
				el,
				left: rect.left,
				width: rect.width,
				x: 0,
				cx: 0,
				progress: 0,
				selected: false,
				visible: true,
			});
			totalWidth += rect.width;
		}

		content.style.width = `${totalWidth}px`;
		ready = sections.length > 0;
	};

	const remeasure = () => {
		cloneSectionsUntilWideEnough(content);
		measure();
		scrollX = delta1;
	};

	cloneSectionsUntilWideEnough(content);
	measure();

	const contentWidth = () => {
		let total = 0;
		for (const entry of sections) total += entry.width;
		return total || content.scrollWidth;
	};
	const threshold =
		window.innerWidth < 768 ? window.innerWidth * 0.5 : window.innerWidth / 2;

	let completeTimer: ReturnType<typeof window.setTimeout> | null = null;
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

	const onResize = () => {
		remeasure();
	};
	window.addEventListener("resize", onResize);

	const raf = () => {
		if (!ready) return;

		scrollX += (delta1 - scrollX) * ease;
		if (Math.abs(scrollX) < 1e-3) scrollX = 0;

		const cw = contentWidth();
		scrollLeft = positiveMod(scrollX, cw || 1);

		const position = cw > 0 ? scrollLeft / cw : 0;
		let activeSet = false;

		for (const entry of sections) {
			entry.x = -scrollLeft;
			if (entry.x < -entry.width - entry.left - threshold) {
				entry.x += cw;
			}
			if (entry.left + entry.x - window.innerWidth > threshold) {
				entry.x -= cw;
			}

			const iLeft = entry.x + entry.left;
			const iRight = iLeft + entry.width;
			const inView =
				iRight > -threshold &&
				iLeft - entry.width < window.innerWidth + threshold;

			entry.cx = clamp(
				(iLeft + window.innerWidth / 2) / window.innerWidth - 0.5,
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
					Math.abs(iLeft / window.innerWidth) < 1e-3
						? 0
						: roundToNearest(iLeft / window.innerWidth);
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
		onScrollTo(entry.left - (window.innerWidth - entry.width) / 2, 2);
	};

	const destroy = () => {
		clearScrollTimers();
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
