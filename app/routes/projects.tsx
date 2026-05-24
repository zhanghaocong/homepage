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
			<header className="site-page-header space-y-2">
				<h1 className="site-page-title">Projects</h1>
				<p className="site-page-lead">
					A selection of things I&apos;ve built recently.
				</p>
			</header>

			<ul className="space-y-6">
				{projects.map((project) => (
					<li key={project.slug} className="site-card">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-2">
								<h2 className="site-card-title">
									{project.href ? (
										<a
											href={project.href}
											target="_blank"
											rel="noopener noreferrer"
										>
											{project.title}
										</a>
									) : (
										project.title
									)}
								</h2>
								<p className="site-prose">{project.description}</p>
							</div>
						</div>
						<ul className="mt-4 flex flex-wrap gap-2">
							{project.tags.map((tag) => (
								<li key={tag} className="site-tag">
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
