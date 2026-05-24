import type { Route } from "./+types/projects";
import { projects } from "~/data/projects";
import { site } from "~/data/site";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: `Projects — ${site.name}` },
		{
			name: "description",
			content: `Selected projects by ${site.name}.`,
		},
	];
}

export default function Projects() {
	return (
		<div className="space-y-8">
			<header className="space-y-2 border-b border-zinc-200 pb-8">
				<h1 className="text-[2.5rem] font-semibold tracking-tight text-zinc-900">
					Projects
				</h1>
				<p className="text-lg text-zinc-500">
					A selection of things I&apos;ve built recently.
				</p>
			</header>

			<ul className="space-y-6">
				{projects.map((project) => (
					<li
						key={project.slug}
						className="rounded-lg border border-zinc-200 p-6"
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-2">
								<h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
									{project.href ? (
										<a
											href={project.href}
											className="transition hover:text-zinc-600 dark:hover:text-zinc-300"
											target="_blank"
											rel="noopener noreferrer"
										>
											{project.title}
										</a>
									) : (
										project.title
									)}
								</h2>
								<p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
									{project.description}
								</p>
							</div>
						</div>
						<ul className="mt-4 flex flex-wrap gap-2">
							{project.tags.map((tag) => (
								<li
									key={tag}
									className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
								>
									{tag}
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</div>
	);
}
