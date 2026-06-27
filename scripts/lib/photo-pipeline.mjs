import { mkdir, readFile, stat, unlink } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

import { archiveRoot, publicRoot } from './paths.mjs'

export const THUMB_SUFFIX = '-thumb'
export const PREVIEW_SUFFIX = '-preview'
export const LARGE_SUFFIX = '-3456'

export const THUMB_MAX = 864
export const PREVIEW_MAX = 1728
export const LARGE_MAX = 3456

/** @type {import('sharp').WebpOptions} */
export const LOSSY_PREVIEW_WEBP = { quality: 78, preset: 'photo', effort: 4 }

/** @type {import('sharp').WebpOptions} */
export const LOSSY_THUMB_WEBP = { quality: 75, preset: 'photo', effort: 4 }

/** @type {import('sharp').WebpOptions} */
export const NEAR_LOSSLESS_WEBP = {
  quality: 90,
  nearLossless: true,
  preset: 'photo',
  effort: 6,
}

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic', '.heif'])

const SHARPEN = { sigma: 0.8, m1: 0.5, m2: 2 }

export const SHARPEN_PROFILES = {
  off: false,
  light: { sigma: 0.5, m1: 0.3, m2: 1.5 },
  medium: SHARPEN,
  strong: { sigma: 1.2, m1: 0.8, m2: 3 },
}

/** @typedef {false | { sigma?: number, m1?: number, m2?: number }} SharpenConfig */
/** @typedef {{ maxSide: number, webp: import('sharp').WebpOptions, sharpen?: SharpenConfig, sharpenOnResize?: boolean }} VariantConfig */

/**
 * WebP presets.
 * Production: thumb 864 + preview 1728 (lossy) + large 3456 (nearLossless).
 */
export const WEBP_PRESETS = {
  production: {
    label: 'production (thumb 864 / preview 1728 / nearLossless 3456)',
    thumb: { maxSide: THUMB_MAX, webp: LOSSY_THUMB_WEBP },
    preview: { maxSide: PREVIEW_MAX, webp: LOSSY_PREVIEW_WEBP },
    large: { maxSide: LARGE_MAX, webp: NEAR_LOSSLESS_WEBP },
  },
  compact: {
    label: 'compact (1600/2560)',
    medium: { maxSide: 1600, webp: { quality: 75, preset: 'photo', effort: 4 } },
    large: { maxSide: 2560, webp: { quality: 78, preset: 'photo', effort: 4 } },
  },
  balanced: {
    label: 'balanced (2048/3200)',
    medium: { maxSide: 2048, webp: { quality: 78, preset: 'photo', effort: 5 } },
    large: { maxSide: 3200, webp: { quality: 80, preset: 'photo', effort: 5 } },
  },
  quality: {
    label: 'quality (2048/3200 q85)',
    medium: { maxSide: 2048, webp: { quality: 85, preset: 'photo', effort: 6 } },
    large: { maxSide: 3200, webp: { quality: 85, preset: 'photo', effort: 6 } },
  },
  legacy: {
    label: 'legacy (1400/2048 q95)',
    medium: { maxSide: 1400, webp: { quality: 95, effort: 6 } },
    large: { maxSide: 2048, webp: { quality: 95, effort: 6 } },
  },
  bloated: {
    label: 'bloated (2048/3200 nearLossless)',
    medium: { maxSide: 2048, webp: { quality: 90, nearLossless: true, preset: 'photo', effort: 6 } },
    large: { maxSide: 3200, webp: { quality: 90, nearLossless: true, preset: 'photo', effort: 6 } },
  },
}

export const DEFAULT_PRESET = 'production'

export const VARIANT_SUFFIXES = [THUMB_SUFFIX, PREVIEW_SUFFIX, LARGE_SUFFIX]

export function getWebpPreset(name = DEFAULT_PRESET) {
  const preset = WEBP_PRESETS[name]
  if (!preset) {
    throw new Error(`Unknown WebP preset: ${name}`)
  }
  return preset
}

export function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export function seriesSlug(value) {
  const slug = slugify(value)
  if (!slug) {
    throw new Error('Series id is required')
  }
  return slug
}

export function isImageFilename(filename) {
  return IMAGE_EXT.has(extname(filename).toLowerCase())
}

export function publicPaths(seriesId, fileBase) {
  const thumbPublic = `/archive/${seriesId}/${fileBase}${THUMB_SUFFIX}.webp`
  const previewPublic = `/archive/${seriesId}/${fileBase}${PREVIEW_SUFFIX}.webp`
  const largePublic = `/archive/${seriesId}/${fileBase}${LARGE_SUFFIX}.webp`

  return {
    thumbPublic,
    previewPublic,
    largePublic,
    /** @deprecated use previewPublic */
    mediumPublic: previewPublic,
  }
}

export function diskPaths(seriesId, fileBase, root = archiveRoot) {
  const outDir = join(root, seriesId)
  const thumbPath = join(outDir, `${fileBase}${THUMB_SUFFIX}.webp`)
  const previewPath = join(outDir, `${fileBase}${PREVIEW_SUFFIX}.webp`)
  const largePath = join(outDir, `${fileBase}${LARGE_SUFFIX}.webp`)

  return {
    outDir,
    thumbPath,
    previewPath,
    largePath,
    /** @deprecated use previewPath */
    mediumPath: previewPath,
  }
}

