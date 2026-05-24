/** Parse `--site-bg` (e.g. `#fff`) to a Three.js `setClearColor` hex. */
export function siteBgHex(fallback = 0xffffff): number {
	if (typeof document === "undefined") return fallback;

	const raw = getComputedStyle(document.documentElement)
		.getPropertyValue("--site-bg")
		.trim();
	return parseCssHexColor(raw) ?? fallback;
}

function parseCssHexColor(color: string): number | null {
	if (!color.startsWith("#")) return null;

	let hex = color.slice(1);
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}
	if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return null;

	return Number.parseInt(hex, 16);
}
