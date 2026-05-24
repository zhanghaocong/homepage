import {
	DoubleSide,
	Group,
	Mesh,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	Texture,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { galleryParams } from "~/lib/galleryParams";
import type { ScrollPower } from "~/lib/jsScroll";

const compositeVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const compositeFragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform int u_type;
uniform float scroll_pow;
uniform float modeChangePow;
uniform float mode;
uniform float device;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  if (u_type == 1) {
    vec2 uvTwist = uv;
    float angleX = (uv.x - 0.5) * 3.14159 * 0.9;
    uvTwist.y -= tan(angleX) * 0.15;

    vec2 uvTwist2 = uv;
    float angleX2 = (uv.x - 0.5) * 3.14159;
    float blend = smoothstep(0.2, 0.8, uv.x);
    uvTwist2.y += tan(angleX2) * -0.002 * (1. - blend);
    uvTwist2.y -= tan(angleX2) * -0.002 * blend;

    vec2 uvDepth2 = uv;
    float edgeInfluenceX2 = smoothstep(0.0, 0.2, uv.x) - smoothstep(0.8, 1.0, uv.x);
    uvDepth2.y -= (edgeInfluenceX2 - 1.0) * .025;

    vec2 uvWave2 = uv;

    vec2 powEffect = mix(uvWave2, uvTwist, scroll_pow * 0.5);
    vec2 modeChange = mix(powEffect, uvWave2, mode);
    vec2 modeEffect2 = mix(uvDepth2, uvTwist, 0.5);
    vec2 transitionEffect = mix(modeChange, modeEffect2, modeChangePow);

    vec2 deviceOriginal = mix(uvTwist2, uvTwist, .0);
    vec2 deviceEffect = mix(modeChange, deviceOriginal, device);
    vec2 finalUV = mix(deviceEffect, transitionEffect, modeChangePow);

    float edgeDarkness = smoothstep(0.3, 0., uv.x) + smoothstep(0.7, 1., uv.x);
    edgeDarkness = clamp(edgeDarkness, 0.0, 1.0);
    vec4 baseColor = texture2D(tDiffuse, finalUV);
    vec4 darkenedColor = baseColor * (1.0 - edgeDarkness * 0.8);

    gl_FragColor = mix(baseColor, darkenedColor, mode);
  }
}
`;

const photoVertexShader = /* glsl */ `
varying vec2 vUv;
uniform int u_type;
uniform float pw;
const float curvePower = 5.0;

