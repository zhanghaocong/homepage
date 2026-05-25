import { Mesh, PlaneGeometry, type Vector4 } from "three";
import { createPhotoViewMaterial } from "~/components/gallery-canvas/materials";
import type { GalleryPhotoMaterialImpl } from "~/components/gallery-canvas/materials";
import {
	applyMeshRect,
	type PhotoViewWorldRect,
} from "~/lib/photoViewLayout";

export function createPhotoViewPlane(
	atlas: import("three").Texture,
	uvRect: Vector4,
	rect: PhotoViewWorldRect,
): Mesh {
	const geo = new PlaneGeometry(1, 1, 1, 1);
	const mesh = new Mesh(geo, createPhotoViewMaterial(atlas, uvRect));
	applyMeshRect(mesh, rect);
	mesh.renderOrder = 10;
	return mesh;
}

export function setPhotoViewPlaneUv(
	mesh: Mesh,
	uvRect: Vector4,
	aspect: number,
) {
	const mat = mesh.material as GalleryPhotoMaterialImpl;
	mat.vUvRect.copy(uvRect);
	const frameAspect = 1;
	const imgAspect = aspect;
	mat.vUvScale.set(
		frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
		frameAspect > imgAspect ? imgAspect / frameAspect : 1,
	);
}

export function disposePhotoViewPlane(mesh: Mesh) {
	mesh.geometry.dispose();
	(mesh.material as GalleryPhotoMaterialImpl).dispose();
}
