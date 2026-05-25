import type { CateImage, CateKey } from "~/data/gallery";

/** photoyoshi `max-aspect-ratio` / jsScroll `isWideAspect` threshold (~1.35). */
export const GALLERY_WIDE_ASPECT =
	3039929748475085 / 2251799813685248;

const GRID_VW_NARROW = 1.6667;
const GRID_VW_MOBILE = 4.97512437811;
const MOBILE_MAX_WIDTH = 680;
const CELLS_PER_COLUMN = 5;
/** Vertical gap between stacked cells (photoyoshi flex `row-gap`; tuned above default). */
const ROW_GAP_GRID_MULT = 2;
/** Extra viewport width of scroll content beyond minimum loop length. */
export const GALLERY_CONTENT_MIN_VW = 2.5;
/** Mesh visibility padding beyond viewport edges (per side, in viewport widths). */
export const GALLERY_MESH_OVERSCAN_VW = 1;
/** Mobile column width (photoyoshi `.gl-inner` width). */
const MOBILE_COL_WIDTH_VW = 19.9004975124;
const MOBILE_COL_MARGIN_VW = 2.4875621891;

export type GalleryViewport = {
	w: number;
	h: number;
};

export type GalleryGridMetrics = {
	grid: number;
	cell: number;
	columnStride: number;
	columnMargin: number;
	rowGap: number;
	cellStride: number;
	sectionWidth: number;
	/** `.c-content { margin-right: calc(var(--grid) * 4) }` */
	contentMarginRight: number;
	columnTop: number;
	columnInnerHeight: number;
	/** Vertical offset to center the 5-cell stack inside the column. */
	columnStackOffset: number;
	wrapTop: number;
	useLargeCells: boolean;
	mobile: boolean;
};

export type GalleryFrameSpec = {
	id: string;
	sectionIndex: number;
	category: CateKey;
	col: number;
	row: number;
	image: CateImage;
	src: string;
	jsSrc: string;
	isClone: boolean;
};

export type GallerySectionSpec = {
	index: number;
	category: CateKey;
	isClone: boolean;
	frames: GalleryFrameSpec[];
};

export type GalleryLayoutDocument = {
	sections: GallerySectionSpec[];
};

export type GalleryFrameRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type GalleryWorldRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

/** Desktop-ish default for SSR / module init (no window). */
export const GALLERY_SSR_VIEWPORT: GalleryViewport = { w: 1440, h: 900 };

export function getViewport(): GalleryViewport {
	if (typeof window === "undefined") {
		return GALLERY_SSR_VIEWPORT;
	}
	return {
		w: window._w ?? window.innerWidth,
		h: window._h ?? window.innerHeight,
	};
}

export function isGalleryWideAspect(w: number, h: number) {
	return w / h > GALLERY_WIDE_ASPECT;
}

/** Parse `--grid: 1.6667vw` / `32px` from photoyoshi CSS variables. */
export function parseCssGridLength(
	raw: string,
	viewport: GalleryViewport = getViewport(),
): number | null {
	const value = raw.trim();
	if (!value) return null;

	if (value.endsWith("vw")) {
		const n = Number.parseFloat(value);
		return Number.isFinite(n) ? (viewport.w * n) / 100 : null;
	}
	if (value.endsWith("vh")) {
		const n = Number.parseFloat(value);
		return Number.isFinite(n) ? (viewport.h * n) / 100 : null;
	}
	if (value.endsWith("px")) {
		const n = Number.parseFloat(value);
		return Number.isFinite(n) && n > 0 ? n : null;
	}

	const n = Number.parseFloat(value);
	// Unsuffixed tiny values are usually a mistaken vw parse (e.g. 1.6667 from 1.6667vw).
	if (Number.isFinite(n) && n > 8) return n;
	return null;
}

/** Mirrors photoyoshi `:root --grid` and mobile override. */
export function getGridUnit(viewport: GalleryViewport = getViewport()) {
	if (typeof window !== "undefined") {
		const raw = getComputedStyle(document.documentElement)
			.getPropertyValue("--grid")
			.trim();
		const parsed = parseCssGridLength(raw, viewport);
		if (parsed !== null) return parsed;
	}
	const { w } = viewport;
	if (w < MOBILE_MAX_WIDTH) {
		return w * (GRID_VW_MOBILE / 100);
	}
	return w * (GRID_VW_NARROW / 100);
}

function getColumnStride(
	viewport: GalleryViewport,
	grid: number,
	useLargeCells: boolean,
) {
	const { w } = viewport;
	if (w < MOBILE_MAX_WIDTH) {
		const colWidth = w * (MOBILE_COL_WIDTH_VW / 100);
		const margin = w * (MOBILE_COL_MARGIN_VW / 100);
		return colWidth + margin * 2;
	}
	const cellMult = useLargeCells ? 6 : 4;
	const marginMult = useLargeCells ? 0.75 : 1.75;
	return grid * cellMult + grid * marginMult * 2;
}

