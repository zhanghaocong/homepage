import {
	Group,
	Mesh,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	Texture,
	TextureLoader,
} from "three";
import { createGalleryPhotoMaterial } from "~/components/gallery-canvas/materials";
import { galleryParams } from "~/lib/galleryParams";
import type { ScrollPower } from "~/lib/jsScroll";

type MeshEntry = {
	element: HTMLElement;
	mesh: Mesh;
};

type CategoryGroup = {
	group: Group;
	elements: MeshEntry[];
};

const MESH_BATCH_SIZE = 8;
const PLANE_SEGMENTS = 16;

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
	readonly effectUniforms = {
		u_type: { value: 1 },
		scroll_pow: { value: 0 },
		modeChangePow: { value: 0 },
		mode: { value: 0 },
		device: { value: 0 },
	};

	private readonly scene: Scene;
	private readonly loader = new TextureLoader();
	private readonly textureCache = new Map<string, Texture>();
	private readonly meshedFrames = new WeakSet<HTMLElement>();
	private readonly groups: Record<string, CategoryGroup> = {
		cateInterior: { group: new Group(), elements: [] },
		catePortrait: { group: new Group(), elements: [] },
		cateLandscape: { group: new Group(), elements: [] },
	};
	private initRaf = 0;
	private time = 0;

	constructor({ scene, isMobile, pm }: GalleryMeshRegistryOptions) {
		this.scene = scene;
		this.pm = pm;
		this.pm = pm;
		this.effectUniforms.device.value = isMobile ? 0.5 : 0;
		this.loader.setCrossOrigin("anonymous");
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

		const step = () => {
			const end = Math.min(index + MESH_BATCH_SIZE, queue.length);
			for (; index < end; index++) {
				this.createMeshForFrame(queue[index]);
			}
			if (index < queue.length) {
				this.initRaf = requestAnimationFrame(step);
			} else {
				onReady?.();
			}
		};

		step();
	}

	syncMeshes(root: HTMLElement) {
		for (const g of Object.values(this.groups)) {
			const kept: MeshEntry[] = [];
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
		for (const g of Object.values(this.groups)) {
			for (const { element, mesh } of g.elements) {
				this.updateMesh(element, mesh, power);
			}
		}

		this.effectUniforms.scroll_pow.value = power.pow1.value ?? 0;
		this.effectUniforms.modeChangePow.value = galleryParams.modeChangePow;
		this.effectUniforms.mode.value = galleryParams.mode;
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
		for (const tex of this.textureCache.values()) {
			tex.dispose();
		}
		this.textureCache.clear();
	}

	private textureForImage(img: HTMLImageElement) {
		const src = img.dataset.jsSrc ?? img.currentSrc ?? img.src;
		const cached = this.textureCache.get(src);
		if (cached) return cached;

		const tex = this.loader.load(src);
		tex.colorSpace = SRGBColorSpace;
		this.textureCache.set(src, tex);
		return tex;
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

		const rect = frame.getBoundingClientRect();
		const tex = this.textureForImage(img);
		const geo = new PlaneGeometry(
			Math.max(rect.width, 1),
			Math.max(rect.height, 1),
			PLANE_SEGMENTS,
			PLANE_SEGMENTS,
		);
		const mesh = new Mesh(geo, createGalleryPhotoMaterial(tex));
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
		u.pw.value = (power.pow2.value ?? 0) * this.pm.value * galleryParams.mode;
		u.mode.value = galleryParams.mode;
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
