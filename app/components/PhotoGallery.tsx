import { GalleryShell } from "~/components/gallery/GalleryShell";
import { useGalleryRuntime } from "~/components/gallery/useGalleryRuntime";

export function PhotoGallery() {
	const runtime = useGalleryRuntime();

	return <GalleryShell runtime={runtime} />;
}
