import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { applyGalleryCamera, getViewportSize } from "~/components/gallery-canvas/cameraUtils";

/** Matches photoyoshi perspective camera setup. */
export function GalleryCamera() {
	const camera = useThree((state) => state.camera);

	useLayoutEffect(() => {
		if (!(camera instanceof PerspectiveCamera)) return;
		const { w, h } = getViewportSize();
		applyGalleryCamera(camera, w, h);
	}, [camera]);

	return null;
}
