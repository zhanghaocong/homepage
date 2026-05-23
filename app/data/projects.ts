export type Project = {
	slug: string;
	title: string;
	description: string;
	tags: string[];
	href?: string;
};

export const projects: Project[] = [
	{
		slug: "edge-homepage",
		title: "Edge Homepage",
		description:
			"A personal site built with React Router SSR on Cloudflare Workers.",
		tags: ["React", "TypeScript", "Cloudflare Workers"],
		href: "https://github.com",
	},
	{
		slug: "api-toolkit",
		title: "API Toolkit",
		description:
			"Lightweight utilities for building and testing HTTP APIs with great DX.",
		tags: ["TypeScript", "Node.js"],
		href: "https://github.com",
	},
	{
		slug: "design-system",
		title: "Design System",
		description:
			"Accessible UI components and tokens for consistent product interfaces.",
		tags: ["React", "Tailwind CSS"],
	},
];
