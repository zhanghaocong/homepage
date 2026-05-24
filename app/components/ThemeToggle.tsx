import { useEffect, useState } from "react";
import {
	getResolvedTheme,
	initTheme,
	toggleTheme,
	type ResolvedTheme,
	THEME_CHANGE_EVENT,
} from "~/lib/theme";

const labels: Record<ResolvedTheme, string> = {
	light: "切换到深色模式",
	dark: "切换到浅色模式",
};

function ThemeIcon({ theme }: { theme: ResolvedTheme }) {
	if (theme === "light") {
		return (
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				aria-hidden
			>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
			</svg>
		);
	}
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden
		>
			<path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
		</svg>
	);
}

export function ThemeToggle() {
	const [resolved, setResolved] = useState<ResolvedTheme>("light");

	useEffect(() => {
		initTheme();
		setResolved(getResolvedTheme());

		const onChange = (event: Event) => {
			const detail = (event as CustomEvent<ResolvedTheme>).detail;
			setResolved(detail ?? getResolvedTheme());
		};
		window.addEventListener(THEME_CHANGE_EVENT, onChange);
		return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
	}, []);

	return (
		<button
			type="button"
			className="site-header__theme"
			aria-label={labels[resolved]}
			title={labels[resolved]}
			onClick={() => setResolved(toggleTheme())}
		>
			<ThemeIcon theme={resolved} />
		</button>
	);
}