void main() {
  vUv = uv;
  if (u_type == 1) {
    float normalizedX = position.x / 1.0;
    float tz = pw * curvePower * normalizedX;
    vec3 newPosition = vec3(position.x, position.y, tz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
}
`;

const photoFragmentShader = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tA;
uniform vec2 vUvScale;
uniform float opacityN;
uniform float mode;

void main() {
  vec2 uv = (vUv - 0.5) * vUvScale + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; }

  vec4 color = texture2D(tA, uv);
  float gray = (color.r + color.g + color.b) / 3.0;
  vec4 gridColor = mix(vec4(gray, gray, gray, opacityN), color, 1.0 - opacityN);

  vec4 colorD = texture2D(tA, uv);
  colorD.rgb += 0.01;
  vec4 colorC = texture2D(tA, uv);
  colorC.rgb += 0.05;
  vec4 fullColor = mix(colorC, colorD, mode);

  gl_FragColor = mix(gridColor, fullColor, mode);
}
`;

type AppState = {
	time: number;
	pm: number;
};

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

function createHomeScene(app: AppState & { scene: Scene; isMobile: boolean }) {
	const loader = new TextureLoader();
	loader.setCrossOrigin("anonymous");
	const textureCache = new Map<string, Texture>();
	const meshedFrames = new WeakSet<HTMLElement>();

	const groups: Record<string, CategoryGroup> = {
		cateInterior: { group: new Group(), elements: [] },
		catePortrait: { group: new Group(), elements: [] },
		cateLandscape: { group: new Group(), elements: [] },
	};

	const effectUniforms = {
		tDiffuse: { value: null as unknown },
		u_type: { value: 1 },
		scroll_pow: { value: 0 },
		modeChangePow: { value: 0 },
		mode: { value: 0 },
		device: { value: app.isMobile ? 0.5 : 0 },
	};

	function textureForImage(img: HTMLImageElement) {
		const src = img.dataset.jsSrc ?? img.currentSrc ?? img.src;
		const cached = textureCache.get(src);
		if (cached) return cached;

		const tex = loader.load(src);
		tex.colorSpace = SRGBColorSpace;
		textureCache.set(src, tex);
		return tex;
	}

	function createMaterial(texture: Texture) {
		return new ShaderMaterial({
			side: DoubleSide,
			transparent: true,
			uniforms: {
				tA: { value: texture },
				vUvScale: { value: new Vector2(1, 1) },
				opacityN: { value: 0.2 },
				mode: { value: galleryParams.mode },
				u_type: { value: 1 },
				pw: { value: 0 },
			},
			fragmentShader: photoFragmentShader,
			vertexShader: photoVertexShader,
		});
	}

	function getImageAspect(img: HTMLImageElement) {
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

	function setPosition(mesh: Mesh, frame: HTMLElement) {
		const rect = frame.getBoundingClientRect();
		const vw = window._w ?? window.innerWidth;
		const vh = window._h ?? window.innerHeight;
		mesh.position.x = rect.left + rect.width / 2 - vw / 2;
		mesh.position.y = vh / 2 - rect.top - rect.height / 2;
	}

	function addToGroup(mesh: Mesh, category: string, element: HTMLElement) {
		const key =
			(
				{
					interior: "cateInterior",
					portrait: "catePortrait",
					landscape: "cateLandscape",
				} as const
			)[category as "interior" | "portrait" | "landscape"] ?? "cateInterior";
		groups[key].group.add(mesh);
		groups[key].elements.push({ element, mesh });
	}

	function createMeshForFrame(frame: HTMLElement) {
		if (meshedFrames.has(frame)) return;
		const img = frame.querySelector<HTMLImageElement>(".gl-i");
		if (!img?.dataset.jsSrc) return;

		const rect = frame.getBoundingClientRect();
		const tex = textureForImage(img);
		const geo = new PlaneGeometry(
			Math.max(rect.width, 1),
			Math.max(rect.height, 1),
			PLANE_SEGMENTS,
			PLANE_SEGMENTS,
		);
		const mat = createMaterial(tex);
		const mesh = new Mesh(geo, mat);
		setPosition(mesh, frame);
		addToGroup(mesh, img.dataset.category ?? "interior", frame);
		meshedFrames.add(frame);
	}

	function ensureMeshes(root: HTMLElement) {
		const frames = root.querySelectorAll<HTMLElement>(".c-section .gl-img");
		for (const frame of frames) {
			createMeshForFrame(frame);
		}
	}

	function syncMeshes(root: HTMLElement) {
		for (const g of Object.values(groups)) {
			const kept: typeof g.elements = [];
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
		ensureMeshes(root);
	}

	function resizeGeometry(mesh: Mesh, width: number, height: number) {
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

	function updateMesh(frame: HTMLElement, mesh: Mesh, power: ScrollPower) {
		const img = frame.querySelector<HTMLImageElement>(".gl-i");
		if (!img) return;

		const frameW = Math.max(frame.clientWidth, 1);
		const frameH = Math.max(frame.clientHeight, 1);
		resizeGeometry(mesh, frameW, frameH);
		const frameAspect = frameW / frameH;
		const imgAspect = getImageAspect(img);
		const geo = mesh.geometry as PlaneGeometry;
		const scaleX =
			frameAspect > imgAspect
				? (frameAspect / imgAspect) * (frameH / geo.parameters.height)
				: frameW / geo.parameters.width;
		const scaleY =
			frameAspect > imgAspect
				? frameH / geo.parameters.height
				: (imgAspect / frameAspect) * (frameW / geo.parameters.width);

		app.time += 1e-4;
		const u = (mesh.material as ShaderMaterial).uniforms;
		u.vUvScale.value.set(
			frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
			frameAspect > imgAspect ? imgAspect / frameAspect : 1,
		);
		u.pw.value = (power.pow2.value ?? 0) * app.pm * galleryParams.mode;
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

	let initRaf = 0;

	const init = (root: HTMLElement, onReady?: () => void) => {
		for (const g of Object.values(groups)) {
			app.scene.add(g.group);
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
				createMeshForFrame(queue[index]);
			}
			if (index < queue.length) {
				initRaf = requestAnimationFrame(step);
			} else {
				onReady?.();
			}
		};

		step();
	};

	const effectTick = (
		power: ScrollPower,
		_pm: number,
		_currentCategory: string,
	) => {
		for (const g of Object.values(groups)) {
			for (const { element, mesh } of g.elements) {
				updateMesh(element, mesh, power);
			}
		}

		effectUniforms.scroll_pow.value = power.pow1.value ?? 0;
		effectUniforms.modeChangePow.value = galleryParams.modeChangePow;
		effectUniforms.mode.value = galleryParams.mode;
	};

	const onResize = () => {
		for (const g of Object.values(groups)) {
			for (const { element, mesh } of g.elements) {
				const img = element.querySelector<HTMLImageElement>(".gl-i");
				if (!img) continue;
				const frameW = Math.max(element.clientWidth, 1);
				const frameH = Math.max(element.clientHeight, 1);
				resizeGeometry(mesh, frameW, frameH);
				setPosition(mesh, element);
				const frameAspect = frameW / frameH;
				const imgAspect = getImageAspect(img);
				const u = (mesh.material as ShaderMaterial).uniforms;
				u.vUvScale.value.set(
					frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
					frameAspect > imgAspect ? imgAspect / frameAspect : 1,
				);
			}
		}
	};

	const destroy = () => {
		cancelAnimationFrame(initRaf);
		for (const g of Object.values(groups)) {
			g.group.traverse((obj) => {
				if (obj instanceof Mesh) {
					obj.geometry.dispose();
					(obj.material as ShaderMaterial).dispose();
				}
			});
			app.scene.remove(g.group);
		}
		for (const tex of textureCache.values()) {
			tex.dispose();
		}
		textureCache.clear();
	};

	return {
		groups,
		effectUniforms,
		init,
		syncMeshes,
		effectTick,
		onResize,
		destroy,
	};
}

export function createCanvasEngine(canvasWrap: HTMLElement) {
	const w = window.innerWidth;
	const h = window.innerHeight;
	const res = Math.min(window.devicePixelRatio, 2);
	const isMobile = w < 680;

	const state: AppState = {
		time: 0,
		pm: 0.1,
	};

	const scene = new Scene();
	const canvas = document.createElement("canvas");
	canvasWrap.appendChild(canvas);

	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setClearColor(0, 0);
	renderer.setPixelRatio(res);
	renderer.setSize(w, h);

	const fov2 = 50;
	const far = -h / 2 / Math.tan((fov2 * Math.PI) / 180 / 2);
	const camera = new PerspectiveCamera(fov2, w / h, 0.1, far - w);
	camera.position.set(0, 0, -far);

	const homeScene = createHomeScene({ scene, ...state, isMobile });

	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));

	const compositeMat = new ShaderMaterial({
		uniforms: homeScene.effectUniforms,
		vertexShader: compositeVertexShader,
		fragmentShader: compositeFragmentShader,
	});
	const compositePass = new ShaderPass(compositeMat);
	compositePass.renderToScreen = true;
	composer.addPass(compositePass);

	const onWheelDir = (e: WheelEvent) => {
		const dx = e.deltaX || 0;
		const dy = e.deltaY || 0;
		const dir = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
		state.pm = dir > 0 ? 0.1 : -0.1;
	};
	window.addEventListener("wheel", onWheelDir, { passive: true });

	const stillPower = {
		pow1: { value: 0 },
		pow2: { value: 0 },
	} as ScrollPower;

	const warmupRender = () => {
		homeScene.effectTick(stillPower, state.pm, "interior");
		composer.render();
	};

	const tick = (power: ScrollPower, currentCategory: string) => {
		homeScene.effectTick(power, state.pm, currentCategory);
		composer.render();
	};

	const onResize = () => {
		const nw = window._w ?? window.innerWidth;
		const nh = window._h ?? window.innerHeight;
		const nextFar = -nh / 2 / Math.tan((fov2 * Math.PI) / 180 / 2);
		camera.far = nextFar - nw;
		camera.position.z = -nextFar;
		camera.aspect = nw / nh;
		camera.updateProjectionMatrix();
		renderer.setSize(nw, nh);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		canvas.style.width = `${nw}px`;
		canvas.style.height = `${nh}px`;
		composer.setSize(nw, nh);
		homeScene.onResize();
	};

	const destroy = () => {
		window.removeEventListener("wheel", onWheelDir);
		homeScene.destroy();
		composer.dispose();
		renderer.dispose();
		canvas.remove();
	};

	return { homeScene, tick, warmupRender, onResize, destroy };
}

export type CanvasEngine = ReturnType<typeof createCanvasEngine>;
