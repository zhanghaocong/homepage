import { wrapEffect } from "@react-three/postprocessing";
import { GalleryCompositeEffectImpl } from "~/components/gallery-canvas/galleryCompositeEffect";
import type { GalleryEffectUniforms } from "~/components/gallery-canvas/galleryMeshRegistry";

export const GalleryComposite = wrapEffect(GalleryCompositeEffectImpl);

export type GalleryCompositeProps = {
	effectUniforms: GalleryEffectUniforms;
};
