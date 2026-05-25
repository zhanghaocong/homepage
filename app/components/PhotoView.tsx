import { useAtomValue } from "jotai/react";
import { useEffect, useRef } from "react";
import { CATEGORY_UI, galleryImages, imageUrl } from "~/data/gallery";
import {
	animateCategoryEnter,
	closePhotoView,
	updateFlyHeroSrc,
} from "~/lib/photoViewController";
import { PhotoViewThumbList } from "~/lib/photoViewThumbList";
import {
	CATE_ID_TO_KEY,
	photoViewAtom,
	photoViewStore,
	setPhotoViewState,
} from "~/lib/photoViewStore";

export function PhotoView() {
	const state = useAtomValue(photoViewAtom, { store: photoViewStore });
	const rootRef = useRef<HTMLDivElement>(null);
	const thumbListRef = useRef<PhotoViewThumbList | null>(null);

	const categoryLabel =
		CATEGORY_UI.find((c) => c.id === state.category)?.label ?? state.category;

	useEffect(() => {
		if (!state.open || !state.uiReady) {
			thumbListRef.current?.destroy();
			thumbListRef.current = null;
			return;
		}

		const root = rootRef.current;
		if (!root) return;

		const cateKey = CATE_ID_TO_KEY[state.category];
		const images = galleryImages[cateKey];

		thumbListRef.current?.destroy();
		thumbListRef.current = new PhotoViewThumbList(
			root,
			images,
			state.activeIndex,
			(index) => {
				const next = images[index];
				if (!next) return;
				setPhotoViewState({ activeIndex: index });
				updateFlyHeroSrc(imageUrl(next["2048x2048"]));
			},
		);

		animateCategoryEnter(root);

		return () => {
			thumbListRef.current?.destroy();
			thumbListRef.current = null;
		};
	}, [state.open, state.uiReady, state.category]);

	useEffect(() => {
		if (!state.open || !state.uiReady || !thumbListRef.current) return;
		thumbListRef.current.scrollToIndex(state.activeIndex, false);
	}, [state.activeIndex, state.open, state.uiReady]);

	if (!state.open) return null;

	return (
		<div
			ref={rootRef}
			className={`p-photo-view${state.uiReady ? " is-ui-ready" : ""}`}
			role="dialog"
			aria-modal="true"
			aria-label={`${categoryLabel} gallery`}
		>
			<div className="p-cate__fixed p-photo-view__fixed">
				<div className="p-photo-view__border p-cate__border to" />
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
