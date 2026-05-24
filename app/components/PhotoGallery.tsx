import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CATEGORY_UI, galleryCounts, galleryTotal } from "~/data/gallery";
import { buildGallerySections } from "~/lib/buildGallerySections";
import {
	destroyHomePageScript,
	homePageOnUpdateAfter,
	initHomePageScript,
} from "~/lib/homePageScript";
import { initKoalaLoader } from "~/lib/koalaLoader";
import { createJsScroll, type JsScroll } from "~/lib/jsScroll";
import {
	destroyModeSwitch,
	initModeSwitch,
} from "~/lib/modeSwitch";
import { runHomeSplash } from "~/lib/splashAnimation";
import { initViewport, syncViewportGlobals } from "~/lib/viewport";
import { setGalleryMode } from "~/lib/galleryParams";

function Scope({ variant }: { variant: "grid" | "full" }) {
	return (
		<div className={`p-home__scope c-scope --${variant}`}>
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
	const enginesRef = useRef<{
		scroll: JsScroll;
		canvas: import("~/components/CanvasEngine").CanvasEngine | null;
	} | null>(null);

	useEffect(() => {
		const shell = shellRef.current;
		const wrap = wrapRef.current;
		const body = bodyRef.current;
		const content = contentRef.current;
		const canvasWrap = canvasWrapRef.current;
		if (!shell || !wrap || !body || !content || !canvasWrap) return;

		setGalleryMode("grid");
		document.documentElement.dataset.mode = "grid";
		document.documentElement.classList.add("l-light", "is-load__before");

		const stopViewport = initViewport();
		buildGallerySections(content);
		initHomePageScript(shell);
		void import("~/components/CanvasEngine");

		const scroll = createJsScroll({
			wrap,
			body,
			content,
			onUpdateAfter: () => homePageOnUpdateAfter(scroll),
		});

		initModeSwitch(wrap, scroll);

		let destroyed = false;
		let canvas: import("~/components/CanvasEngine").CanvasEngine | null = null;
		let raf = 0;

		const scrollLoop = () => {
			scroll.raf();
			raf = requestAnimationFrame(scrollLoop);
		};
		raf = requestAnimationFrame(scrollLoop);

		const canvasLoop = () => {
			if (destroyed || !canvas) return;
			canvas.tick(scroll.power, scroll.currentCategory);
		};

		void (async () => {
			const { createCanvasEngine } = await import("~/components/CanvasEngine");
			if (destroyed) return;
			canvas = createCanvasEngine(canvasWrap);
			enginesRef.current = { scroll, canvas };
			gsap.ticker.add(canvasLoop);
			canvas.homeScene.init(content, () => {
				requestAnimationFrame(() => {
					if (!destroyed) canvas?.warmupRender();
				});
			});
		})();

		const stopLoader = initKoalaLoader(shell, () => {
			if (!destroyed) runHomeSplash(shell, scroll);
		});

		const onResize = () => {
			syncViewportGlobals();
			canvas?.onResize();
		};
		window.addEventListener("resize", onResize);

		return () => {
			destroyed = true;
			stopLoader();
			gsap.ticker.remove(canvasLoop);
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			stopViewport();
			scroll.destroy();
			canvas?.destroy();
			destroyModeSwitch();
			destroyHomePageScript();
			enginesRef.current = null;
		};
	}, []);

	const jumpToCategory = (cat: string) => {
		(window as Window & { selectedCategory?: string }).selectedCategory = cat;
		enginesRef.current?.scroll.jumpToCategory(cat);
	};

	return (
		<div className="xhr-wrap" data-xhr-namespace="home" ref={shellRef}>
			<div className="js-wrapper p-home" ref={wrapRef}>
				<div className="js-page__cover" />
				<div className="js-page">
					<div className="js-body" data-dir="hr" ref={bodyRef}>
						<div className="c-content js-gl__wrap" ref={contentRef} />
					</div>
				</div>

				<div className="p-home__fixed to">
					<Scope variant="grid" />
					<Scope variant="full" />
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

					<div className="p-home__mode to" aria-label="View mode">
						<button
							type="button"
							className="js-modeGrid c-btn c-btn__grid"
							aria-label="GridMode"
						>
							<div className="c-btn__grid--inner">
								{Array.from({ length: 4 }).map((_, i) => (
									<span key={i} className="c-btn__grid l">
										<span />
										<span />
										<span />
									</span>
								))}
							</div>
						</button>
						<button
							type="button"
							className="js-modeFull c-btn c-btn__full"
							aria-label="FullMode"
						>
							<div className="c-btn__full--inner">
								<span className="c-btn__full l l1">
									<span />
								</span>
								<span className="c-btn__full l l2">
									<span />
								</span>
								<span className="c-btn__full l l3">
									<span />
								</span>
								<span className="c-btn__full l l4">
									<span />
								</span>
							</div>
						</button>
					</div>
				</div>

				<div className="js-canvas__wrap" ref={canvasWrapRef} aria-hidden="true" />
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
						<Scope variant="grid" />
						<Scope variant="grid" />
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