export function photoAssetPublicPaths(photo) {
  const paths = [photo.largeSrc, photo.previewSrc, photo.thumbSrc, photo.src].filter(Boolean)
  return [...new Set(paths)]
}

function photoFileBase(index, originalName) {
  const stem = slugify(basename(originalName, extname(originalName))) || `photo-${index}`
  return `${String(index + 1).padStart(4, '0')}-${stem}`
}

function resolvePresetTiers(config) {
  if (config.thumb && config.preview && config.large) {
    return [
      { suffix: THUMB_SUFFIX, variant: config.thumb, pathKey: 'thumbPath' },
      { suffix: PREVIEW_SUFFIX, variant: config.preview, pathKey: 'previewPath' },
      { suffix: LARGE_SUFFIX, variant: config.large, pathKey: 'largePath' },
    ]
  }

  return [
    { suffix: PREVIEW_SUFFIX, variant: config.medium, pathKey: 'previewPath' },
    { suffix: LARGE_SUFFIX, variant: config.large, pathKey: 'largePath' },
  ]
}

async function fileExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function absolutePublicPath(publicPath, root = publicRoot) {
  return join(root, publicPath.replace(/^\//, ''))
}

/**
 * @param {Buffer | string} input
 * @param {VariantConfig} variant
 */
async function renderVariant(input, variant) {
  const image = sharp(input, { failOn: 'none' }).rotate()
  const { width, height } = await image.metadata()

  if (!width || !height) {
    throw new Error('Missing image dimensions')
  }

  const needsResize = Math.max(width, height) > variant.maxSide
  let pipeline = image

  if (needsResize) {
    pipeline = image.resize({
      width: variant.maxSide,
      height: variant.maxSide,
      fit: 'inside',
      withoutEnlargement: true,
    })
    const sharpen = variant.sharpen ?? (variant.sharpenOnResize ? SHARPEN : false)
    if (sharpen) {
      pipeline = pipeline.sharpen(sharpen)
    }
  }

  const buffer = await pipeline.webp(variant.webp).toBuffer()
  const meta = await sharp(buffer).metadata()

  return {
    buffer,
    width: meta.width ?? width,
    height: meta.height ?? height,
  }
}

/**
 * @param {Buffer | string} input
 * @param {string} outputPath
 * @param {VariantConfig} variant
 */
export async function writeVariant(input, outputPath, variant) {
  const rendered = await renderVariant(input, variant)
  await sharp(rendered.buffer).toFile(outputPath)
  return { width: rendered.width, height: rendered.height }
}

/**
 * Compress to local WebP files. R2 upload should read these files from disk.
 */
export async function processPhotoFromPath({
  inputPath,
  seriesId,
  index,
  originalName,
  preset = DEFAULT_PRESET,
  root = archiveRoot,
}) {
  const fileBase = photoFileBase(index, originalName)
  const paths = diskPaths(seriesId, fileBase, root)
  const urls = publicPaths(seriesId, fileBase)
  const config = getWebpPreset(preset)
  const tiers = resolvePresetTiers(config)

  await mkdir(paths.outDir, { recursive: true })

  let previewDimensions = { width: 1, height: 1 }

  for (const tier of tiers) {
    const outputPath = join(paths.outDir, `${fileBase}${tier.suffix}.webp`)
    const dimensions = await writeVariant(inputPath, outputPath, tier.variant)
    if (tier.suffix === PREVIEW_SUFFIX) {
      previewDimensions = dimensions
    }
  }

  const photo = {
    id: `${seriesId}-${index}`,
    seriesId,
    largeSrc: urls.largePublic,
    width: previewDimensions.width,
    height: previewDimensions.height,
  }

  if (tiers.some((tier) => tier.suffix === THUMB_SUFFIX)) {
    photo.thumbSrc = urls.thumbPublic
  }
  if (tiers.some((tier) => tier.suffix === PREVIEW_SUFFIX)) {
    photo.previewSrc = urls.previewPublic
    photo.src = urls.previewPublic
  }

  return {
    photo,
    thumbPath: paths.thumbPath,
    previewPath: paths.previewPath,
    largePath: paths.largePath,
    mediumPath: paths.previewPath,
  }
}

export async function processPhotoFromBuffer({
  buffer,
  seriesId,
  index,
  originalName,
  preset = DEFAULT_PRESET,
  root = archiveRoot,
}) {
  return processPhotoFromPath({
    inputPath: buffer,
    seriesId,
    index,
    originalName,
    preset,
    root,
  })
}

/** Read compressed local files for R2 upload — never re-encode. */
export async function collectPhotoAssets(photo, root = publicRoot) {
  const assets = []

  for (const publicPath of photoAssetPublicPaths(photo)) {
    const key = publicPath.replace(/^\//, '')
    const filePath = join(root, key)
    const buffer = await readFile(filePath)
    assets.push({ key, buffer, contentType: 'image/webp' })
  }

  return assets
}

export async function deletePhotoFiles(photo, root = publicRoot) {
  for (const publicPath of photoAssetPublicPaths(photo)) {
    const filePath = absolutePublicPath(publicPath, root)
    if (await fileExists(filePath)) {
      await unlink(filePath)
    }
  }
}

export async function readPhotoDimensions(publicPath, root = publicRoot) {
  const absolutePath = absolutePublicPath(publicPath, root)
  const meta = await sharp(absolutePath).metadata()
  return {
    width: meta.width ?? 1,
    height: meta.height ?? 1,
  }
}
