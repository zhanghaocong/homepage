import { useAtomValue } from "jotai/react";
import gsap from "gsap";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type RefObject,
} from "react";
import { galleryImages, imageUrl, type CateImage } from "~/data/gallery";
import { pickWallLayoutIdAt } from "~/lib/galleryWallPick";
import { getGalleryMeshRegistry } from "~/lib/galleryRegistryBridge";
import {
	completeClosePhotoView,
	closePhotoView,
	getPhotoViewScroll,
	getPhotoViewShell,
	isPhotoViewClosing,
	markPhotoViewUiReady,
	openPhotoViewFromLayoutId,
	preparePhotoViewWallReveal,
} from "~/lib/photoViewController";
import { runPhotoViewSplashExit } from "~/lib/splashAnimation";
import {
	getImageAspect,
	heroCenterRect,
	heroSplashHandoffRect,
	nearestThumbIndex,
	scrollOffsetForThumbCenter,
	thumbLayoutForIndex,
	thumbScrollBounds,
	worldRectToScreen,
	type PhotoViewScreenRect,
} from "~/lib/photoViewLayout";
import {
	CATE_ID_TO_KEY,
	getPhotoViewState,
	photoViewAtom,
	photoViewStore,
	setPhotoViewState,
} from "~/lib/photoViewStore";

type PhotoViewProps = {
	wrapRef: RefObject<HTMLElement | null>;
};

function screenStyle(rect: PhotoViewScreenRect): React.CSSProperties {
	return {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	};
}

function animateScreenRect(
	el: HTMLElement,
	to: PhotoViewScreenRect,
	opts: gsap.TweenVars,
) {
	return gsap.to(el, {
		left: to.left,
		top: to.top,
		width: to.width,
		height: to.height,
		...opts,
	});
}

