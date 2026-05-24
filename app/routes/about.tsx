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
		<article className="max-w-none space-y-8">
			<header className="site-page-header space-y-2">
				<h1 className="site-page-title">About</h1>
				<p className="site-page-lead">A short introduction and background.</p>
			</header>
			<div className="site-prose space-y-6">
				<p>
					Hi, I&apos;m {site.name}. I build web applications with a focus on
					performance, developer experience, and clean interfaces.
				</p>
				<p>
					This site runs on Cloudflare Workers with React Router SSR — every page
					is server-rendered at the edge for fast loads and good SEO, without
					needing a traditional server.
				</p>
				<p>
					When I&apos;m not coding, you&apos;ll find me exploring new tools,
					writing about software, and contributing to open source.
				</p>
			</div>
		</article>
	);
}
