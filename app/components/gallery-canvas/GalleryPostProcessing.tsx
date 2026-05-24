import { UnsignedByteType } from "three";
import { EffectComposer } from "@react-three/postprocessing";
import { GalleryComposite } from "~/components/gallery-canvas/GalleryComposite";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";

type GalleryPostProcessingProps = {
	meshRegistry: GalleryMeshRegistry;
};

/** R3F post-processing pass chain for gallery edge distortion. */
export function GalleryPostProcessing({ meshRegistry }: GalleryPostProcessingProps) {
	return (
		<EffectComposer
			multisampling={0}
			frameBufferType={UnsignedByteType}
			autoClear
			depthBuffer={false}
			stencilBuffer={false}
		>
			<GalleryComposite registry={meshRegistry} />
		</EffectComposer>
	);
}
