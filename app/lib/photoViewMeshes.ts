import {
	Mesh,
	PlaneGeometry,
	Texture,
	Vector4,
	type Vector4 as Vector4Type,
} from "three";
import { createPhotoViewMaterial } from "~/components/gallery-canvas/materials";
import type { GalleryPhotoMaterialImpl } from "~/components/gallery-canvas/materials";
import {
	applyMeshRect,
	type PhotoViewWorldRect,
} from "~/lib/photoViewLayout";
import { aspectFromTexture } from "~/lib/photoViewTextures";

const FULL_UV = new Vector4(0, 0, 1, 1);

/** World-space width / height of a 1×1 plane after scale (matches gallery wall logic). */
export function meshFrameAspect(mesh: Mesh): number {
	const geo = mesh.geometry as PlaneGeometry;
	const h = geo.parameters.height * mesh.scale.y;
	if (h <= 0) return 1;
	return (geo.parameters.width * mesh.scale.x) / h;
}

function applyPhotoViewUvScale(
	mat: GalleryPhotoMaterialImpl,
	frameAspect: number,
	imgAspect: number,
) {
	mat.vUvScale.set(
		frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
		frameAspect > imgAspect ? imgAspect / frameAspect : 1,
	);
}

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
	uvRect: Vector4Type,
	imgAspect: number,
) {
	const mat = mesh.material as GalleryPhotoMaterialImpl;
	mat.vUvRect.copy(uvRect);
	applyPhotoViewUvScale(mat, meshFrameAspect(mesh), imgAspect);
}

/** Swap hero to a dedicated full-size texture (not atlas UV). */
export function setPhotoViewPlaneTexture(mesh: Mesh, texture: Texture) {
	const mat = mesh.material as GalleryPhotoMaterialImpl;
	const imgAspect = aspectFromTexture(texture) ?? meshFrameAspect(mesh);
	mat.tA = texture;
	mat.vUvRect.copy(FULL_UV);
	applyPhotoViewUvScale(mat, meshFrameAspect(mesh), imgAspect);
}

export function disposePhotoViewPlane(mesh: Mesh) {
	mesh.geometry.dispose();
	(mesh.material as GalleryPhotoMaterialImpl).dispose();
}
