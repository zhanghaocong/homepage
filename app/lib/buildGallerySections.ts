import {
	galleryCategoryOrder,
	galleryImages,
	type CateImage,
	type CateKey,
	imageUrl,
} from "~/data/gallery";
import type {
	GalleryFrameSpec,
	GalleryLayoutDocument,
	GallerySectionSpec,
} from "~/lib/galleryLayout";
import {
	getGalleryLayoutDocument,
	setGalleryLayoutDocument,
} from "~/lib/galleryLayoutStore";

const CELLS_PER_COLUMN = 5;
const COLUMNS = 2;

function pickImages(pool: CateImage[], count: number) {
	const copy = [...pool];
	const picked: CateImage[] = [];
	for (let n = 0; n < count && copy.length > 0; n++) {
		const idx = Math.floor(Math.random() * copy.length);
		picked.push(copy.splice(idx, 1)[0]);
	}
	return picked;
}

function buildSectionSpec(
	category: CateKey,
	sectionIndex: number,
): GallerySectionSpec {
	const pool = [...galleryImages[category]];
	const frames: GalleryFrameSpec[] = [];

	for (let col = 0; col < COLUMNS; col++) {
		const images = pickImages(pool, CELLS_PER_COLUMN);
		for (let row = 0; row < images.length; row++) {
			const img = images[row];
			const id = `s${sectionIndex}-c${col}-r${row}`;
			const src = row === 2 ? imageUrl(img["2048x2048"]) : imageUrl(img.medium);
			frames.push({
				id,
				sectionIndex,
				category,
				col,
				row,
				image: img,
				src,
				jsSrc: src,
				isClone: false,
			});
		}
	}

	return {
		index: sectionIndex,
		category,
		isClone: false,
		frames,
	};
}

/** Scroll skeleton only — photos live in layout store + WebGL meshes. */
function mountSectionDom(section: GallerySectionSpec) {
	const sectionEl = document.createElement("div");
	sectionEl.className = "c-section";
	sectionEl.dataset.category = section.category.toLowerCase();
	sectionEl.dataset.sectionIndex = String(section.index);

	const wrap = document.createElement("div");
	wrap.className = "c-inner gl-wrap";

	for (let col = 0; col < COLUMNS; col++) {
		const column = document.createElement("div");
		column.className = "gl-inner";
		column.setAttribute("aria-hidden", "true");
		wrap.appendChild(column);
	}

	sectionEl.appendChild(wrap);
	return sectionEl;
}

function mountFresh(container: HTMLElement): GalleryLayoutDocument {
	const sections: GallerySectionSpec[] = [];
	for (let i = 0; i < galleryCategoryOrder.length; i++) {
		sections.push(buildSectionSpec(galleryCategoryOrder[i], i));
	}

	const doc: GalleryLayoutDocument = { sections };
	for (const section of sections) {
		container.appendChild(mountSectionDom(section));
	}

	setGalleryLayoutDocument(doc);
	return doc;
}

/** Build layout model and minimal scroll DOM (no per-frame nodes). */
export function buildGallerySections(container: HTMLElement): GalleryLayoutDocument {
	const cached = getGalleryLayoutDocument();
	if (
		cached?.sections.length &&
		cached.sections.some((s) => s.frames.length > 0) &&
		container.querySelector(".c-section")
	) {
		return cached;
	}

	container.replaceChildren();
	return mountFresh(container);
}
