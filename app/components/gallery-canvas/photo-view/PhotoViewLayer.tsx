import { useThree } from "@react-three/fiber";
import { useAtomValue } from "jotai/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import {
	Group,
	Mesh,
	PerspectiveCamera,
	PlaneGeometry,
	Raycaster,
	Vector2,
	Vector4,
} from "three";
import { Text } from "@react-three/drei";
import { CATEGORY_UI, galleryImages, imageUrl } from "~/data/gallery";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import {
	completeClosePhotoView,
	closePhotoView,
	isPhotoViewClosing,
	markPhotoViewUiReady,
	requestOpenPhotoView,
} from "~/lib/photoViewController";
import {
	CATE_ID_TO_KEY,
	getPhotoViewState,
	photoViewAtom,
	photoViewStore,
	setPhotoViewState,
} from "~/lib/photoViewStore";
import {
	applyMeshRect,
	clientToNdc,
	getImageAspect,
	getViewport,
	heroCenterRect,
	meshWorldRect,
	nearestThumbIndex,
	rectFromDomFrame,
	thumbLayoutForIndex,
	thumbRailX,
	thumbScrollBounds,
	scrollOffsetForThumbCenter,
	categoryLabelX,
} from "~/lib/photoViewLayout";
import {
	createPhotoViewPlane,
	disposePhotoViewPlane,
	setPhotoViewPlaneUv,
} from "~/lib/photoViewMeshes";
import {
	galleryAtlasKeyFromSrc,
	getGalleryAtlasSprite,
	getGalleryAtlasTexture,
	spriteToUvRect,
} from "~/lib/galleryAtlas";
import type { CateImage } from "~/data/gallery";

type PhotoViewLayerProps = {
	meshRegistry: GalleryMeshRegistry;
	wrapRef: React.RefObject<HTMLElement | null>;
};

function uvRectForPath(path: string) {
	const key = galleryAtlasKeyFromSrc(path.replace(/\.webp$/, ""));
	const sprite = getGalleryAtlasSprite(key);
	if (!sprite) return null;
	return spriteToUvRect(sprite);
}

