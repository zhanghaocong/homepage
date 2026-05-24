import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { DoubleSide, Texture, Vector2 } from "three";
import photoFragmentShader from "~/components/gallery-canvas/shaders/photo.frag.glsl?raw";
import photoVertexShader from "~/components/gallery-canvas/shaders/photo.vert.glsl?raw";
import { galleryParams } from "~/lib/galleryParams";

export const GalleryPhotoMaterial = shaderMaterial(
	{
		tA: null as Texture | null,
		vUvScale: new Vector2(1, 1),
		opacityN: 0.2,
		mode: 0,
		u_type: 1,
		pw: 0,
	},
	photoVertexShader,
	photoFragmentShader,
);

extend({ GalleryPhotoMaterial });

export type GalleryPhotoMaterialImpl = InstanceType<typeof GalleryPhotoMaterial>;

export function createGalleryPhotoMaterial(texture: Texture): GalleryPhotoMaterialImpl {
	const material = new GalleryPhotoMaterial();
	material.tA = texture;
	material.vUvScale = new Vector2(1, 1);
	material.opacityN = 0.2;
	material.mode = galleryParams.mode;
	material.u_type = 1;
	material.pw = 0;
	material.side = DoubleSide;
	material.transparent = true;
	return material;
}

export {
	photoFragmentShader,
	photoVertexShader,
};
