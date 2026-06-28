import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  PHOTO_VARIANT_SUFFIXES,
  albumManifestPath,
  albumsRoot,
} from './paths.ts'

export type AlbumSummary = {
  id: string
  photoCount: number
}

export type PhotoVariantStatus = Record<(typeof PHOTO_VARIANT_SUFFIXES)[number], boolean>

export type PhotoEntry = {
  id: string
  variants: PhotoVariantStatus
  complete: boolean
}

const ALBUM_ID_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
const PHOTO_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readManifestLines(filePath: string): Promise<string[]> {
  try {
    const text = await readFile(filePath, 'utf8')
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

export async function writeManifestLines(filePath: string, lines: string[]) {
  const parentDir = join(filePath, '..')
  await mkdir(parentDir, { recursive: true })
  const content = lines.length > 0 ? `${lines.join('\n')}\n` : ''
  await writeFile(filePath, content, 'utf8')
}

function assertAlbumId(id: string) {
  if (!ALBUM_ID_PATTERN.test(id)) {
    throw new Error('相册 ID 只能包含小写字母、数字和连字符')
  }
}

function assertPhotoId(id: string) {
  if (!PHOTO_ID_PATTERN.test(id)) {
    throw new Error('照片基名只能包含字母、数字、点、下划线和连字符')
  }
}

export async function listAlbums(): Promise<AlbumSummary[]> {
  const ids = await readManifestLines(albumManifestPath)
  const albums: AlbumSummary[] = []

  for (const id of ids) {
    const photoIds = await readManifestLines(join(albumsRoot, id, 'manifest.txt'))
    albums.push({ id, photoCount: photoIds.length })
  }

  return albums
}

export async function createAlbum(id: string) {
  assertAlbumId(id)

  const ids = await readManifestLines(albumManifestPath)
  if (ids.includes(id)) {
    throw new Error(`相册「${id}」已存在`)
  }

  await mkdir(join(albumsRoot, id), { recursive: true })
  await writeManifestLines(join(albumsRoot, id, 'manifest.txt'), [])
  ids.push(id)
  await writeManifestLines(albumManifestPath, ids)
}

export async function deleteAlbum(id: string, { removeFiles = false } = {}) {
  const ids = await readManifestLines(albumManifestPath)
  if (!ids.includes(id)) {
    throw new Error(`相册「${id}」不存在`)
  }

  await writeManifestLines(
    albumManifestPath,
    ids.filter((albumId) => albumId !== id),
  )

  if (removeFiles) {
    await rm(join(albumsRoot, id), { recursive: true, force: true })
  }
}

export async function reorderAlbums(orderedIds: string[]) {
  const existingIds = await readManifestLines(albumManifestPath)
  const existingSet = new Set(existingIds)

  if (orderedIds.length !== existingIds.length) {
    throw new Error('相册顺序列表不完整')
  }

  for (const id of orderedIds) {
    if (!existingSet.has(id)) {
      throw new Error(`未知相册「${id}」`)
    }
  }

  await writeManifestLines(albumManifestPath, orderedIds)
}

async function getPhotoVariants(albumId: string, photoId: string): Promise<PhotoVariantStatus> {
  const albumDir = join(albumsRoot, albumId)
  const variants = {} as PhotoVariantStatus

  for (const suffix of PHOTO_VARIANT_SUFFIXES) {
    variants[suffix] = await fileExists(join(albumDir, `${photoId}${suffix}`))
  }

  return variants
}

export async function listPhotos(albumId: string): Promise<PhotoEntry[]> {
  const ids = await readManifestLines(albumManifestPath)
  if (!ids.includes(albumId)) {
    throw new Error(`相册「${albumId}」不存在`)
  }

  const photoIds = await readManifestLines(join(albumsRoot, albumId, 'manifest.txt'))
  const photos: PhotoEntry[] = []

  for (const id of photoIds) {
    const variants = await getPhotoVariants(albumId, id)
    photos.push({
      id,
      variants,
      complete: PHOTO_VARIANT_SUFFIXES.every((suffix) => variants[suffix]),
    })
  }

  return photos
}

export async function addPhoto(albumId: string, photoId: string) {
  assertPhotoId(photoId)

  const albumIds = await readManifestLines(albumManifestPath)
  if (!albumIds.includes(albumId)) {
    throw new Error(`相册「${albumId}」不存在`)
  }

  const photoIds = await readManifestLines(join(albumsRoot, albumId, 'manifest.txt'))
  if (photoIds.includes(photoId)) {
    throw new Error(`照片「${photoId}」已在 manifest 中`)
  }

  photoIds.push(photoId)
  await writeManifestLines(join(albumsRoot, albumId, 'manifest.txt'), photoIds)
}

export async function removePhoto(albumId: string, photoId: string) {
  const albumIds = await readManifestLines(albumManifestPath)
  if (!albumIds.includes(albumId)) {
    throw new Error(`相册「${albumId}」不存在`)
  }

  const photoIds = await readManifestLines(join(albumsRoot, albumId, 'manifest.txt'))
  if (!photoIds.includes(photoId)) {
    throw new Error(`照片「${photoId}」不在 manifest 中`)
  }

  await writeManifestLines(
    join(albumsRoot, albumId, 'manifest.txt'),
    photoIds.filter((id) => id !== photoId),
  )
}

export async function reorderPhotos(albumId: string, orderedIds: string[]) {
  const albumIds = await readManifestLines(albumManifestPath)
  if (!albumIds.includes(albumId)) {
    throw new Error(`相册「${albumId}」不存在`)
  }

  const existingIds = await readManifestLines(join(albumsRoot, albumId, 'manifest.txt'))
  const existingSet = new Set(existingIds)

  if (orderedIds.length !== existingIds.length) {
    throw new Error('照片顺序列表不完整')
  }

  for (const id of orderedIds) {
    if (!existingSet.has(id)) {
      throw new Error(`未知照片「${id}」`)
    }
  }

  await writeManifestLines(join(albumsRoot, albumId, 'manifest.txt'), orderedIds)
}
