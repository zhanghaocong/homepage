/**
 * Packs gallery thumbnails into one texture atlas (max 512×512, 4px edge extrude).
 * One sprite per photo; medium + 2048 paths alias to the same UV rect.
 * Run after download:gallery.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicRoot = join(root, "public");
const outDir = join(publicRoot, "assets/gallery");
const outImage = join(outDir, "atlas.webp");
const outManifest = join(root, "app/data/galleryAtlas.json");

const EXTRUDE = 4;
const PACK_GAP = 2;
const MAX_THUMB = 512;
const MAX_ATLAS_WIDTH = 8192;
const ATLAS_QUALITY = 85;

/** Match `--site-bg` (#fff) — gutter + preview background */
const GUTTER_RGB = { r: 255, g: 255, b: 255 };

const allCateImages = JSON.parse(
	await readFile(join(root, "app/data/allCateImages.json"), "utf8"),
);

/**
 * @param {string} relPath
 */
function sourceWebp(relPath) {
	return join(publicRoot, `${relPath}.webp`);
}

async function fileExists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * @param {string} file
 * @param {number} maxSide
 */
async function loadThumbRgba(file, maxSide) {
	return sharp(file)
		.resize({ width: maxSide, height: maxSide, fit: "inside" })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
}

/**
 * Replicate edge pixels (sharp `extend: copy` leaves alpha=0 on RGB inputs).
 * @param {Buffer} data
 * @param {{ width: number, height: number, channels: number }} info
 * @param {number} pad
 */
function extrudeEdgeCopy(data, info, pad) {
	const { width: w, height: h, channels: c } = info;
	const W = w + pad * 2;
	const H = h + pad * 2;
	const out = Buffer.alloc(W * H * c);

	const sample = (sx, sy) => {
		const x = Math.min(w - 1, Math.max(0, sx));
		const y = Math.min(h - 1, Math.max(0, sy));
		const i = (y * w + x) * c;
		return data.subarray(i, i + c);
	};

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const src = sample(x - pad, y - pad);
			src.copy(out, (y * W + x) * c);
		}
	}

	return sharp(out, { raw: { width: W, height: H, channels: c } }).png().toBuffer();
}

/** Shelf packer */
function packSprites(sprites) {
	const sorted = [...sprites].sort((a, b) => b.slotH - a.slotH);
	let x = 0;
	let y = 0;
	let rowH = 0;
	let atlasW = 0;

	for (const s of sorted) {
		if (x > 0) x += PACK_GAP;
		if (x + s.slotW > MAX_ATLAS_WIDTH && x > 0) {
			x = 0;
			y += rowH + PACK_GAP;
			rowH = 0;
		}
		s.atlasX = x;
		s.atlasY = y;
		x += s.slotW;
		rowH = Math.max(rowH, s.slotH);
		atlasW = Math.max(atlasW, x);
	}

	return { width: atlasW, height: y + rowH };
}

function uvRect(sprite, atlasW, atlasH) {
	const { atlasX, atlasY, innerW, innerH } = sprite;
	const u0 = (atlasX + EXTRUDE) / atlasW;
	const u1 = (atlasX + EXTRUDE + innerW) / atlasW;
	const v1 = 1 - (atlasY + EXTRUDE) / atlasH;
	const v0 = 1 - (atlasY + EXTRUDE + innerH) / atlasH;
	return { u0, v0, u1, v1 };
}

/** @type {Map<string, { medium: string, hi: string, sourcePath: string }>} */
const photos = new Map();

for (const arr of Object.values(allCateImages)) {
	for (const img of arr) {
		const medium = img.medium;
		if (!photos.has(medium)) {
			photos.set(medium, {
				medium,
				hi: img["2048x2048"],
				sourcePath: medium,
			});
		}
	}
}

/** @type {Array<{ keys: string[], slotW: number, slotH: number, innerW: number, innerH: number, buffer: Buffer, atlasX?: number, atlasY?: number }>} */
const prepared = [];

for (const { medium, hi } of photos.values()) {
	const hiFile = sourceWebp(hi);
	const mediumFile = sourceWebp(medium);
	const sourceFile = (await fileExists(hiFile)) ? hiFile : mediumFile;
	const keys = [medium];
	if (hi !== medium) keys.push(hi);

	try {
		const { data, info } = await loadThumbRgba(sourceFile, MAX_THUMB);
		const innerW = info.width;
		const innerH = info.height;
		const buffer = await extrudeEdgeCopy(data, info, EXTRUDE);
		prepared.push({
			keys,
			innerW,
			innerH,
			slotW: innerW + EXTRUDE * 2,
			slotH: innerH + EXTRUDE * 2,
			buffer,
		});
	} catch (err) {
		console.warn(`[atlas] skip ${medium}:`, err.message);
	}
}

if (prepared.length === 0) {
	console.error("[atlas] no images — run npm run download:gallery first");
	process.exit(1);
}

const { width: atlasW, height: atlasH } = packSprites(prepared);

const composites = prepared.map((s) => ({
	input: s.buffer,
	left: s.atlasX,
	top: s.atlasY,
}));

await mkdir(outDir, { recursive: true });
await sharp({
	create: {
		width: atlasW,
		height: atlasH,
		channels: 3,
		background: GUTTER_RGB,
	},
})
	.composite(composites)
	.webp({ quality: ATLAS_QUALITY })
	.toFile(outImage);

/** @type {Record<string, { u0: number, v0: number, u1: number, v1: number, w: number, h: number }>} */
const sprites = {};
for (const s of prepared) {
	const rect = { ...uvRect(s, atlasW, atlasH), w: s.innerW, h: s.innerH };
	for (const key of s.keys) {
		sprites[key] = rect;
	}
}

const manifest = {
	image: "/assets/gallery/atlas.webp",
	width: atlasW,
	height: atlasH,
	maxThumb: MAX_THUMB,
	extrude: EXTRUDE,
	spriteCount: prepared.length,
	sprites,
};

await writeFile(outManifest, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
	`[atlas] ${prepared.length} photos (${Object.keys(sprites).length} path aliases) → ${atlasW}×${atlasH} → ${outImage}`,
);
