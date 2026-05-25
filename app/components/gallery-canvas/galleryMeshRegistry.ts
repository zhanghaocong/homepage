import {
	Group,
	Mesh,
	PlaneGeometry,
	Raycaster,
	Scene,
	ShaderMaterial,
	Vector2,
	Vector4,
	type Camera,
	type Intersection,
} from "three";
import { createGalleryPhotoMaterial } from "~/components/gallery-canvas/materials";
import {
	galleryAtlasKeyFromSrc,
	getGalleryAtlasSprite,
	getGalleryAtlasTexture,
	loadGalleryAtlasTexture,
	spriteToUvRect,
} from "~/lib/galleryAtlas";
import {
	getGalleryMode,
	getGalleryModeChangePow,
} from "~/lib/galleryStore";
import type { ScrollPower } from "~/lib/jsScroll";

export type GalleryMeshEntry = {
	element: HTMLElement;
	mesh: Mesh;
};

type CategoryGroup = {
	group: Group;
	elements: GalleryMeshEntry[];
};

const MESH_BATCH_SIZE = 8;
const PLANE_SEGMENTS = 16;

export type GalleryEffectUniforms = {
	u_type: { value: number };
	scroll_pow: { value: number };
	modeChangePow: { value: number };
	mode: { value: number };
	device: { value: number };
};

export type GalleryMeshRegistryOptions = {
	scene: Scene;
	isMobile: boolean;
	pm: { value: number };
};

/**
 * Manages gallery photo meshes synced from DOM `.gl-img` frames.
 * Mirrors photoyoshi mesh batching, category groups, and per-frame DOM sync.
 */
export class GalleryMeshRegistry {
	readonly pm: { value: number };
	readonly effectUniforms: GalleryEffectUniforms = {
		u_type: { value: 1 },
		scroll_pow: { value: 0 },
		modeChangePow: { value: 0 },
		mode: { value: 0 },
		device: { value: 0 },
	};

	private readonly scene: Scene;
	private atlasReady = false;
	private readonly meshedFrames = new WeakSet<HTMLElement>();
	private readonly pendingFrames: HTMLElement[] = [];
	private readonly groups: Record<string, CategoryGroup> = {
		cateInterior: { group: new Group(), elements: [] },
		catePortrait: { group: new Group(), elements: [] },
		cateLandscape: { group: new Group(), elements: [] },
	};
	private initRaf = 0;
	private time = 0;
	private wallHiddenForPhotoView = false;
	private lastScrollPower: ScrollPower | null = null;

	constructor({ scene, isMobile, pm }: GalleryMeshRegistryOptions) {
		this.scene = scene;
		this.pm = pm;
		this.pm = pm;
		this.effectUniforms.device.value = isMobile ? 0.5 : 0;
	}

	init(root: HTMLElement, onReady?: () => void) {
		for (const g of Object.values(this.groups)) {
			this.scene.add(g.group);
		}

		const originals = Array.from(
			root.querySelectorAll<HTMLElement>(".c-section:not(.c-clone) .gl-img"),
		);
		const clones = Array.from(
			root.querySelectorAll<HTMLElement>(".c-section.c-clone .gl-img"),
		);
		const queue = [...originals, ...clones];
		let index = 0;

		const finishInit = () => {
			for (const frame of [...this.pendingFrames]) {
				this.createMeshForFrame(frame);
			}
			this.pendingFrames.length = 0;
			onReady?.();
		};

		void loadGalleryAtlasTexture().then(() => {
			this.atlasReady = true;
			const runStep = () => {
				const end = Math.min(index + MESH_BATCH_SIZE, queue.length);
				for (; index < end; index++) {
					this.createMeshForFrame(queue[index]);
				}
				if (index < queue.length) {
					this.initRaf = requestAnimationFrame(runStep);
				} else {
					finishInit();
				}
			};
			runStep();
		});
	}

	syncMeshes(root: HTMLElement) {
		for (const g of Object.values(this.groups)) {
			const kept: GalleryMeshEntry[] = [];
			for (const entry of g.elements) {
				if (!entry.element.isConnected) {
					g.group.remove(entry.mesh);
					entry.mesh.geometry.dispose();
					(entry.mesh.material as ShaderMaterial).dispose();
					continue;
				}
				kept.push(entry);
			}
			g.elements = kept;
		}

		const frames = root.querySelectorAll<HTMLElement>(".c-section .gl-img");
		for (const frame of frames) {
			this.createMeshForFrame(frame);
		}
	}

