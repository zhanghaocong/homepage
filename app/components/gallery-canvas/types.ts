import type { ScrollPower } from "~/lib/jsScroll";

export type GalleryHomeScene = {
	init: (root: HTMLElement, onReady?: () => void) => void;
	syncMeshes: (root: HTMLElement) => void;
	destroy: () => void;
};

export type GalleryEngineHandle = {
	homeScene: GalleryHomeScene;
	tick: (power: ScrollPower, currentCategory: string) => void;
	warmupRender: () => void;
	onResize: () => void;
	destroy: () => void;
};
