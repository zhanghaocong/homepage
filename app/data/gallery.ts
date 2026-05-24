import allCateImages from "./allCateImages.json";

export type CateImage = {
	width: number;
	height: number;
	medium: string;
	"2048x2048": string;
};

export type CateKey = keyof typeof allCateImages;

export const galleryImages = allCateImages as Record<CateKey, CateImage[]>;

export const galleryCategoryOrder = [
	"Interior",
	"Landscape",
	"Portrait",
	"Interior",
	"Landscape",
	"Portrait",
] as const;

export const galleryCounts = {
	interior: 42,
	portrait: 40,
	landscape: 18,
} as const;

export const galleryTotal = 100;

export const CATEGORY_UI = [
	{ id: "interior" as const, label: "Interior" },
	{ id: "portrait" as const, label: "Portrait" },
	{ id: "landscape" as const, label: "Landscape" },
];

export function imageUrl(path: string) {
	return `${path}.webp`;
}