	effectTick(power: ScrollPower) {
		this.lastScrollPower = power;
		for (const g of Object.values(this.groups)) {
			for (const { element, mesh } of g.elements) {
				this.updateMesh(element, mesh, power);
			}
		}

		this.effectUniforms.scroll_pow.value = power.pow1.value ?? 0;
		this.effectUniforms.modeChangePow.value = getGalleryModeChangePow();
		this.effectUniforms.mode.value = getGalleryMode();
	}

	onResize() {
		for (const g of Object.values(this.groups)) {
			for (const { element, mesh } of g.elements) {
				const img = element.querySelector<HTMLImageElement>(".gl-i");
				if (!img) continue;
				const frameW = Math.max(element.clientWidth, 1);
				const frameH = Math.max(element.clientHeight, 1);
				this.resizeGeometry(mesh, frameW, frameH);
				this.setPosition(mesh, element);
				const frameAspect = frameW / frameH;
				const imgAspect = this.getImageAspect(img);
				const u = (mesh.material as ShaderMaterial).uniforms;
				u.vUvScale.value.set(
					frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
					frameAspect > imgAspect ? imgAspect / frameAspect : 1,
				);
			}
		}
	}

	findEntryByFrame(frame: HTMLElement): GalleryMeshEntry | null {
		for (const g of Object.values(this.groups)) {
			for (const entry of g.elements) {
				if (entry.element === frame) return entry;
			}
		}
		return null;
	}

	pickWallMesh(ndcX: number, ndcY: number, camera: Camera) {
		const raycaster = new Raycaster();
		raycaster.setFromCamera(new Vector2(ndcX, ndcY), camera);
		const meshes: Mesh[] = [];
		const map = new Map<Mesh, GalleryMeshEntry>();
		for (const g of Object.values(this.groups)) {
			for (const entry of g.elements) {
				if (!entry.mesh.visible) continue;
				meshes.push(entry.mesh);
				map.set(entry.mesh, entry);
			}
		}
		const hits = raycaster.intersectObjects(meshes, false);
		if (hits.length === 0) return null;
		const mesh = hits[0].object as Mesh;
		return { entry: map.get(mesh)!, hit: hits[0] as Intersection };
	}

	setWallMeshesHidden(hidden: boolean) {
		if (hidden) {
			this.wallHiddenForPhotoView = true;
			this.effectUniforms.u_type.value = 0;
			for (const g of Object.values(this.groups)) {
				for (const { mesh } of g.elements) {
					mesh.visible = false;
				}
			}
			return;
		}
		this.restoreWallMeshes();
	}

	/** Re-show wall meshes and sync layout after photo view. */
	restoreWallMeshes(power?: ScrollPower) {
		this.wallHiddenForPhotoView = false;
		this.effectUniforms.u_type.value = 1;
		this.onResize();
		for (const g of Object.values(this.groups)) {
			for (const { mesh } of g.elements) {
				mesh.visible = true;
			}
		}
		const tickPower = power ?? this.lastScrollPower;
		if (tickPower) {
			this.effectTick(tickPower);
		}
	}

	destroy() {
		cancelAnimationFrame(this.initRaf);
		for (const g of Object.values(this.groups)) {
			g.group.traverse((obj) => {
				if (obj instanceof Mesh) {
					obj.geometry.dispose();
					(obj.material as ShaderMaterial).dispose();
				}
			});
			this.scene.remove(g.group);
		}
		this.atlasReady = false;
		this.pendingFrames.length = 0;
	}

	private uvRectForImage(img: HTMLImageElement): Vector4 | null {
		const src = img.dataset.jsSrc ?? img.currentSrc ?? img.src;
		const key = galleryAtlasKeyFromSrc(src);
		const sprite = getGalleryAtlasSprite(key);
		if (!sprite) return null;
		return spriteToUvRect(sprite);
	}

	private getImageAspect(img: HTMLImageElement) {
		const dw = Number(img.dataset.aspectW);
		const dh = Number(img.dataset.aspectH);
		if (dw > 0 && dh > 0) return dw / dh;
		if (img.naturalWidth > 0 && img.naturalHeight > 0) {
			return img.naturalWidth / img.naturalHeight;
		}
		const cw = img.clientWidth;
		const ch = img.clientHeight;
		if (cw > 0 && ch > 0) return cw / ch;
		return 1;
	}

