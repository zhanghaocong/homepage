import { useCallback, useEffect, useState } from "react";
import { GalleryCamera } from "~/components/gallery-canvas/GalleryCamera";
import { GalleryEngineBridge } from "~/components/gallery-canvas/GalleryEngineBridge";
import { GalleryPhotoMeshes } from "~/components/gallery-canvas/GalleryPhotoMeshes";
import { GalleryPostProcessing } from "~/components/gallery-canvas/GalleryPostProcessing";
import { GallerySyncSystem } from "~/components/gallery-canvas/GallerySyncSystem";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import {
	registerGalleryMeshRegistry,
	unregisterGalleryMeshRegistry,
} from "~/lib/galleryRegistryBridge";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";
import { getViewportSize } from "~/components/gallery-canvas/cameraUtils";
import type { JsScroll } from "~/lib/jsScroll";

type GallerySceneProps = {
	contentRef: React.RefObject<HTMLElement | null>;
	engineRef: React.MutableRefObject<GalleryEngineHandle | null>;
	scrollRef: React.MutableRefObject<JsScroll | null>;
	onEngineReady?: () => void;
};

export function GalleryScene({
	contentRef,
	engineRef,
	scrollRef,
	onEngineReady,
}: GallerySceneProps) {
	const [meshRegistry, setMeshRegistry] = useState<GalleryMeshRegistry | null>(
		null,
	);
	const isMobile = getViewportSize().w < 680;

	const handleRegistry = useCallback((registry: GalleryMeshRegistry | null) => {
		setMeshRegistry(registry);
	}, []);

	useEffect(() => {
		if (!meshRegistry) return;
		registerGalleryMeshRegistry(meshRegistry);
		return () => unregisterGalleryMeshRegistry();
	}, [meshRegistry]);

	return (
		<>
			<GalleryCamera />
			<GalleryPhotoMeshes
				contentRef={contentRef}
				isMobile={isMobile}
				onRegistry={handleRegistry}
				onMeshesReady={onEngineReady}
			/>
			{meshRegistry ? (
				<>
					<GalleryEngineBridge
						engineRef={engineRef}
						meshRegistry={meshRegistry}
					/>
					<GalleryPostProcessing meshRegistry={meshRegistry} />
				</>
			) : null}
			<GallerySyncSystem engineRef={engineRef} scrollRef={scrollRef} />
		</>
	);
}
