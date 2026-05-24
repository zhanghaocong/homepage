import { Link } from "react-router";
import type { Route } from "./+types/$";

export function meta({}: Route.MetaArgs) {
	return [{ title: "404 — Page not found" }];
}

export default function NotFound() {
	return (
		<div className="space-y-4 text-center">
			<h1 className="site-page-title text-3xl">404</h1>
			<p className="site-prose">The page you&apos;re looking for doesn&apos;t exist.</p>
			<Link
				to="/"
				className="site-header__link inline-block text-sm font-medium underline underline-offset-4"
			>
				Back to home
			</Link>
		</div>
	);
}