export function PhotoViewLayer({ meshRegistry, wrapRef }: PhotoViewLayerProps) {
	const state = useAtomValue(photoViewAtom, { store: photoViewStore });
	const { scene, camera, gl } = useThree();
	const overlayRef = useRef<Group | null>(null);
	const heroRef = useRef<Mesh | null>(null);
	const thumbMeshesRef = useRef<Mesh[]>([]);
	const scrollOffsetRef = useRef(0);
	const flyTweenRef = useRef<gsap.core.Tween | null>(null);
	const closingAnimRef = useRef(false);
	const openedRef = useRef(false);

	useEffect(() => {
		const group = new Group();
		group.name = "photo-view-overlay";
		overlayRef.current = group;
		scene.add(group);
		return () => {
			flyTweenRef.current?.kill();
			if (heroRef.current) {
				disposePhotoViewPlane(heroRef.current);
				heroRef.current = null;
			}
			for (const mesh of thumbMeshesRef.current) {
				disposePhotoViewPlane(mesh);
			}
			thumbMeshesRef.current = [];
			scene.remove(group);
			overlayRef.current = null;
		};
	}, [scene]);

	const clearThumbs = () => {
		const group = overlayRef.current;
		if (!group) return;
		for (const mesh of thumbMeshesRef.current) {
			group.remove(mesh);
			disposePhotoViewPlane(mesh);
		}
		thumbMeshesRef.current = [];
	};

	const rebuildThumbs = (images: CateImage[], activeIndex: number) => {
		const atlas = getGalleryAtlasTexture();
		const group = overlayRef.current;
		if (!atlas || !group) return;

		clearThumbs();
		scrollOffsetRef.current = scrollOffsetForThumbCenter(images, activeIndex);
		const scrollOffset = scrollOffsetRef.current;

		for (let i = 0; i < images.length; i++) {
			const img = images[i];
			const uvRect = uvRectForPath(img.medium);
			if (!uvRect) continue;
			const layout = thumbLayoutForIndex(images, i, scrollOffset);
			const mesh = createPhotoViewPlane(atlas, uvRect, layout);
			mesh.userData.thumbIndex = i;
			const aspect = getImageAspect(img);
			setPhotoViewPlaneUv(mesh, uvRect, aspect);
			if (i === activeIndex) {
				(mesh.material as { opacity?: number }).opacity = 1;
			} else {
				(mesh.material as { opacity: number }).opacity = 0.55;
			}
			group.add(mesh);
			thumbMeshesRef.current.push(mesh);
		}

		gsap.from(thumbMeshesRef.current.map((m) => m.material), {
			duration: 1.2,
			opacity: 0,
			stagger: 0.04,
			ease: "power4.out",
		});
	};

	const layoutThumbs = (images: CateImage[], activeIndex: number) => {
		const scrollOffset = scrollOffsetRef.current;
		for (const mesh of thumbMeshesRef.current) {
			const i = mesh.userData.thumbIndex as number;
			const layout = thumbLayoutForIndex(images, i, scrollOffset);
			applyMeshRect(mesh, layout);
			const mat = mesh.material as { opacity: number };
			mat.opacity = i === activeIndex ? 1 : 0.55;
		}
	};

	const runFlyIn = () => {
		const view = getPhotoViewState();
		const atlas = getGalleryAtlasTexture();
		const group = overlayRef.current;
		if (!atlas || !group || !view.sourceFrame) return;

		const frame = view.sourceFrame;
		const img = frame.querySelector<HTMLImageElement>(".gl-i");
		if (!img) return;

		const entry = meshRegistry.findEntryByFrame(frame);
		const fromRect = entry
			? meshWorldRect(entry.mesh)
			: rectFromDomFrame(frame);

		const cateKey = CATE_ID_TO_KEY[view.category];
		const images = galleryImages[cateKey];
		const hero = images[view.activeIndex] ?? images[0];
		if (!hero) return;

		const uvRect = uvRectForPath(hero["2048x2048"]);
		if (!uvRect) return;

		meshRegistry.setWallMeshesHidden(true);

		if (heroRef.current) {
			group.remove(heroRef.current);
			disposePhotoViewPlane(heroRef.current);
		}

		const aspect = getImageAspect(hero);
		const heroMesh = createPhotoViewPlane(atlas, uvRect, fromRect);
		setPhotoViewPlaneUv(heroMesh, uvRect, aspect);
		heroRef.current = heroMesh;
		group.add(heroMesh);

		const target = heroCenterRect(aspect);
		const proxy = {
			x: fromRect.x,
			y: fromRect.y,
			width: fromRect.width,
			height: fromRect.height,
		};

		flyTweenRef.current?.kill();
		flyTweenRef.current = gsap.to(proxy, {
			x: target.x,
			y: target.y,
			width: target.width,
			height: target.height,
			duration: 1.2,
			ease: "power4.inOut",
			onUpdate: () => {
				if (!heroRef.current) return;
				applyMeshRect(heroRef.current, proxy);
			},
			onComplete: () => {
				markPhotoViewUiReady();
			},
		});
	};

	const runFlyOut = () => {
		const view = getPhotoViewState();
		const group = overlayRef.current;
		const hero = heroRef.current;
		const frame = view.sourceFrame;
		if (!group || !hero || !frame) {
			completeClosePhotoView();
			meshRegistry.setWallMeshesHidden(false);
			return;
		}

		const entry = meshRegistry.findEntryByFrame(frame);
		const target = entry ? meshWorldRect(entry.mesh) : rectFromDomFrame(frame);
		const proxy = {
			x: hero.position.x,
			y: hero.position.y,
			width:
				(hero.geometry as PlaneGeometry).parameters.width * hero.scale.x,
			height:
				(hero.geometry as PlaneGeometry).parameters.height * hero.scale.y,
		};

		clearThumbs();
		closingAnimRef.current = true;
		flyTweenRef.current?.kill();
		flyTweenRef.current = gsap.to(proxy, {
			x: target.x,
			y: target.y,
			width: target.width,
			height: target.height,
			duration: 0.9,
			ease: "power4.inOut",
			onUpdate: () => {
				if (!heroRef.current) return;
				applyMeshRect(heroRef.current, proxy);
			},
			onComplete: () => {
				if (heroRef.current) {
					group.remove(heroRef.current);
					disposePhotoViewPlane(heroRef.current);
					heroRef.current = null;
				}
				meshRegistry.setWallMeshesHidden(false);
				completeClosePhotoView();
				closingAnimRef.current = false;
			},
		});
	};

	useEffect(() => {
		if (!state.open) {
			openedRef.current = false;
			flyTweenRef.current?.kill();
			clearThumbs();
			if (heroRef.current && overlayRef.current) {
				overlayRef.current.remove(heroRef.current);
				disposePhotoViewPlane(heroRef.current);
				heroRef.current = null;
			}
			meshRegistry.setWallMeshesHidden(false);
			scrollOffsetRef.current = 0;
			return;
		}

		if (
			!openedRef.current &&
			!state.uiReady &&
			!closingAnimRef.current &&
			!isPhotoViewClosing()
		) {
			openedRef.current = true;
			runFlyIn();
		}
	}, [state.open]);

	useEffect(() => {
		if (!state.open || !state.uiReady) {
			clearThumbs();
			return;
		}
		const cateKey = CATE_ID_TO_KEY[state.category];
		const images = galleryImages[cateKey];
		rebuildThumbs(images, state.activeIndex);
	}, [state.open, state.uiReady, state.category]);

	useEffect(() => {
		if (!state.open || !state.uiReady) return;
		const cateKey = CATE_ID_TO_KEY[state.category];
		const images = galleryImages[cateKey];
		scrollOffsetRef.current = scrollOffsetForThumbCenter(
			images,
			state.activeIndex,
		);
		layoutThumbs(images, state.activeIndex);
	}, [state.activeIndex, state.uiReady, state.open]);

	useEffect(() => {
		if (!state.open || state.uiReady) return;
		if (!isPhotoViewClosing() || closingAnimRef.current) return;
		runFlyOut();
	}, [state.uiReady, state.open]);

	const swapHero = (path: string, aspect: number) => {
		const hero = heroRef.current;
		const atlas = getGalleryAtlasTexture();
		if (!hero || !atlas) return;
		const uvRect = uvRectForPath(path);
		if (!uvRect) return;
		const mat = hero.material as { opacity: number };
		gsap.to(mat, {
			opacity: 0,
			duration: 0.15,
			onComplete: () => {
				setPhotoViewPlaneUv(hero, uvRect, aspect);
				mat.opacity = 1;
				gsap.fromTo(mat, { opacity: 0 }, { opacity: 1, duration: 0.25 });
			},
		});
	};

	useEffect(() => {
		if (!state.open || !state.uiReady || !heroRef.current) return;
		const cateKey = CATE_ID_TO_KEY[state.category];
		const hero = galleryImages[cateKey][state.activeIndex];
		if (hero) swapHero(hero["2048x2048"], getImageAspect(hero));
	}, [state.heroSrc, state.uiReady]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;

		const raycaster = new Raycaster();
		const pointer = new Vector2();

		const pickThumbs = (clientX: number, clientY: number) => {
			const ndc = clientToNdc(clientX, clientY, gl.domElement);
			pointer.set(ndc.x, ndc.y);
			if (!(camera instanceof PerspectiveCamera)) return -1;
			raycaster.setFromCamera(pointer, camera);
			const hits = raycaster.intersectObjects(thumbMeshesRef.current, false);
			if (hits.length === 0) return -1;
			return (hits[0].object as Mesh).userData.thumbIndex as number;
		};

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			if (closingAnimRef.current || isPhotoViewClosing()) return;
			const current = getPhotoViewState();

			if (!current.open) {
				const ndc = clientToNdc(event.clientX, event.clientY, gl.domElement);
				const pick = meshRegistry.pickWallMesh(ndc.x, ndc.y, camera);
				if (!pick) return;
				event.preventDefault();
				event.stopPropagation();
				requestOpenPhotoView(pick.entry);
				return;
			}

			if (!current.uiReady) return;

			const thumbIndex = pickThumbs(event.clientX, event.clientY);
			if (thumbIndex >= 0) {
				event.preventDefault();
				event.stopPropagation();
				const cateKey = CATE_ID_TO_KEY[current.category];
				const images = galleryImages[cateKey];
				const next = images[thumbIndex];
				if (!next) return;
				scrollOffsetRef.current = scrollOffsetForThumbCenter(
					images,
					thumbIndex,
				);
				setPhotoViewState({
					activeIndex: thumbIndex,
					heroSrc: imageUrl(next["2048x2048"]),
				});
				return;
			}

			const ndc = clientToNdc(event.clientX, event.clientY, gl.domElement);
			pointer.set(ndc.x, ndc.y);
			raycaster.setFromCamera(pointer, camera);
			const heroHit =
				heroRef.current &&
				raycaster.intersectObject(heroRef.current, false).length > 0;
			if (!heroHit) {
				event.preventDefault();
				closePhotoView();
			}
		};

		const onWheel = (event: WheelEvent) => {
			const current = getPhotoViewState();
			if (!current.open || !current.uiReady) return;
			event.preventDefault();
			const cateKey = CATE_ID_TO_KEY[current.category];
			const images = galleryImages[cateKey];
			const bounds = thumbScrollBounds(images);
			scrollOffsetRef.current = Math.min(
				bounds.max,
				Math.max(bounds.min, scrollOffsetRef.current - event.deltaY * 0.35),
			);
			layoutThumbs(images, current.activeIndex);
			const nextIndex = nearestThumbIndex(images, scrollOffsetRef.current);
			if (nextIndex !== current.activeIndex) {
				const next = images[nextIndex];
				if (next) {
					setPhotoViewState({
						activeIndex: nextIndex,
						heroSrc: imageUrl(next["2048x2048"]),
					});
				}
			}
		};

		wrap.addEventListener("pointerdown", onPointerDown, true);
		wrap.addEventListener("wheel", onWheel, { passive: false, capture: true });
		return () => {
			wrap.removeEventListener("pointerdown", onPointerDown, true);
			wrap.removeEventListener("wheel", onWheel, true);
		};
	}, [camera, gl.domElement, meshRegistry, wrapRef]);

	const categoryLabel =
		CATEGORY_UI.find((c) => c.id === state.category)?.label ?? state.category;
	const labelColor = document.documentElement.classList.contains("theme-dark")
		? "#e9e6e2"
		: "#171717";

	if (!state.open) return null;

	return state.uiReady ? (
		<group renderOrder={20}>
			<Text
				position={[categoryLabelX(), 40, 2]}
				fontSize={14}
				color={labelColor}
						anchorX="left"
						anchorY="middle"
						renderOrder={20}
						font="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-500-normal.woff"
					>
						CATEGORY
					</Text>
			<Text
				position={[categoryLabelX(), 10, 2]}
				fontSize={32}
				color={labelColor}
						anchorX="left"
						anchorY="middle"
						renderOrder={20}
						font="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-500-normal.woff"
			>
				{categoryLabel}
			</Text>
		</group>
	) : null;
}
