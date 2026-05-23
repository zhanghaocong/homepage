import { Link, NavLink } from "react-router";
import { site } from "~/data/site";

const navItems = [
	{ to: "/", label: "Home", end: true },
	{ to: "/about", label: "About", end: false },
	{ to: "/projects", label: "Projects", end: false },
] as const;

export function Header() {
	return (
		<header className="border-b border-zinc-200/80 dark:border-zinc-800">
			<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
				<Link
					to="/"
					className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
				>
					{site.name}
				</Link>
				<nav className="flex items-center gap-6">
					{navItems.map(({ to, label, end }) => (
						<NavLink
							key={to}
							to={to}
							end={end}
							className={({ isActive }) =>
								[
									"text-sm transition-colors",
									isActive
										? "font-medium text-zinc-900 dark:text-zinc-100"
										: "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
								].join(" ")
							}
						>
							{label}
						</NavLink>
					))}
				</nav>
			</div>
		</header>
	);
}
