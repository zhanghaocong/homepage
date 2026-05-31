import { PhotoView } from "~/components/PhotoView";
import { GalleryCanvasHost } from "~/components/gallery/GalleryCanvasHost";
import { GalleryCategoryNav } from "~/components/gallery/GalleryCategoryNav";
import { GallerySplash } from "~/components/gallery/GallerySplash";
import type { GalleryRuntime } from "~/components/gallery/useGalleryRuntime";

type GalleryShellProps = {
	runtime: GalleryRuntime;
};

export function GalleryShell({ runtime }: GalleryShellProps) {
	return (
		<div
			className={`xhr-wrap${runtime.photoViewOpen ? " is-photo-view-open" : ""}`}
			data-xhr-namespace="home"
			ref={runtime.shellRef}
		>
			<PhotoView wrapRef={runtime.wrapRef} />
			<div className="js-wrapper p-home" ref={runtime.wrapRef}>
				<div className="js-page__cover" />
				<div className="js-page">
					<div className="js-body" data-dir="hr" ref={runtime.bodyRef}>
						<div className="c-content js-gl__wrap" ref={runtime.contentRef} />
					</div>
				</div>

				<GalleryCategoryNav onCategorySelect={runtime.jumpToCategory} />

				<GalleryCanvasHost
					canvasReady={runtime.canvasReady}
					canvasWrapRef={runtime.canvasWrapRef}
					contentRef={runtime.contentRef}
					canvasEngineRef={runtime.canvasEngineRef}
					scrollRef={runtime.scrollRef}
					onEngineReady={runtime.handleEngineReady}
				/>
			</div>

			<div className="c-scrollbar">
				<div className="c-thumb">
					<div className="c-pivot" />
					<div className="c-pivot" />
				</div>
			</div>

			<GallerySplash />
		</div>
	);
}
