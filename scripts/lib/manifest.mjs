import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import {
  LARGE_SUFFIX,
  PREVIEW_SUFFIX,
  THUMB_SUFFIX,
  readPhotoDimensions,
  seriesSlug,
} from './photo-pipeline.mjs'
import { archiveRoot, manifestPath } from './paths.mjs'

export async function readManifest() {
  const raw = await readFile(manifestPath, 'utf8')
  return JSON.parse(raw)
}

export async function writeManifest(manifest) {
  const next = {
    ...manifest,
    generatedAt: new Date().toISOString(),
    sourceRoot: manifest.sourceRoot ?? 'admin',
  }
  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  return next
}

export function normalizeSeriesId(id) {
  return seriesSlug(id)
}

export async function createSeries({ id, title }) {
  const manifest = await readManifest()
  const seriesId = normalizeSeriesId(id)

  if (manifest.series.some((series) => series.id === seriesId)) {
    throw new Error(`Series already exists: ${seriesId}`)
  }

  if (!title?.trim()) {
    throw new Error('Series title is required')
  }

  await mkdir(join(archiveRoot, seriesId), { recursive: true })

  manifest.series.push({ id: seriesId, title: title.trim(), photos: [] })
  return writeManifest(manifest)
}

export async function updateSeries(seriesId, { title }) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  series.title = title.trim()
  return writeManifest(manifest)
}

export async function deleteSeries(seriesId) {
  const manifest = await readManifest()
  const index = manifest.series.findIndex((item) => item.id === seriesId)

  if (index === -1) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  manifest.series.splice(index, 1)
  await rm(join(archiveRoot, seriesId), { recursive: true, force: true })
  return writeManifest(manifest)
}

export async function addPhoto(seriesId, photo) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  series.photos.push(photo)
  return writeManifest(manifest)
}

export async function deletePhoto(seriesId, photoId) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  const index = series.photos.findIndex((photo) => photo.id === photoId)
  if (index === -1) {
    throw new Error(`Photo not found: ${photoId}`)
  }

  series.photos.splice(index, 1)
  return writeManifest(manifest)
}

export async function reorderPhotos(seriesId, photoIds) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  const byId = new Map(series.photos.map((photo) => [photo.id, photo]))
  if (photoIds.length !== series.photos.length || photoIds.some((id) => !byId.has(id))) {
    throw new Error('Photo order must include every photo exactly once')
  }

  series.photos = photoIds.map((id, index) => {
    const photo = byId.get(id)
    return {
      ...photo,
      id: `${seriesId}-${index}`,
    }
  })

  return writeManifest(manifest)
}

async function listPreviewWebps(seriesId) {
  const dir = join(archiveRoot, seriesId)
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(`${PREVIEW_SUFFIX}.webp`))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, 'en'))
  } catch {
    return []
  }
}

export async function regenerateManifest() {
  const manifest = await readManifest()
  const nextSeries = []

  for (const series of manifest.series) {
    const files = await listPreviewWebps(series.id)
    const photos = []

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const fileBase = basename(file, `${PREVIEW_SUFFIX}.webp`)
      const thumbSrc = `/archive/${series.id}/${fileBase}${THUMB_SUFFIX}.webp`
      const previewSrc = `/archive/${series.id}/${file}`
      const largeSrc = `/archive/${series.id}/${fileBase}${LARGE_SUFFIX}.webp`
      const dimensions = await readPhotoDimensions(previewSrc)

      photos.push({
        id: `${series.id}-${index}`,
        seriesId: series.id,
        thumbSrc,
        previewSrc,
        src: previewSrc,
        largeSrc,
        width: dimensions.width,
        height: dimensions.height,
      })
    }

    nextSeries.push({ id: series.id, title: series.title, photos })
  }

  return writeManifest({ ...manifest, series: nextSeries })
}

export function applyPublicUrl(manifest, publicUrl) {
  const base = publicUrl.replace(/\/$/, '')

  return {
    ...manifest,
    series: manifest.series.map((series) => ({
      ...series,
      photos: series.photos.map((photo) => withPublicUrls(photo, base)),
    })),
  }
}

export async function restoreLocalUrls(manifest) {
  return {
    ...manifest,
    series: manifest.series.map((series) => ({
      ...series,
      photos: series.photos.map((photo) => ({
        ...photo,
        thumbSrc: toLocalArchivePath(photo.thumbSrc),
        previewSrc: toLocalArchivePath(photo.previewSrc ?? photo.src),
        largeSrc: toLocalArchivePath(photo.largeSrc),
        src: toLocalArchivePath(photo.previewSrc ?? photo.src),
      })),
    })),
  }
}

function withPublicUrls(photo, base) {
  const localize = (url) => (url?.startsWith('http') ? url : `${base}${url}`)

  const previewSrc = localize(photo.previewSrc ?? photo.src)
  return {
    ...photo,
    thumbSrc: localize(photo.thumbSrc),
    previewSrc,
    largeSrc: localize(photo.largeSrc),
    src: previewSrc,
  }
}

function toLocalArchivePath(url) {
  const match = url.match(/\/archive\/[^?#]+/)
  return match ? match[0] : url
}
