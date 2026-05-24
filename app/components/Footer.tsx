import { site } from "~/data/site";

export function Footer() {
	return (
		<footer className="border-t border-zinc-200">
			<div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
				<p>
					&copy; {new Date().getFullYear()} {site.name}
				</p>
				<div className="flex flex-wrap gap-4">
					{site.links.map((link) => (
						<a
							key={link.label}
							href={link.href}
							className="transition-colors hover:text-zinc-900"
							target={link.href.startsWith("mailto:") ? undefined : "_blank"}
							rel={
								link.href.startsWith("mailto:")
									? undefined
									: "noopener noreferrer"
							}
						>
							{link.label}
						</a>
					))}
				</div>
			</div>
		</footer>
	);
}
