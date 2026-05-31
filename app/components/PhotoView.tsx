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
import { CATEGORY_UI, galleryImages, imageUrl } from "~/data/gallery";
import { PhotoViewBgImage } from "~/components/PhotoViewImage";
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
	worldRectToScreen,
	type PhotoViewScreenRect,
} from "~/lib/photoViewLayout";
import { PhotoViewThumbList } from "~/lib/photoViewThumbList";
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
	const rootRef = useRef<HTMLDivElement>(null);
	const heroWrapRef = useRef<HTMLDivElement>(null);
	const heroImgRef = useRef<HTMLDivElement>(null);
	const thumbListRef = useRef<PhotoViewThumbList | null>(null);
	const flyTweenRef = useRef<gsap.core.Tween | null>(null);
	const closingAnimRef = useRef(false);
	const openedRef = useRef(false);
	const [showLayer, setShowLayer] = useState(false);

	const cateKey = CATE_ID_TO_KEY[state.category];
	const images = galleryImages[cateKey];
	const activeImage = images[state.activeIndex];
	const categoryLabel =
		CATEGORY_UI.find((c) => c.id === state.category)?.label ?? state.category;

	const setHeroRect = useCallback((rect: PhotoViewScreenRect) => {
		const el = heroWrapRef.current;
		if (!el) return;
		Object.assign(el.style, screenStyle(rect));
	}, []);

	const applyHeroSrc = useCallback(
		(src: string, img = activeImage) => {
			const node = heroImgRef.current;
			if (!node || !img) return;
			const medium = imageUrl(img.medium);
			node.setAttribute("src", src);
			node.style.backgroundImage = `url("${src === medium ? medium : src}")`;
			node.style.aspectRatio = `${img.width} / ${img.height}`;
		},
		[activeImage],
	);

	const openPhotoListImmediately = useCallback(() => {
		const view = getPhotoViewState();
		const registry = getGalleryMeshRegistry();
		const heroEl = heroWrapRef.current;
		if (!registry || !heroEl) return false;

		const cateImages = galleryImages[CATE_ID_TO_KEY[view.category]];
		const hero = cateImages[view.activeIndex] ?? cateImages[0];
		if (!hero) return false;

		const aspect = getImageAspect(hero);
		const target = worldRectToScreen(heroCenterRect(aspect));

		flyTweenRef.current?.kill();
		applyHeroSrc(view.heroSrc, hero);
		setHeroRect(target);
		registry.setWallMeshesHidden(true);
		registry.effectUniforms.u_type.value = 0;
		setShowLayer(true);
		markPhotoViewUiReady();
		return true;
	}, [applyHeroSrc, setHeroRect]);

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
			thumbListRef.current?.destroy();
			thumbListRef.current = null;
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
			if (!openPhotoListImmediately()) {
				openedRef.current = false;
				getGalleryMeshRegistry()?.restoreWallMeshes();
				closePhotoView();
			}
		}
	}, [state.open, openPhotoListImmediately]);

	useEffect(() => {
		if (!state.open || !state.uiReady) {
			thumbListRef.current?.destroy();
			thumbListRef.current = null;
			return;
		}

		const root = rootRef.current;
		if (!root) return;

		const cateImages = galleryImages[CATE_ID_TO_KEY[state.category]];
		thumbListRef.current?.destroy();
		thumbListRef.current = new PhotoViewThumbList(
			root,
			cateImages,
			state.activeIndex,
			(index) => {
				const next = cateImages[index];
				if (!next) return;
				setPhotoViewState({
					activeIndex: index,
					heroSrc: imageUrl(next["2048x2048"]),
				});
			},
		);

		return () => {
			thumbListRef.current?.destroy();
			thumbListRef.current = null;
		};
	}, [state.open, state.uiReady, state.category]);

	useEffect(() => {
		if (!state.open || !state.uiReady || !thumbListRef.current) return;
		thumbListRef.current.scrollToIndex(state.activeIndex, false);
	}, [state.activeIndex, state.open, state.uiReady]);

	useEffect(() => {
		if (!state.open || state.uiReady) return;
		if (!state.closing || closingAnimRef.current) return;
		runFlyOut();
	}, [state.uiReady, state.open, state.closing, runFlyOut]);

	useLayoutEffect(() => {
		if (!state.open || !heroImgRef.current) return;
		const img = images[state.activeIndex];
		if (!img) return;

		if (!state.uiReady) {
			applyHeroSrc(imageUrl(img.medium), img);
			return;
		}

		const node = heroImgRef.current;
		gsap.to(node, {
			opacity: 0,
			duration: 0.15,
			onComplete: () => {
				applyHeroSrc(state.heroSrc, img);
				gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.25 });
			},
		});
	}, [state.heroSrc, state.open, state.uiReady, state.activeIndex, images, applyHeroSrc]);

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
			}
		};

		wrap.addEventListener("pointerdown", onPointerDown, true);
		return () => wrap.removeEventListener("pointerdown", onPointerDown, true);
	}, [wrapRef]);

	useEffect(() => {
		return () => {
			flyTweenRef.current?.kill();
		};
	}, []);

	if (!showLayer && !state.open) return null;

	const heroMedium =
		activeImage != null ? imageUrl(activeImage.medium) : state.heroSrc;
	const heroW = activeImage?.width ?? 1;
	const heroH = activeImage?.height ?? 1;
	const heroSrc = state.uiReady ? state.heroSrc : heroMedium;

	return (
		<div
			ref={rootRef}
			className={`p-photo-view${state.uiReady ? " is-ui-ready" : ""}`}
			role="dialog"
			aria-modal="true"
			aria-label={`${categoryLabel} gallery`}
			aria-hidden={!state.open}
		>
			<div
				ref={heroWrapRef}
				className="p-photo-view__fly js-img__wrap js-img__bg"
				style={
					state.fromRect
						? screenStyle(worldRectToScreen(state.fromRect))
						: undefined
				}
			>
				<PhotoViewBgImage
					ref={heroImgRef}
					src={heroSrc}
					width={heroW}
					height={heroH}
					className="js-img js-bg u-br p-photo-view__fly-img is-loaded"
				/>
			</div>

			<div className="p-cate__fixed p-photo-view__fixed">
				<div className="p-photo-view__border p-cate__border to" aria-hidden />
				<div className="p-cate__category p-photo-view__category">
					<p className="fs-s u-upper u-sub to">
						<span>Category</span>
					</p>
					<h2 className="fs-xl to">{categoryLabel}</h2>
				</div>
			</div>

			<div className="p-photo-view__rail">
				<div className="p-photo-view__scroll">
					<div className="p-cate__lists p-photo-view__lists" />
				</div>
			</div>

			<button
				type="button"
				className="p-photo-view__backdrop"
				aria-label="Close gallery view"
				onClick={() => closePhotoView()}
			/>
		</div>
	);
}
