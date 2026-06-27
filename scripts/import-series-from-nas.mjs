/**
 * Import Selected series from NAS, generate WebP variants, and write app/data/series.json.
 *
 * Usage:
 *   node scripts/import-series-from-nas.mjs
 *   NAS_PHOTOS_ROOT=/path/to/photos-dist node scripts/import-series-from-nas.mjs
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicRoot = join(root, 'public')
const manifestPath = join(root, 'app/data/series.json')

const NAS_ROOT = process.env.NAS_PHOTOS_ROOT ?? '/Volumes/Public/photos-dist'

const MEDIUM_MAX = 2048
const LARGE_MAX = 3200
const WEBP_QUALITY = 90
const WEBP_EFFORT = 6
const SHARPEN = { sigma: 0.8, m1: 0.5, m2: 2 }

const SERIES_SOURCES = [
  { id: 'hokkaido-2025', title: '北海道 · 2025', folder: '2025-01-08 北海道 Selected' },
  { id: 'okinawa-2024', title: '冲绳 · 2024', folder: '2024-04 冲绳 Selected' },
  { id: 'kobe-2023', title: '神户 · 2023', folder: '2023 神户 Selected' },
]

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'])

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXT.has(extname(entry.name).toLowerCase()))
    .map((entry) => join(dir, entry.name))
    .sort((a, b) => basename(a).localeCompare(basename(b), 'en'))
}

async function shouldSkip(sourcePath, ...outputs) {
  let sourceStat
  try {
    sourceStat = await stat(sourcePath)
  } catch {
    return false
  }

  for (const output of outputs) {
    if (!(await exists(output))) return false
    const outputStat = await stat(output)
    if (outputStat.mtimeMs < sourceStat.mtimeMs) return false
  }

  return true
}

async function writeVariant(inputPath, outputPath, maxSide) {
  const image = sharp(inputPath, { failOn: 'none' }).rotate()
  const { width, height } = await image.metadata()

  if (!width || !height) {
    throw new Error(`Missing dimensions for ${inputPath}`)
  }

  const needsResize = Math.max(width, height) > maxSide
  const pipeline = needsResize
    ? image.resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true }).sharpen(SHARPEN)
    : image

  await pipeline
    .webp({
      quality: WEBP_QUALITY,
      nearLossless: true,
      preset: 'photo',
      smartSubsample: false,
      effort: WEBP_EFFORT,
    })
    .toFile(outputPath)

  const meta = await sharp(outputPath).metadata()
  return { width: meta.width ?? width, height: meta.height ?? height }
}

async function importPhoto({ sourcePath, seriesId, index }) {
  const stem = slugify(basename(sourcePath, extname(sourcePath))) || `photo-${index}`
  const fileBase = `${String(index + 1).padStart(4, '0')}-${stem}`
  const outDir = join(publicRoot, 'archive', seriesId)
  const mediumPath = join(outDir, `${fileBase}.webp`)
  const largePath = join(outDir, `${fileBase}-2048.webp`)
  const mediumPublic = `/archive/${seriesId}/${fileBase}.webp`
  const largePublic = `/archive/${seriesId}/${fileBase}-2048.webp`

  await mkdir(outDir, { recursive: true })

  if (await shouldSkip(sourcePath, mediumPath, largePath)) {
    const meta = await sharp(mediumPath).metadata()
    return {
      id: `${seriesId}-${index}`,
      seriesId,
      src: mediumPublic,
      largeSrc: largePublic,
      width: meta.width ?? 1,
      height: meta.height ?? 1,
      skipped: true,
    }
  }

  const { width, height } = await writeVariant(sourcePath, mediumPath, MEDIUM_MAX)
  await writeVariant(sourcePath, largePath, LARGE_MAX)

  return {
    id: `${seriesId}-${index}`,
    seriesId,
    src: mediumPublic,
    largeSrc: largePublic,
    width,
    height,
    skipped: false,
  }
}

async function importSeries({ id, title, folder }) {
  const sourceDir = join(NAS_ROOT, folder)
  if (!(await exists(sourceDir))) {
    throw new Error(`Series folder not found: ${sourceDir}`)
  }

  const images = await listImages(sourceDir)
  const photos = []

  for (let index = 0; index < images.length; index++) {
    const photo = await importPhoto({ sourcePath: images[index], seriesId: id, index })
    photos.push(photo)
    const label = basename(images[index])
    process.stdout.write(
      `\r  [${id}] ${index + 1}/${images.length} ${photo.skipped ? 'skip' : 'ok   '} ${label}`.padEnd(90),
    )
  }

  process.stdout.write('\n')
  return { id, title, photos: photos.map(({ skipped: _skipped, ...photo }) => photo) }
}

async function main() {
  if (!(await exists(NAS_ROOT))) {
    throw new Error(`NAS root not mounted: ${NAS_ROOT}`)
  }

  console.log(`Importing from ${NAS_ROOT}`)

  const series = []
  let imported = 0
  let skipped = 0

  for (const source of SERIES_SOURCES) {
    console.log(`→ ${source.title}`)
    const result = await importSeries(source)
    series.push(result)
    for (const photo of result.photos) {
      imported++
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: NAS_ROOT,
    series,
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  const totalPhotos = series.reduce((count, item) => count + item.photos.length, 0)
  console.log(`\nWrote ${manifestPath}`)
  console.log(`Series: ${series.length}, photos: ${totalPhotos}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
