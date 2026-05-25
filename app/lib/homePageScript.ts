import type { JsScroll } from "~/lib/jsScroll";

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

export function homePageOnUpdateAfter(_scroll: JsScroll) {
	if (!root) return;

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