/** Column block top offset (photoyoshi `.gl-inner { top }`). */
export function getColumnInnerTopMult(mobile: boolean) {
	return mobile ? 1.55 : 1.25;
}

/** Column block height — `100vh - 4g` or `100vh - 7.5g` (mobile / large cells). */
export function getColumnInnerHeight(
	viewport: GalleryViewport,
	grid: number,
	useLargeCells: boolean,
) {
	const { w, h } = viewport;
	if (w < MOBILE_MAX_WIDTH) {
		return h - grid * 7.5;
	}
	if (useLargeCells) {
		return h - grid * 7.5;
	}
	return h - grid * 4;
}

export function getGalleryGridMetrics(
	viewport: GalleryViewport = getViewport(),
): GalleryGridMetrics {
	const { w, h } = viewport;
	const grid = getGridUnit(viewport);
	const mobile = w < MOBILE_MAX_WIDTH;
	const useLargeCells = !mobile && !isGalleryWideAspect(w, h);
	const cellMult = useLargeCells ? 6 : 4;
	const marginMult = useLargeCells ? 0.75 : 1.75;
	const cell = grid * cellMult;
	const columnStride = getColumnStride(viewport, grid, useLargeCells);
	const sectionWidth = columnStride * 2;
	const columnMargin = mobile
		? w * (MOBILE_COL_MARGIN_VW / 100)
		: grid * marginMult;
	const wrapTop = grid * -0.5;
	const columnTop = wrapTop + grid * getColumnInnerTopMult(mobile);
	const rowGap = grid * ROW_GAP_GRID_MULT;
	const cellStride = cell + rowGap;
	const columnInnerHeight = getColumnInnerHeight(viewport, grid, useLargeCells);
	const stackHeight =
		cell * CELLS_PER_COLUMN + rowGap * (CELLS_PER_COLUMN - 1);
	// Center the 5-row stack in the viewport (photoyoshi `align-content: center`).
	const stackTop = Math.max(0, (h - stackHeight) / 2);
	const columnStackOffset = stackTop - columnTop;

	return {
		grid,
		cell,
		columnStride,
		columnMargin,
		rowGap,
		cellStride,
		sectionWidth,
		contentMarginRight: grid * 4,
		columnTop,
		columnInnerHeight,
		columnStackOffset,
		wrapTop,
		useLargeCells,
		mobile,
	};
}

export function getImageAspect(img: { width: number; height: number }) {
	if (img.width > 0 && img.height > 0) return img.width / img.height;
	return 1;
}

/** Frame inner size inside a square cell (matches buildGallerySections inline styles). */
export function frameSizeInCell(cell: number, aspect: number) {
	const landscape = aspect >= 1;
	return {
		width: landscape ? cell : cell * 0.65,
		height: landscape ? cell * 0.65 : cell,
	};
}

const PARALLAX_ROW_MULT: Record<number, number> = {
	0: 2,
	1: 1,
	3: -1,
	4: -2,
};

export function getCellParallaxOffset(row: number, scrollPow: number, grid: number) {
	const mult = PARALLAX_ROW_MULT[row];
	if (mult === undefined) return 0;
	return scrollPow * grid * mult;
}

/**
 * Splash gather Y — photoyoshi `-(top + clientHeight)`; layout uses cell box (grid × 4/6).
 */
/** Splash hero frame size before reveal (187% × 20vw in photoyoshi). */
export function splashHeroFrameSize(
	metrics: GalleryGridMetrics,
	viewport: GalleryViewport = getViewport(),
) {
	return {
		width: metrics.cell * 1.87,
		height: viewport.w * 0.2,
	};
}

export function splashGatherOffsetY(
	spec: GalleryFrameSpec,
	metrics: GalleryGridMetrics,
	viewport: GalleryViewport = getViewport(),
): number {
	if (spec.row === 2) return 0;

	const { cell, columnTop, columnStackOffset, cellStride } = metrics;
	const cellTop = columnTop + columnStackOffset + spec.row * cellStride;
	const { h: vh } = viewport;

	if (spec.row === 0 || spec.row === 1) {
		return -1 * (cellTop + cell);
	}
	if (spec.row === 3 || spec.row === 4) {
		return -1 * (cellTop + cell - vh - cell);
	}
	return 0;
}

export type SplashFramePose = {
	y: number;
	width: number;
	height: number;
};

export function frameRectInSectionForSplash(
	spec: Pick<GalleryFrameSpec, "col" | "row">,
	metrics: GalleryGridMetrics,
	pose: SplashFramePose,
	scrollPow = 0,
): GalleryFrameRect {
	const { col, row } = spec;
	const { grid, cell, columnStride, columnTop, columnStackOffset, cellStride } =
		metrics;
	const colLeft = col * columnStride + metrics.columnMargin;
	const cellTop =
		columnTop +
		columnStackOffset +
		row * cellStride +
		getCellParallaxOffset(row, scrollPow, grid);

	return {
		left: colLeft + (cell - pose.width) / 2,
		top: cellTop + (cell - pose.height) / 2,
		width: pose.width,
		height: pose.height,
	};
}

