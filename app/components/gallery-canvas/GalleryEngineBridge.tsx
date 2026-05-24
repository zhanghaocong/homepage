import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { attachGalleryEngine } from "~/components/gallery-canvas/galleryEngine";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";

type GalleryEngineBridgeProps = {
	engineRef: React.MutableRefObject<GalleryEngineHandle | null>;
	meshRegistry: GalleryMeshRegistry;
};

/**
 * Attaches the post-processing composer to R3F's renderer.
 * Mesh creation/sync is owned by GalleryPhotoMeshes.
 */
export function GalleryEngineBridge({
	engineRef,
	meshRegistry,
}: GalleryEngineBridgeProps) {
	const { gl, scene, camera } = useThree();

	useEffect(() => {
		if (!(camera instanceof PerspectiveCamera)) return;

		const engine = attachGalleryEngine({
			gl,
			scene,
			camera,
			canvas: gl.domElement,
			meshRegistry,
		});

		engineRef.current = engine;

		return () => {
			engine.destroy();
			if (engineRef.current === engine) {
				engineRef.current = null;
			}
		};
	}, [camera, engineRef, gl, meshRegistry, scene]);

	return null;
}
