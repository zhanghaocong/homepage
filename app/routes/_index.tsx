import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { site } from "~/data/site";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: site.title },
		{ name: "description", content: site.description },
	];
}

export default function Index() {
	return (
		<div className="space-y-10">
			<section className="space-y-4">
				<p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
					Personal site
				</p>
				<h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
					{site.name}
				</h1>
				<p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
					{site.tagline}
				</p>
			</section>

			<section className="flex flex-wrap gap-3">
				<Link
					to="/projects"
					className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
				>
					View projects
				</Link>
				<Link
					to="/about"
					className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
				>
					About me
				</Link>
			</section>

			<section className="space-y-3 border-t border-zinc-200/80 pt-8 dark:border-zinc-800">
				<h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
					Connect
				</h2>
				<ul className="flex flex-wrap gap-x-6 gap-y-2">
					{site.links.map((link) => (
						<li key={link.label}>
							<a
								href={link.href}
								className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-700 dark:hover:text-zinc-100"
								target={
									link.href.startsWith("mailto:") ? undefined : "_blank"
								}
								rel={
									link.href.startsWith("mailto:")
										? undefined
										: "noopener noreferrer"
								}
							>
								{link.label}
							</a>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
