import {
	galleryCategoryOrder,
	galleryImages,
	type CateImage,
	type CateKey,
	imageUrl,
} from "~/data/gallery";

/** Mirrors photoyoshi `window.setDome` */
export function buildGallerySections(container: HTMLElement) {
	if (container.querySelector(".c-section")) return;

	const appendSection = (
		poolSource: Record<CateKey, CateImage[]>,
		category: CateKey,
		root: HTMLElement,
	) => {
		const pool = [...poolSource[category]];
		if (pool.length === 0) return;

		const section = document.createElement("div");
		section.className = "c-section";
		section.dataset.category = category.toLowerCase();

		const wrap = document.createElement("div");
		wrap.className = "c-inner gl-wrap";

		for (let col = 0; col < 2; col++) {
			const column = document.createElement("div");
			column.className = "gl-inner";

			for (let n = 0; n < 5 && pool.length > 0; n++) {
				const idx = Math.floor(Math.random() * pool.length);
				const img = pool.splice(idx, 1)[0];

				const cell = document.createElement("div");
				cell.className = "gl-img_w";

				const frame = document.createElement("div");
				frame.className = "gl-img";
				const style =
					img.width > img.height
						? "width: 100%; height: 65%;"
						: "width: 65%; height: 100%;";
				frame.setAttribute("style", style);

				const el = document.createElement("img");
				el.className = "gl-i";
				const src =
					n === 2 ? imageUrl(img["2048x2048"]) : imageUrl(img.medium);
				el.dataset.jsSrc = src;
				el.src = src;
				el.setAttribute("style", `aspect-ratio:${img.width}/${img.height}`);
				el.alt = `Image from ${category}`;
				el.dataset.category = category.toLowerCase();
				el.dataset.aspectW = String(img.width);
				el.dataset.aspectH = String(img.height);
				frame.appendChild(el);
				cell.appendChild(frame);
				column.appendChild(cell);
			}

			wrap.appendChild(column);
		}

		section.appendChild(wrap);
		root.appendChild(section);
	};

	for (const category of galleryCategoryOrder) {
		appendSection(galleryImages, category, container);
	}
}
