import { useAtomValue } from "jotai/react";
import { CATEGORY_UI } from "~/data/gallery";
import { getGridUnit } from "~/lib/photoViewLayout";
import { photoViewAtom, photoViewStore } from "~/lib/photoViewStore";

const LABEL_BY_ID = Object.fromEntries(
	CATEGORY_UI.map(({ id, label }) => [id, label]),
) as Record<string, string>;

/** HTML category label for photo view (replaces drei Text in WebGL). */
export function PhotoViewChrome() {
	const state = useAtomValue(photoViewAtom, { store: photoViewStore });
	if (!state.open || !state.uiReady) return null;

	const label = LABEL_BY_ID[state.category] ?? "Interior";

	return (
		<div
			className="photo-view__chrome"
			style={{ left: `${getGridUnit()}px` }}
			aria-hidden
		>
			<p className="photo-view__eyebrow fs-s">CATEGORY</p>
			<h2 className="photo-view__title fs-xl">{label}</h2>
		</div>
	);
}
