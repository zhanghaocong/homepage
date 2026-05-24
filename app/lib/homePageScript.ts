import type { JsScroll } from "~/lib/jsScroll";
import { getPageMode } from "~/lib/modeSwitch";

declare global {
	interface Window {
		selectedCategory?: string | null;
		scrollCategory?: string;
		currentCategory?: string;
	}
}

let root: HTMLElement | null = null;

export function initHomePageScript(container: HTMLElement) {
	root = container;
}

export function resetGridParallax(container: HTMLElement) {
	for (const cell of container.querySelectorAll<HTMLElement>(".gl-img_w")) {
		cell.style.transform = "";
	}
}

export function homePageOnUpdateAfter(scroll: JsScroll) {
	if (!root) return;

	if (getPageMode() === "full") {
		const glInner = Array.from(root.querySelectorAll(".gl-inner"));
		for (const [index, inner] of glInner.entries()) {
			if (index % 4 !== 0) continue;
			const center = inner.querySelectorAll(".gl-img")[2] as HTMLElement | undefined;
			if (!center) continue;
			const rect = center.getBoundingClientRect();
			if (
				(window.innerWidth < 680
					? rect.left < window._w / 2 && rect.right > window._w / 2
					: rect.left > 0 && rect.right < window.innerWidth)
			) {
				const category = center.querySelector(".gl-i")?.getAttribute("data-category");
				if (category) window.scrollCategory = category;
			}
		}
	} else {
		const glInner = root.querySelectorAll(".gl-inner");
		const pow = scroll.power.pow1.value;
		for (const inner of glInner) {
			const cells = inner.querySelectorAll<HTMLElement>(".gl-img_w");
			if (cells[0])
				cells[0].style.transform = `translateY(calc(${pow} * var(--grid) * 2))`;
			if (cells[1])
				cells[1].style.transform = `translateY(calc(${pow} * var(--grid) * 1))`;
			if (cells[3])
				cells[3].style.transform = `translateY(calc(${pow} * var(--grid) * -1))`;
			if (cells[4])
				cells[4].style.transform = `translateY(calc(${pow} * var(--grid) * -2))`;
		}
	}

	window.currentCategory =
		window.selectedCategory || window.scrollCategory || "interior";

	for (const item of root.querySelectorAll<HTMLElement>(".p-home__category--item")) {
		item.classList.toggle(
			"active",
			item.dataset.category === window.currentCategory,
		);
	}
}

export function destroyHomePageScript() {
	root = null;
}
