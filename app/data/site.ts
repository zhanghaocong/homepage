type SiteLink = {
	label: string;
	href: string;
};

export const site = {
	name: "Photo Archive",
	title: "Photo Archive",
	description:
		"A personal photo archive organized by albums, tags, and a living photo wall.",
	tagline: "Albums, tags, and moments from the wall.",
	links: [] as SiteLink[],
} as const;