export function frameRectInSectionForImage(
	spec: Pick<GalleryFrameSpec, "col" | "row" | "image">,
	metrics: GalleryGridMetrics,
	scrollPow = 0,
): GalleryFrameRect {
	const { col, row, image } = spec;
	const { grid, cell, columnStride, columnTop, columnStackOffset } = metrics;
	const aspect = getImageAspect(image);
	const colLeft = col * columnStride + metrics.columnMargin;
	const cellTop =
		columnTop +
		columnStackOffset +
		row * metrics.cellStride +
		getCellParallaxOffset(row, scrollPow, grid);
	const frame = frameSizeInCell(cell, aspect);

	return {
		left: colLeft + (cell - frame.width) / 2,
		top: cellTop + (cell - frame.height) / 2,
		width: frame.width,
		height: frame.height,
	};
}

export function screenRectToWorld(
	rect: GalleryFrameRect,
	viewport: GalleryViewport = getViewport(),
): GalleryWorldRect {
	const { w: vw, h: vh } = viewport;
	return {
		x: rect.left + rect.width / 2 - vw / 2,
		y: vh / 2 - rect.top - rect.height / 2,
		width: Math.max(rect.width, 1),
		height: Math.max(rect.height, 1),
	};
}

export function frameScreenRect(
	spec: GalleryFrameSpec,
	sectionLeft: number,
	sectionScrollX: number,
	metrics: GalleryGridMetrics,
	scrollPow = 0,
	viewport: GalleryViewport = getViewport(),
): GalleryFrameRect {
	const local = frameRectInSectionForImage(spec, metrics, scrollPow);
	return {
		left: sectionLeft + sectionScrollX + local.left,
		top: local.top,
		width: local.width,
		height: local.height,
	};
}

export function frameWorldRect(
	spec: GalleryFrameSpec,
	sectionLeft: number,
	sectionScrollX: number,
	metrics: GalleryGridMetrics,
	scrollPow = 0,
	viewport: GalleryViewport = getViewport(),
): GalleryWorldRect {
	return screenRectToWorld(
		frameScreenRect(spec, sectionLeft, sectionScrollX, metrics, scrollPow, viewport),
		viewport,
	);
}

export function frameWorldRectForSplash(
	spec: GalleryFrameSpec,
	sectionLeft: number,
	sectionScrollX: number,
	metrics: GalleryGridMetrics,
	pose: SplashFramePose,
	scrollPow = 0,
	viewport: GalleryViewport = getViewport(),
): GalleryWorldRect {
	const local = frameRectInSectionForSplash(spec, metrics, pose, scrollPow);
	const screen: GalleryFrameRect = {
		left: sectionLeft + sectionScrollX + local.left,
		top: local.top,
		width: local.width,
		height: local.height,
	};
	const world = screenRectToWorld(screen, viewport);
	return { ...world, y: world.y - pose.y };
}

export function computeSectionLefts(
	sections: GallerySectionSpec[],
	metrics: GalleryGridMetrics,
) {
	const lefts: number[] = [];
	let x = 0;
	for (const section of sections) {
		lefts[section.index] = x;
		x += metrics.sectionWidth;
	}
	return lefts;
}

export function appendCloneRoundToLayout(
	doc: GalleryLayoutDocument,
): GalleryLayoutDocument | null {
	const originals = doc.sections.filter((s) => !s.isClone);
	if (originals.length === 0) return null;

	const startIndex = doc.sections.length;
	const clones: GallerySectionSpec[] = originals.map((section, i) => {
		const index = startIndex + i;
		return {
			index,
			category: section.category,
			isClone: true,
			frames: section.frames.map((frame) => ({
				...frame,
				id: `${frame.id}-clone-${index}`,
				sectionIndex: index,
				isClone: true,
			})),
		};
	});

	return { sections: [...doc.sections, ...clones] };
}

export function getMeshOverscanPx(viewport: GalleryViewport = getViewport()) {
	return viewport.w * GALLERY_MESH_OVERSCAN_VW;
}

export function isFrameVisible(
	rect: GalleryFrameRect,
	viewport: GalleryViewport = getViewport(),
) {
	const { w: vw, h: vh } = viewport;
	const padX = getMeshOverscanPx(viewport);
	const padY = vh * 0.35;
	return (
		rect.height > 2 &&
		rect.width > 2 &&
		rect.left + rect.width > -padX &&
		rect.left < vw + padX &&
		rect.top + rect.height > -padY &&
		rect.top < vh + padY
	);
}
