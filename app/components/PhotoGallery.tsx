import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CATEGORY_UI, galleryCounts, galleryTotal } from "~/data/gallery";
import { buildGallerySections } from "~/lib/buildGallerySections";
import {
	destroyHomePageScript,
	homePageOnUpdateAfter,
	initHomePageScript,
	resetGridParallax,
} from "~/lib/homePageScript";
import { initKoalaLoader } from "~/lib/koalaLoader";
import { createJsScroll, type JsScroll } from "~/lib/jsScroll";
import { runHomeSplash } from "~/lib/splashAnimation";
import { initViewport } from "~/lib/viewport";
import { disposeGalleryAtlas } from "~/lib/galleryAtlas";
import { initGalleryMode } from "~/lib/galleryStore";
import {
	closePhotoView,
	registerPhotoViewContext,
	unregisterPhotoViewContext,
} from "~/lib/photoViewController";
import { PhotoViewChrome } from "~/components/PhotoViewChrome";
import type { GalleryEngineHandle } from "~/components/gallery-canvas/types";

const GalleryCanvas = lazy(() =>
	import("~/components/gallery-canvas/GalleryCanvas").then((m) => ({
		default: m.GalleryCanvas,
	})),
);

function Scope() {
	return (
		<div className="p-home__scope c-scope --grid">
			<span className="l l1" />
			<span className="l l2" />
			<span className="l l3" />
			<span className="l l4" />
		</div>
	);
}