	private setPosition(mesh: Mesh, frame: HTMLElement) {
		const rect = frame.getBoundingClientRect();
		const vw = window._w ?? window.innerWidth;
		const vh = window._h ?? window.innerHeight;
		mesh.position.x = rect.left + rect.width / 2 - vw / 2;
		mesh.position.y = vh / 2 - rect.top - rect.height / 2;
	}

	private addToGroup(mesh: Mesh, category: string, element: HTMLElement) {
		const key =
			(
				{
					interior: "cateInterior",
					portrait: "catePortrait",
					landscape: "cateLandscape",
				} as const
			)[category as "interior" | "portrait" | "landscape"] ?? "cateInterior";
		this.groups[key].group.add(mesh);
		this.groups[key].elements.push({ element, mesh });
	}

	private createMeshForFrame(frame: HTMLElement) {
		if (this.meshedFrames.has(frame)) return;
		const img = frame.querySelector<HTMLImageElement>(".gl-i");
		if (!img?.dataset.jsSrc) return;

		const atlas = getGalleryAtlasTexture();
		const uvRect = this.uvRectForImage(img);
		if (!this.atlasReady || !atlas || !uvRect) {
			if (!this.pendingFrames.includes(frame)) {
				this.pendingFrames.push(frame);
			}
			return;
		}

		const rect = frame.getBoundingClientRect();
		const geo = new PlaneGeometry(
			Math.max(rect.width, 1),
			Math.max(rect.height, 1),
			PLANE_SEGMENTS,
			PLANE_SEGMENTS,
		);
		const mesh = new Mesh(geo, createGalleryPhotoMaterial(atlas, uvRect));
		this.setPosition(mesh, frame);
		this.addToGroup(mesh, img.dataset.category ?? "interior", frame);
		this.meshedFrames.add(frame);
	}

	private resizeGeometry(mesh: Mesh, width: number, height: number) {
		const geo = mesh.geometry as PlaneGeometry;
		if (
			Math.abs(geo.parameters.width - width) < 1 &&
			Math.abs(geo.parameters.height - height) < 1
		) {
			return;
		}
		geo.dispose();
		mesh.geometry = new PlaneGeometry(
			width,
			height,
			PLANE_SEGMENTS,
			PLANE_SEGMENTS,
		);
		mesh.scale.set(1, 1, 1);
	}

	private updateMesh(frame: HTMLElement, mesh: Mesh, power: ScrollPower) {
		if (this.wallHiddenForPhotoView) {
			mesh.visible = false;
			return;
		}

		const img = frame.querySelector<HTMLImageElement>(".gl-i");
		if (!img) return;

		const frameW = Math.max(frame.clientWidth, 1);
		const frameH = Math.max(frame.clientHeight, 1);
		this.resizeGeometry(mesh, frameW, frameH);
		const frameAspect = frameW / frameH;
		const imgAspect = this.getImageAspect(img);
		const geo = mesh.geometry as PlaneGeometry;
		const scaleX =
			frameAspect > imgAspect
				? (frameAspect / imgAspect) * (frameH / geo.parameters.height)
				: frameW / geo.parameters.width;
		const scaleY =
			frameAspect > imgAspect
				? frameH / geo.parameters.height
				: (imgAspect / frameAspect) * (frameW / geo.parameters.width);

		this.time += 1e-4;
		const u = (mesh.material as ShaderMaterial).uniforms;
		u.vUvScale.value.set(
			frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
			frameAspect > imgAspect ? imgAspect / frameAspect : 1,
		);
		u.pw.value = (power.pow2.value ?? 0) * this.pm.value * getGalleryMode();
		u.mode.value = getGalleryMode();
		mesh.scale.set(scaleX, scaleY, 1);

		const rect = frame.getBoundingClientRect();
		const vw = window._w ?? window.innerWidth;
		const vh = window._h ?? window.innerHeight;
		mesh.position.x = frameW / 2 - vw / 2 + rect.left;
		mesh.position.y = vh / 2 - frameH / 2 - rect.top;

		mesh.visible =
			frameH > 2 &&
			frameW > 2 &&
			rect.right > -vw * 0.25 &&
			rect.left < vw * 1.25;
	}
}
