import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicRoot = join(root, "public");
const base = "https://photoyoshi.com";

const allCateImages = JSON.parse(
	await import("node:fs/promises").then((fs) =>
		fs.readFile(join(root, "app/data/allCateImages.json"), "utf8"),
	),
);

const paths = new Set();
for (const arr of Object.values(allCateImages)) {
	for (const img of arr) {
		paths.add(`${img.medium}.webp`);
		paths.add(`${img["2048x2048"]}.webp`);
	}
}

paths.add("/cms/uploads/noise3.jpg");

const extraAssets = [
	"/assets/img/f.jpg.webp",
	"/assets/img/tag.svg",
];

async function download(relativePath) {
	const url = `${base}${relativePath}`;
	const dest = join(publicRoot, relativePath.replace(/^\//, ""));

	if (existsSync(dest)) return "skip";

	mkdirSync(dirname(dest), { recursive: true });

	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} ${url}`);

	await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
	return "ok";
}

let ok = 0;
let skip = 0;
let fail = 0;

for (const path of [...paths, ...extraAssets]) {
	try {
		const status = await download(path);
		if (status === "skip") skip++;
		else ok++;
		process.stdout.write(`\r${ok + skip + fail}/${paths.size + extraAssets.length}`);
	} catch (err) {
		fail++;
		console.error(`\nFailed ${path}:`, err.message);
	}
}

console.log(`\nDone: ${ok} downloaded, ${skip} skipped, ${fail} failed`);
