import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { site } from "~/data/site";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function meta({}: Route.MetaArgs) {
	return [
		{ title: site.title },
		{ name: "description", content: site.description },
	];
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
				<div className="space-y-4 text-center">
					<h1 className="text-3xl font-semibold">{message}</h1>
					<p className="text-zinc-600 dark:text-zinc-300">{details}</p>
					<Link
						to="/"
						className="inline-block text-sm font-medium underline underline-offset-4"
					>
						Back to home
					</Link>
					{stack && (
						<pre className="mt-6 w-full overflow-x-auto rounded-lg bg-zinc-100 p-4 text-left text-sm dark:bg-zinc-900">
							<code>{stack}</code>
						</pre>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}
