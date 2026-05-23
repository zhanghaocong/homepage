import type { Route } from "./+types/about";
import { site } from "~/data/site";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: `About — ${site.name}` },
		{
			name: "description",
			content: `Learn more about ${site.name}.`,
		},
	];
}

export default function About() {
	return (
		<article className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
			<h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
				About
			</h1>
			<p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
				Hi, I&apos;m {site.name}. I build web applications with a focus on
				performance, developer experience, and clean interfaces.
			</p>
			<p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
				This site runs on Cloudflare Workers with React Router SSR — every page
				is server-rendered at the edge for fast loads and good SEO, without
				needing a traditional server.
			</p>
			<p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
				When I&apos;m not coding, you&apos;ll find me exploring new tools,
				writing about software, and contributing to open source.
			</p>
		</article>
	);
}
