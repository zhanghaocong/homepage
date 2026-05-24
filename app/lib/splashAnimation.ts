import gsap from "gsap";
import { galleryParams } from "~/lib/galleryParams";
import type { JsScroll } from "~/lib/jsScroll";

function killAllTweens(elements: NodeListOf<Element> | Element[]) {
	for (const el of elements) gsap.killTweensOf(el);
}

export function runHomeSplash(
	root: HTMLElement,
	scroll: JsScroll,
	hooks?: { onReveal?: () => void },
) {
	const html = document.documentElement;
	gsap.set("canvas", { opacity: 0 });
	html.classList.add("is-load");
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
		const glInner = root.querySelectorAll(
			".c-section:not(.c-clone) .gl-inner",
		);
		const childElements = Array.from(glInner).map((inner) =>
			inner.querySelectorAll(".gl-img"),
		);

		childElements.forEach((items) => {
			for (let i = 0; i < items.length; i++) {
				const node = items[i] as HTMLElement;
				gsap.killTweensOf(node);
				if (i === 2) {
					gsap.set(node, { width: "187%", height: "20vw" });
				}
			}
			gsap.set(items[0], {
				y: -1 * ((items[0] as HTMLElement).getBoundingClientRect().top +
					(items[0] as HTMLElement).clientHeight),
			});
			gsap.set(items[1], {
				y: -1 * ((items[1] as HTMLElement).getBoundingClientRect().top +
					(items[1] as HTMLElement).clientHeight),
			});
			gsap.set(items[3], {
				y: -1 * ((items[3] as HTMLElement).getBoundingClientRect().top -
					window._h -
					(items[3] as HTMLElement).clientHeight),
			});
			gsap.set(items[4], {
				y: -1 * ((items[4] as HTMLElement).getBoundingClientRect().top -
					window._h -
					(items[4] as HTMLElement).clientHeight),
			});
		});

		gsap.set(".to", { opacity: 0 });

		const revealGallery = () => {
			hooks?.onReveal?.();
			gsap.fromTo("canvas", { opacity: 0 }, { opacity: 1, duration: 1 });
			const distance = window.innerWidth < 680 ? 4.48 : 2.125;
			scroll.onScrollTo(scroll.delta1 + window._w * distance, 3, 0, "power4.out");

			childElements.forEach((items) => {
				killAllTweens(items);
				for (let i = 0; i < items.length; i++) {
					const node = items[i] as HTMLElement;
					const img = node.querySelector(".gl-i");
					const rect = img?.getBoundingClientRect();
					const landscape = rect ? rect.width / rect.height > 1 : true;
					if (i === 2) {
						gsap.to(node, {
							width: landscape ? "100%" : "65%",
							duration: 2.3,
							ease: "power4.out",
							delay: 0.5,
						});
						gsap.to(node, {
							height: landscape ? "65%" : "100%",
							duration: 1.8,
							ease: "power4.out",
						});
					}
				}

				gsap.to(items[0], { y: 0, duration: 1.7, ease: "expo.out", delay: 1 });
				gsap.to(items[1], { y: 0, duration: 1.7, ease: "expo.out", delay: 0.5 });
				gsap.to(items[3], { y: 0, duration: 1.7, ease: "expo.out", delay: 0.5 });
				gsap.to(items[4], { y: 0, duration: 1.7, ease: "expo.out", delay: 1 });
			});

			gsap.fromTo(".to", { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 1.5 });
			gsap
				.timeline()
				.fromTo(
					galleryParams,
					{ modeChangePow: 1 },
					{ modeChangePow: 0, duration: 1.5, ease: "power1.out" },
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
			tl.to(".l-splash__front-inner", {
				width: "130%",
				duration: 1.8,
				ease: "power2.inOut",
			}, "<");
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
		tl.call(revealGallery, [], "< 1.0");
	}, 700);

	window.setTimeout(() => {
		html.classList.remove("is-load");
	}, 2500);
}
