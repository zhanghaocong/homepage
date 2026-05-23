import { Link } from "react-router";
import type { Route } from "./+types/$";

export function meta({}: Route.MetaArgs) {
	return [{ title: "404 — Page not found" }];
}

export default function NotFound() {
	return (
		<div className="space-y-4 text-center">
			<h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
				404
			</h1>
			<p className="text-zinc-600 dark:text-zinc-300">
				The page you&apos;re looking for doesn&apos;t exist.
			</p>
			<Link
				to="/"
				className="inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
			>
				Back to home
			</Link>
		</div>
	);
}
