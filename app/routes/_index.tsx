import type { Route } from "./+types/_index";
import { PhotoGallery } from "~/components/PhotoGallery";
import { site } from "~/data/site";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: site.title },
		{ name: "description", content: site.description },
	];
}

export default function Index() {
	return <PhotoGallery />;
}
