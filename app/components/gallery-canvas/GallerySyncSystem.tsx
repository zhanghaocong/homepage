import { useFrame } from "@react-three/fiber";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
import type { JsScroll } from "~/lib/jsScroll";

type GallerySyncSystemProps = {
	engineRef: React.MutableRefObject<GalleryEngineHandle | null>;
	scrollRef: React.MutableRefObject<JsScroll | null>;
};

/**
 * Single render-loop coordinator: syncs meshes from scroll power and renders the composer.
 * Replaces the former gsap.ticker → engine.tick() bridge in PhotoGallery.
 */
export function GallerySyncSystem({
	engineRef,
	scrollRef,
}: GallerySyncSystemProps) {
	useFrame(() => {
		const engine = engineRef.current;
		const scroll = scrollRef.current;
		if (!engine || !scroll) return;
		engine.tick(scroll.power, scroll.currentCategory);
	}, 1);

	return null;
}