export function PhotoGallery() {
	const shellRef = useRef<HTMLDivElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const canvasWrapRef = useRef<HTMLDivElement>(null);
	const canvasEngineRef = useRef<GalleryEngineHandle | null>(null);
	const scrollRef = useRef<JsScroll | null>(null);
	const [canvasReady, setCanvasReady] = useState(false);
	const [photoViewOpen, setPhotoViewOpen] = useState(false);
	const enginesRef = useRef<{
		scroll: JsScroll;
		canvas: GalleryEngineHandle | null;
	} | null>(null);

	useEffect(() => {
		const shell = shellRef.current;
		const wrap = wrapRef.current;
		const body = bodyRef.current;
		const content = contentRef.current;
		const canvasWrap = canvasWrapRef.current;
		if (!shell || !wrap || !body || !content || !canvasWrap) return;

		initGalleryMode();
		document.documentElement.classList.add("is-load__before");

		const stopViewport = initViewport();
		buildGallerySections(content);
		initHomePageScript(shell);

		let destroyed = false;
		let raf = 0;

		const getCanvas = () => canvasEngineRef.current;

		const syncCanvasAfterResize = () => {
			resetGridParallax(shell);
			const canvas = getCanvas();
			if (!canvas) return;
			const apply = () => {
				canvas.homeScene.syncMeshes(content);
				canvas.onResize();
				canvas.warmupRender();
			};
			apply();
			requestAnimationFrame(() => {
				apply();
				requestAnimationFrame(apply);
			});
		};

		const scroll = createJsScroll({
			wrap,
			body,
			content,
			onUpdateAfter: () => homePageOnUpdateAfter(scroll),
			onResizeAfter: syncCanvasAfterResize,
		});

		scrollRef.current = scroll;
		enginesRef.current = { scroll, canvas: null };
		registerPhotoViewContext(scroll, wrap, setPhotoViewOpen, () => {
			const canvas = canvasEngineRef.current;
			const content = contentRef.current;
			if (!canvas || !content) return;
			canvas.homeScene.syncMeshes(content);
			canvas.onResize();
			canvas.warmupRender();
			requestAnimationFrame(() => {
				canvas.warmupRender();
				canvas.onResize();
			});
		});
		setCanvasReady(true);

		const scrollLoop = () => {
			scroll.raf();
			raf = requestAnimationFrame(scrollLoop);
		};
		raf = requestAnimationFrame(scrollLoop);

		const stopLoader = initKoalaLoader(shell, () => {
			if (!destroyed) runHomeSplash(shell, scroll);
		});

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closePhotoView();
			}
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			destroyed = true;
			window.removeEventListener("keydown", onKeyDown);
			unregisterPhotoViewContext();
			setCanvasReady(false);
			setPhotoViewOpen(false);
			stopLoader();
			cancelAnimationFrame(raf);
			stopViewport();
			scroll.destroy();
			scrollRef.current = null;
			canvasEngineRef.current = null;
			destroyHomePageScript();
			disposeGalleryAtlas();
			enginesRef.current = null;
		};
	}, []);

	const handleEngineReady = () => {
		if (!enginesRef.current) return;
		enginesRef.current.canvas = canvasEngineRef.current;
		requestAnimationFrame(() => {
			canvasEngineRef.current?.warmupRender();
		});
	};

	const jumpToCategory = (cat: string) => {
		(window as Window & { selectedCategory?: string }).selectedCategory = cat;
		enginesRef.current?.scroll.jumpToCategory(cat);
	};

	return (
		<div
			className={`xhr-wrap${photoViewOpen ? " is-photo-view-open" : ""}`}
			data-xhr-namespace="home"
			ref={shellRef}
		>
			<PhotoViewChrome />
			<div className="js-wrapper p-home" ref={wrapRef}>
				<div className="js-page__cover" />
				<div className="js-page">
					<div className="js-body" data-dir="hr" ref={bodyRef}>
						<div className="c-content js-gl__wrap" ref={contentRef} />
					</div>
				</div>

				<div className="p-home__fixed to">
					<div className="p-home__category to">
						<div className="p-home__category--title">
							{CATEGORY_UI.map(({ id, label }) => (
								<a
									key={id}
									href={`/${id}`}
									className={`p-home__category--item ${id === "interior" ? "active" : ""}`}
									data-category={id}
									onClick={(e) => {
										e.preventDefault();
										jumpToCategory(id);
									}}
								>
									<h2 className="fs-xl">{label}</h2>
									<p className="--n fs-s">( {galleryCounts[id]} )</p>
								</a>
							))}
						</div>
						<p className="p-home__category--all fs-s">
							<span className="o">
								<span className="t"> /{galleryTotal}Photos </span>
							</span>
						</p>
					</div>

				</div>

				<div className="js-canvas__wrap" ref={canvasWrapRef} aria-hidden="true">
					{canvasReady ? (
						<Suspense fallback={null}>
							<GalleryCanvas
								contentRef={contentRef}
								wrapRef={wrapRef}
								engineRef={canvasEngineRef}
								scrollRef={scrollRef}
								onEngineReady={handleEngineReady}
							/>
						</Suspense>
					) : null}
				</div>
			</div>

			<div className="c-scrollbar">
				<div className="c-thumb">
					<div className="c-pivot" />
					<div className="c-pivot" />
				</div>
			</div>

			<div className="l-splash">
				<div className="l-splash__front">
					<div className="l-splash__front-wrap">
						<div className="l-splash__front-inner">
							<div className="l-splash__front--image">
								<img src="/assets/img/f.jpg.webp" alt="" />
							</div>
						</div>
					</div>
					<div className="l-splash__front-bg" />
				</div>
				<div className="l-splash__back">
					<div className="l-splash__title">
						<h1 className="fs-xxl u-upper">
							<div className="in">
								{"Photoyoshi".split("").map((ch, i) => (
									<span key={`in-${i}`}>{ch}</span>
								))}
							</div>
							<div className="out">
								{"Photoyoshi".split("").map((ch, i) => (
									<span key={`out-${i}`}>{ch}</span>
								))}
							</div>
						</h1>
					</div>
					<div className="l-splash__middle">
						<Scope />
						<Scope />
					</div>
					<div className="l-splash__bottom">
						<div className="l-splash__tag">
							<img src="/assets/img/tag.svg" alt="" />
						</div>
						<p className="l-splash__text fs-s">
							Takamitsu Motoyoshi is a photographer based in Japan.
							“Photoyoshi” is a word that combines “photo” and “Motoyoshi.”
						</p>
						<p className="l-splash__loader fs-l">
							<span className="l-splash__num">000</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
