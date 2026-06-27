import { mkdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  collectPhotoAssets,
  deletePhotoFiles,
  isImageFilename,
  processPhotoFromBuffer,
  slugify,
} from './photo-pipeline.mjs'
import { manifestPath, publicRoot } from './paths.mjs'

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

export function normalizeSeriesId(value) {
  const id = slugify(value)
  if (!id) {
    throw new Error('Series id is required')
  }
  return id
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

  await mkdir(join(publicRoot, 'archive', seriesId), { recursive: true })

  const series = { id: seriesId, title: title.trim(), photos: [] }
  manifest.series.push(series)
  await writeManifest(manifest)
  return series
}

export async function updateSeries(seriesId, { title }) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  if (!title?.trim()) {
    throw new Error('Series title is required')
  }

  series.title = title.trim()
  await writeManifest(manifest)
  return series
}

export async function deleteSeries(seriesId) {
  const manifest = await readManifest()
  const index = manifest.series.findIndex((item) => item.id === seriesId)

  if (index === -1) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  manifest.series.splice(index, 1)
  await writeManifest(manifest)

  const archiveDir = join(publicRoot, 'archive', seriesId)
  try {
    await rm(archiveDir, { recursive: true, force: true })
  } catch {
    // ignore missing directory
  }

  return { deleted: seriesId }
}

function nextPhotoIndex(series) {
  return series.photos.length
}

export async function addPhotos(seriesId, files, { uploadAssets } = {}) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  const imageFiles = files.filter((file) => isImageFilename(file.originalName))
  if (imageFiles.length === 0) {
    throw new Error('No supported image files received')
  }

  const added = []

  for (const file of imageFiles) {
    const index = nextPhotoIndex(series)
    const { photo } = await processPhotoFromBuffer({
      buffer: file.buffer,
      seriesId,
      index,
      originalName: file.originalName,
    })

    series.photos.push(photo)
    added.push(photo)

    if (uploadAssets) {
      const assets = await collectPhotoAssets(photo)
      await uploadAssets(assets)
    }
  }

  await writeManifest(manifest)
  return { series, added }
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

  const [photo] = series.photos.splice(index, 1)
  await writeManifest(manifest)
  await deletePhotoFiles(photo)

  return { deleted: photoId }
}

export async function reorderPhotos(seriesId, photoIds) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  if (photoIds.length !== series.photos.length) {
    throw new Error('Photo order must include every photo in the series')
  }

  const byId = new Map(series.photos.map((photo) => [photo.id, photo]))
  const reordered = photoIds.map((photoId) => {
    const photo = byId.get(photoId)
    if (!photo) {
      throw new Error(`Photo not found in series: ${photoId}`)
    }
    return photo
  })

  series.photos = reordered
  await writeManifest(manifest)
  return series
}

export async function publishManifest() {
  const manifest = await readManifest()
  return writeManifest(manifest)
}

export async function syncSeriesToR2(seriesId, uploadAssets) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  const assets = []

  for (const photo of series.photos) {
    assets.push(...(await collectPhotoAssets(photo)))
  }

  if (uploadAssets) {
    await uploadAssets(assets)
  }

  return { seriesId, count: assets.length }
}

export async function syncAllToR2(uploadAssets) {
  const manifest = await readManifest()
  let count = 0

  for (const series of manifest.series) {
    const result = await syncSeriesToR2(series.id, uploadAssets)
    count += result.count
  }

  return { series: manifest.series.length, assets: count }
}

export async function fileExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export function listSeriesSummary(manifest) {
  return manifest.series.map((series) => ({
    id: series.id,
    title: series.title,
    photoCount: series.photos.length,
    cover: series.photos[0] ?? null,
  }))
}