export function PhotoView({ wrapRef }: PhotoViewProps) {
	const state = useAtomValue(photoViewAtom, { store: photoViewStore });
	const heroWrapRef = useRef<HTMLDivElement>(null);
	const heroImgRef = useRef<HTMLImageElement>(null);
	const thumbRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
	const flyTweenRef = useRef<gsap.core.Tween | null>(null);
	const closingAnimRef = useRef(false);
	const openedRef = useRef(false);
	const scrollOffsetRef = useRef(0);
	const [showLayer, setShowLayer] = useState(false);

	const cateKey = CATE_ID_TO_KEY[state.category];
	const images = galleryImages[cateKey];
	const activeImage = images[state.activeIndex];

	const setHeroRect = useCallback((rect: PhotoViewScreenRect) => {
		const el = heroWrapRef.current;
		if (!el) return;
		Object.assign(el.style, screenStyle(rect));
	}, []);

	const runFlyIn = useCallback(() => {
		const view = getPhotoViewState();
		const registry = getGalleryMeshRegistry();
		const heroEl = heroWrapRef.current;
		if (!registry || !heroEl || !view.fromRect) return false;

		const cateImages = galleryImages[CATE_ID_TO_KEY[view.category]];
		const hero = cateImages[view.activeIndex] ?? cateImages[0];
		if (!hero) return false;

		const aspect = getImageAspect(hero);
		const from = worldRectToScreen(view.fromRect);
		const target = worldRectToScreen(heroCenterRect(aspect));

		setHeroRect(from);
		registry.setWallMeshesHidden(true);
		registry.effectUniforms.u_type.value = 0;
		setShowLayer(true);

		flyTweenRef.current?.kill();
		flyTweenRef.current = animateScreenRect(heroEl, target, {
			duration: 1.2,
			ease: "power4.inOut",
			onComplete: () => markPhotoViewUiReady(),
		});
		return true;
	}, [setHeroRect]);

	const startSplashExit = useCallback(() => {
		const view = getPhotoViewState();
		const shell = getPhotoViewShell();
		const scroll = getPhotoViewScroll();
		const registry = getGalleryMeshRegistry();

		preparePhotoViewWallReveal();
		registry?.restoreWallMeshes();
		registry?.onResize();
		if (registry) registry.effectUniforms.u_type.value = 1;

		if (!shell || !scroll) {
			completeClosePhotoView();
			closingAnimRef.current = false;
			setShowLayer(false);
			return;
		}

		runPhotoViewSplashExit(shell, scroll, view.heroSrc, {
			onReveal: () => registry?.onResize(),
			onLayoutTick: () => registry?.onResize(),
			onComplete: () => {
				completeClosePhotoView();
				closingAnimRef.current = false;
				setShowLayer(false);
			},
		});
	}, []);

	const runFlyOut = useCallback(() => {
		const view = getPhotoViewState();
		const heroEl = heroWrapRef.current;
		if (!heroEl) {
			startSplashExit();
			return;
		}

		const exitWorld = heroSplashHandoffRect(view.sourceLayoutId);
		closingAnimRef.current = true;
		flyTweenRef.current?.kill();

		const finishHandoff = () => {
			setShowLayer(false);
			startSplashExit();
		};

		if (!exitWorld) {
			finishHandoff();
			return;
		}

		const exit = worldRectToScreen(exitWorld);
		flyTweenRef.current = animateScreenRect(heroEl, exit, {
			duration: 1.2,
			ease: "power4.inOut",
			onComplete: finishHandoff,
		});
	}, [startSplashExit]);

	const layoutThumbs = useCallback(
		(cateImages: CateImage[], activeIndex: number) => {
			const scrollOffset = scrollOffsetRef.current;
			for (const [index, el] of thumbRefs.current) {
				const layout = thumbLayoutForIndex(cateImages, index, scrollOffset);
				const screen = worldRectToScreen(layout);
				Object.assign(el.style, screenStyle(screen));
				el.style.opacity = index === activeIndex ? "1" : "0.55";
			}
		},
		[],
	);

	const rebuildThumbs = useCallback(
		(cateImages: CateImage[], activeIndex: number) => {
			scrollOffsetRef.current = scrollOffsetForThumbCenter(
				cateImages,
				activeIndex,
			);
			layoutThumbs(cateImages, activeIndex);
			const materials = [...thumbRefs.current.values()].map((el) => el);
			gsap.from(materials, {
				duration: 1.2,
				opacity: 0,
				stagger: 0.04,
				ease: "power4.out",
			});
		},
		[layoutThumbs],
	);

	useEffect(() => {
		const registry = getGalleryMeshRegistry();
		if (!registry) return;
		const passthrough = state.open && !state.closing;
		registry.effectUniforms.u_type.value = passthrough ? 0 : 1;
	}, [state.open, state.closing]);

	useEffect(() => {
		if (!state.open) {
			openedRef.current = false;
			flyTweenRef.current?.kill();
			scrollOffsetRef.current = 0;
			const registry = getGalleryMeshRegistry();
			registry?.restoreWallMeshes();
			registry?.onResize();
			setShowLayer(false);
			return;
		}

		if (
			!openedRef.current &&
			!state.uiReady &&
			!closingAnimRef.current &&
			!isPhotoViewClosing()
		) {
			openedRef.current = true;
			if (!runFlyIn()) {
				openedRef.current = false;
				getGalleryMeshRegistry()?.restoreWallMeshes();
				closePhotoView();
			}
		}
	}, [state.open, runFlyIn]);

	useLayoutEffect(() => {
		if (!state.open || !state.uiReady) return;
		rebuildThumbs(images, state.activeIndex);
	}, [state.open, state.uiReady, state.category, rebuildThumbs, images]);

	useEffect(() => {
		if (!state.open || !state.uiReady) return;
		scrollOffsetRef.current = scrollOffsetForThumbCenter(
			images,
			state.activeIndex,
		);
		layoutThumbs(images, state.activeIndex);
	}, [state.activeIndex, state.uiReady, state.open, layoutThumbs, images]);

	useEffect(() => {
		if (!state.open || state.uiReady) return;
		if (!state.closing || closingAnimRef.current) return;
		runFlyOut();
	}, [state.uiReady, state.open, state.closing, runFlyOut]);

	useLayoutEffect(() => {
		const heroImg = heroImgRef.current;
		if (!heroImg || !state.open) return;
		const nextSrc = state.heroSrc;
		if (heroImg.src === nextSrc || heroImg.getAttribute("src") === nextSrc) return;

		if (!state.uiReady) {
			heroImg.src = nextSrc;
			return;
		}

		gsap.to(heroImg, {
			opacity: 0,
			duration: 0.15,
			onComplete: () => {
				heroImg.src = nextSrc;
				gsap.fromTo(
					heroImg,
					{ opacity: 0 },
					{ opacity: 1, duration: 0.25 },
				);
			},
		});
	}, [state.heroSrc, state.open, state.uiReady]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			if (closingAnimRef.current || isPhotoViewClosing()) return;
			const current = getPhotoViewState();

			if (!current.open) {
				const layoutId = pickWallLayoutIdAt(event.clientX, event.clientY);
				if (!layoutId) return;
				event.preventDefault();
				event.stopPropagation();
				openPhotoViewFromLayoutId(layoutId);
				return;
			}

			if (!current.uiReady) return;

			const target = event.target as HTMLElement;
			const thumbBtn = target.closest<HTMLButtonElement>(
				"[data-photo-view-thumb]",
			);
			if (thumbBtn) {
				const index = Number(thumbBtn.dataset.photoViewThumb);
				if (Number.isNaN(index)) return;
				event.preventDefault();
				event.stopPropagation();
				const cateImages = galleryImages[CATE_ID_TO_KEY[current.category]];
				const next = cateImages[index];
				if (!next) return;
				scrollOffsetRef.current = scrollOffsetForThumbCenter(
					cateImages,
					index,
				);
				setPhotoViewState({
					activeIndex: index,
					heroSrc: imageUrl(next["2048x2048"]),
				});
				return;
			}

			const heroEl = heroWrapRef.current;
			if (heroEl?.contains(target)) return;

			event.preventDefault();
			closePhotoView();
		};

		const onWheel = (event: WheelEvent) => {
			const current = getPhotoViewState();
			if (!current.open || !current.uiReady) return;
			event.preventDefault();
			const cateImages = galleryImages[CATE_ID_TO_KEY[current.category]];
			const bounds = thumbScrollBounds(cateImages);
			scrollOffsetRef.current = Math.min(
				bounds.max,
				Math.max(bounds.min, scrollOffsetRef.current - event.deltaY * 0.35),
			);
			layoutThumbs(cateImages, current.activeIndex);
			const nextIndex = nearestThumbIndex(
				cateImages,
				scrollOffsetRef.current,
			);
			if (nextIndex !== current.activeIndex) {
				const next = cateImages[nextIndex];
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
	}, [layoutThumbs, wrapRef]);

	useEffect(() => {
		return () => {
			flyTweenRef.current?.kill();
		};
	}, []);

	if (!showLayer && !state.open) return null;

	const heroMedium =
		activeImage != null ? imageUrl(activeImage.medium) : state.heroSrc;

	return (
		<div
			className="photo-view"
			aria-hidden={!state.open}
			data-ui-ready={state.uiReady ? "" : undefined}
		>
			<div
				ref={heroWrapRef}
				className="photo-view__hero"
				style={state.fromRect ? screenStyle(worldRectToScreen(state.fromRect)) : undefined}
			>
				<img
					ref={heroImgRef}
					className="photo-view__hero-img"
					src={state.uiReady ? state.heroSrc : heroMedium}
					alt=""
					draggable={false}
				/>
			</div>

			{state.uiReady ? (
				<div className="photo-view__thumbs" aria-hidden>
					{images.map((img, index) => (
						<button
							key={`${img.medium}-${index}`}
							type="button"
							ref={(node) => {
								if (node) thumbRefs.current.set(index, node);
								else thumbRefs.current.delete(index);
							}}
							className="photo-view__thumb"
							data-photo-view-thumb={index}
							style={{
								...screenStyle(
									worldRectToScreen(
										thumbLayoutForIndex(
											images,
											index,
											scrollOffsetRef.current,
										),
									),
								),
								opacity: index === state.activeIndex ? 1 : 0.55,
							}}
							tabIndex={-1}
						>
							<img
								src={imageUrl(img.medium)}
								alt=""
								draggable={false}
								className="photo-view__thumb-img"
							/>
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
