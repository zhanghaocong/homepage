import gsap from "gsap";
import type { CateImage } from "~/data/gallery";
import { imageUrl } from "~/data/gallery";

/** Mirrors photoyoshi p-cate thumbnail list scroll + active detection. */
export class PhotoViewThumbList {
	private readonly listEl: HTMLElement;
	private readonly wrapEl: HTMLElement;
	private readonly wraps: HTMLElement[];
	private readonly onActiveChange: (index: number) => void;
	private scrollRaf = 0;
	private destroyed = false;

	constructor(
		root: HTMLElement,
		images: CateImage[],
		activeIndex: number,
		onActiveChange: (index: number) => void,
	) {
		this.onActiveChange = onActiveChange;
		this.listEl = root.querySelector<HTMLElement>(".p-photo-view__lists")!;
		this.wrapEl = root.querySelector<HTMLElement>(".p-photo-view__scroll")!;
		this.wraps = this.buildThumbs(images);
		this.setActive(activeIndex, false);
		this.bindScroll();
		requestAnimationFrame(() => this.scrollToIndex(activeIndex, false));
	}

	destroy() {
		this.destroyed = true;
		cancelAnimationFrame(this.scrollRaf);
		this.wrapEl.removeEventListener("scroll", this.onScroll);
		gsap.killTweensOf(this.wraps);
	}

	scrollToIndex(index: number, smooth = true) {
		const wrap = this.wraps[index];
		if (!wrap) return;
		const listRect = this.wrapEl.getBoundingClientRect();
		const itemRect = wrap.getBoundingClientRect();
		const target =
			this.wrapEl.scrollTop +
			(itemRect.top - listRect.top) +
			itemRect.height / 2 -
			listRect.height / 2;
		this.wrapEl.scrollTo({
			top: Math.max(0, target),
			behavior: smooth ? "smooth" : "auto",
		});
	}

	private buildThumbs(images: CateImage[]) {
		this.listEl.innerHTML = "";
		const wraps: HTMLElement[] = [];

		for (const img of images) {
			const isLandscape = img.width > img.height;
			const wrap = document.createElement("div");
			wrap.className = `js-img__wrap js-img__bg p-cate__tmb-wrap ${isLandscape ? "p-cate__tmb-hr" : "p-cate__tmb-vr"}`;
			wrap.style.aspectRatio = `${img.width} / ${img.height}`;

			const el = document.createElement("div");
			el.className = "js-img js-bg u-br p-cate__tmb-img is-loaded";
			const src = imageUrl(img.medium);
			el.setAttribute("src", src);
			el.style.aspectRatio = `${img.width} / ${img.height}`;
			el.style.backgroundImage = `url("${src}")`;

			wrap.appendChild(el);
			wrap.addEventListener("click", () => {
				const index = wraps.indexOf(wrap);
				if (index >= 0) this.scrollToIndex(index);
			});
			this.listEl.appendChild(wrap);
			wraps.push(wrap);
		}

		return wraps;
	}

	private bindScroll() {
		this.wrapEl.addEventListener("scroll", this.onScroll, { passive: true });
		this.onScroll();
	}

	private onScroll = () => {
		cancelAnimationFrame(this.scrollRaf);
		this.scrollRaf = requestAnimationFrame(() => this.syncActiveFromScroll());
	};

	private syncActiveFromScroll() {
		if (this.destroyed) return;
		const center = this.wrapEl.getBoundingClientRect().top + this.wrapEl.clientHeight / 2;
		let activeIndex = 0;

		for (let i = 0; i < this.wraps.length; i++) {
			const rect = this.wraps[i].getBoundingClientRect();
			const itemCenter = rect.top + rect.height / 2;
			if (Math.abs(center - itemCenter) < (rect.height + 10) / 2) {
				activeIndex = i;
			}
		}

		this.setActive(activeIndex, true);
	}

	private setActive(index: number, notify: boolean) {
		for (let i = 0; i < this.wraps.length; i++) {
			this.wraps[i].classList.toggle("active", i === index);
		}
		if (notify) this.onActiveChange(index);
	}

}
