import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";

type GalleryPhotoMeshesProps = {
	contentRef: React.RefObject<HTMLElement | null>;
	isMobile: boolean;
	onRegistry: (registry: GalleryMeshRegistry | null) => void;
	onMeshesReady?: () => void;
};

/**
 * R3F component that owns gallery photo mesh lifecycle.
 * Creates a GalleryMeshRegistry bound to the R3F scene and batch-inits from DOM.
 */
export function GalleryPhotoMeshes({
	contentRef,
	isMobile,
	onRegistry,
	onMeshesReady,
}: GalleryPhotoMeshesProps) {
	const scene = useThree((state) => state.scene);
	const pmRef = useRef({ value: 0.1 });
	const readyRef = useRef(onMeshesReady);
	readyRef.current = onMeshesReady;

	useEffect(() => {
		const content = contentRef.current;
		if (!content) return;

		const registry = new GalleryMeshRegistry({
			scene,
			isMobile,
			pm: pmRef.current,
		});

		onRegistry(registry);
		registry.init(content, () => readyRef.current?.());

		return () => {
			registry.destroy();
			onRegistry(null);
		};
	}, [contentRef, isMobile, onRegistry, scene]);

	return null;
}
