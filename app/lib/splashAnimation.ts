import gsap from "gsap";
import {
	getGalleryMetrics,
	listAllFrameSpecs,
	recomputeGalleryMetrics,
} from "~/lib/galleryLayoutStore";
import {
	applyGalleryGsapTarget,
	galleryGsapTarget,
} from "~/lib/galleryStore";
import {
	beginSplashGather,
	endSplashGather,
	getSplashFrameTween,
	groupLayoutColumns,
	initSplashColumn,
	splashFinalFrameSize,
} from "~/lib/splashGatherState";
import type { JsScroll } from "~/lib/jsScroll";

function killSplashTweens(columns: ReturnType<typeof groupLayoutColumns>) {
	for (const column of columns) {
		for (const spec of column) {
			const tween = getSplashFrameTween(spec.id);
			if (tween) gsap.killTweensOf(tween);
		}
	}
}

export function runHomeSplash(
	root: HTMLElement,
	scroll: JsScroll,
	hooks?: {
		onGatherSet?: () => void;
		onReveal?: () => void;
		onGatherComplete?: () => void;
	},
) {
	const html = document.documentElement;
	gsap.set("canvas", { opacity: 0 });
	html.classList.add("is-load", "is-gather");
	html.classList.remove("is-load__before");

	gsap.to(root.querySelector(".l-splash__title"), { opacity: 1, duration: 0.4 });
	gsap.to(root.querySelector(".l-splash__front"), {
		opacity: 1,
		duration: 0.3,
		delay: 0.1,
	});
	gsap.to(root.querySelector(".l-splash__bottom"), {
		opacity: 1,
		duration: 0.3,
		delay: 0.15,
	});

	if (window.innerWidth < 680) {
		gsap.set(".l-splash__front-wrap", {
			clipPath: "inset(30vh 25vw 30vh 25vw)",
		});
	}

	window.setTimeout(() => {
		scroll.remeasure();
		recomputeGalleryMetrics();
		beginSplashGather();

		const metrics = getGalleryMetrics();
		const columns = groupLayoutColumns(listAllFrameSpecs());

		for (const column of columns) {
			initSplashColumn(column, metrics);
		}

		hooks?.onGatherSet?.();

		gsap.set(".to", { opacity: 0 });

		const revealGallery = () => {
			hooks?.onReveal?.();
			gsap.fromTo("canvas", { opacity: 0 }, { opacity: 1, duration: 0.85 });
			const distance = window.innerWidth < 680 ? 4.48 : 2.125;
			scroll.onScrollTo(scroll.delta1 + window._w * distance, 2.5, 0, "power4.out");

			const gatherEndDelay = 0.7 + 1.35 + 0.2;
			gsap.delayedCall(gatherEndDelay, () => {
				html.classList.remove("is-gather");
				endSplashGather();
				hooks?.onGatherComplete?.();
			});

			killSplashTweens(columns);

			for (const column of columns) {
				const center = column.find((s) => s.row === 2);
				if (center) {
					const tween = getSplashFrameTween(center.id);
					const final = splashFinalFrameSize(center, metrics);
					if (tween) {
						gsap.to(tween, {
							width: final.width,
							duration: 1.8,
							ease: "power4.out",
							delay: 0.35,
						});
						gsap.to(tween, {
							height: final.height,
							duration: 1.4,
							ease: "power4.out",
						});
					}
				}

				const row0 = column.find((s) => s.row === 0);
				const row1 = column.find((s) => s.row === 1);
				const row3 = column.find((s) => s.row === 3);
				const row4 = column.find((s) => s.row === 4);

				if (row0) {
					const t = getSplashFrameTween(row0.id);
					if (t) gsap.to(t, { y: 0, duration: 1.35, ease: "expo.out", delay: 0.7 });
				}
				if (row1) {
					const t = getSplashFrameTween(row1.id);
					if (t) gsap.to(t, { y: 0, duration: 1.35, ease: "expo.out", delay: 0.38 });
				}
				if (row3) {
					const t = getSplashFrameTween(row3.id);
					if (t) gsap.to(t, { y: 0, duration: 1.35, ease: "expo.out", delay: 0.38 });
				}
				if (row4) {
					const t = getSplashFrameTween(row4.id);
					if (t) gsap.to(t, { y: 0, duration: 1.35, ease: "expo.out", delay: 0.7 });
				}
			}

			gsap.fromTo(".to", { opacity: 0 }, { opacity: 1, duration: 0.45, delay: 1.2 });
			gsap
				.timeline()
				.fromTo(
					galleryGsapTarget,
					{
						modeChangePow: 1,
						duration: 1,
						ease: "power1.out",
						onUpdate: applyGalleryGsapTarget,
					},
					{
						modeChangePow: 0,
						duration: 1.2,
						ease: "power1.out",
						onUpdate: applyGalleryGsapTarget,
					},
				);
		};

		const tl = gsap.timeline();
		tl.to(".l-splash .l-splash__title .in span", {
			top: "-14vw",
			duration: 0.5,
			ease: "power1.in",
			stagger: 0.05,
		});
		tl.to(
			".l-splash .l-splash__title .out span",
			{ top: "0vh", duration: 0.9, ease: "power3.out", stagger: 0.05 },
			"< 0.2",
		);
		tl.to(".l-splash h1", {
			marginTop: "-30vh",
			duration: 2,
			ease: "power4.inOut",
		}, "< .2");

		if (window.innerWidth < 680) {
			if (window._w > window._h) {
				tl.to(".l-splash__front-inner", {
					width: "130%",
					duration: 1.8,
					ease: "power2.inOut",
				}, "<");
			} else {
				tl.to(".l-splash__front-inner", {
					height: "120%",
					duration: 1.8,
					ease: "power2.inOut",
				}, "<");
			}
			tl.fromTo(
				".l-splash__front-wrap",
				{ clipPath: "inset(30vh 25vw 30vh 25vw)" },
				{ clipPath: "inset(0vh 0vw 0vh 0vw)", duration: 1.8, ease: "expo.inOut" },
				"<",
			);
		} else {
			tl.to(".l-splash__front-inner", {
				width: "130%",
				duration: 1.8,
				ease: "power2.inOut",
			}, "<");
			tl.fromTo(
				".l-splash__front-wrap",
				{ clipPath: "inset(22vh 38vw 22vh 38vw)" },
				{ clipPath: "inset(0vh 0vw 0vh 0vw)", duration: 1.8, ease: "expo.inOut" },
				"<",
			);
			tl.to(".l-splash__front", { y: "-10vh", duration: 2, ease: "expo.inOut" }, "<");
		}

		tl.fromTo(
			".l-splash",
			{ clipPath: "inset(0vw 0vw 0vw 0vw)" },
			{ clipPath: "inset(0vw 0vw 100vh 0vw)", duration: 1.8, ease: "expo.inOut" },
			"<",
		);
		tl.call(revealGallery, [], "< 0.7");
	}, 600);

	window.setTimeout(() => {
		html.classList.remove("is-load");
	}, 2250);
}
