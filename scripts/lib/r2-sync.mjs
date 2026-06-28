import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { getPlatformProxy } from 'wrangler'

import { albumsRoot, projectRoot } from './paths.mjs'

const MANIFEST_FILE = 'manifest.txt'
const ALBUMS_R2_PREFIX = 'albums'

/** @type {Awaited<ReturnType<typeof getPlatformProxy>> | null} */
let platformProxy = null

export async function getWranglerPlatform() {
  if (!platformProxy) {
    platformProxy = await getPlatformProxy({
      configPath: join(projectRoot, 'wrangler.json'),
      persist: true,
    })
  }
  return platformProxy
}

async function walkFiles(dir, { skipNames = new Set() } = {}) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (skipNames.has(entry.name)) {
      continue
    }

    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute, { skipNames })))
      continue
    }
    if (entry.isFile()) {
      files.push(absolute)
    }
  }

  return files
}

async function listAllR2Keys(bucket, prefix) {
  const keys = []
  let cursor

  do {
    const result = await bucket.list({ prefix, cursor, limit: 1000 })
    for (const object of result.objects) {
      keys.push(object.key)
    }
    cursor = result.truncated ? result.cursor : undefined
  } while (cursor)

  return keys
}

async function collectLocalR2Keys(localRoot, r2Prefix, { skipNames = new Set([MANIFEST_FILE]) } = {}) {
  let localExists = true
  try {
    await stat(localRoot)
  } catch {
    localExists = false
  }

  if (!localExists) {
    return new Set()
  }

  const files = await walkFiles(localRoot, { skipNames })
  return new Set(
    files.map((file) => {
      const relativePath = relative(localRoot, file).split('\\').join('/')
      return `${r2Prefix}/${relativePath}`
    }),
  )
}

function contentTypeForFile(filePath) {
  if (filePath.endsWith('.avif')) {
    return 'image/avif'
  }
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  return undefined
}

export async function isR2Configured() {
  const { env } = await getWranglerPlatform()
  return Boolean(env.PHOTOS)
}

export async function syncAlbumsToR2() {
  const { env } = await getWranglerPlatform()
  const bucket = env.PHOTOS

  if (!bucket) {
    throw new Error('Missing PHOTOS binding. Add r2_buckets to wrangler.json.')
  }

  let albumsExists = true
  try {
    await stat(albumsRoot)
  } catch {
    albumsExists = false
  }

  if (!albumsExists) {
    return { uploaded: 0, keys: [], publicUrl: getPublicUrlFromEnv(env) }
  }

  const files = await walkFiles(albumsRoot, { skipNames: new Set([MANIFEST_FILE]) })
  const keys = []

  for (const file of files) {
    const relativePath = relative(albumsRoot, file).split('\\').join('/')
    const objectKey = `${ALBUMS_R2_PREFIX}/${relativePath}`
    const body = await readFile(file)

    await bucket.put(objectKey, new Uint8Array(body), {
      httpMetadata: {
        contentType: contentTypeForFile(file),
      },
    })

    keys.push(objectKey)
  }

  return { uploaded: keys.length, keys, publicUrl: getPublicUrlFromEnv(env) }
}

export async function pruneAlbumsFromR2({ dryRun = false } = {}) {
  const { env } = await getWranglerPlatform()
  const bucket = env.PHOTOS

  if (!bucket) {
    throw new Error('Missing PHOTOS binding. Add r2_buckets to wrangler.json.')
  }

  const localKeys = await collectLocalR2Keys(albumsRoot, ALBUMS_R2_PREFIX)
  const remoteKeys = await listAllR2Keys(bucket, `${ALBUMS_R2_PREFIX}/`)
  const orphanKeys = remoteKeys.filter((key) => !localKeys.has(key)).sort()

  if (!dryRun) {
    for (const key of orphanKeys) {
      await bucket.delete(key)
    }
  }

  return {
    dryRun,
    prefix: ALBUMS_R2_PREFIX,
    localCount: localKeys.size,
    remoteCount: remoteKeys.length,
    deleted: dryRun ? 0 : orphanKeys.length,
    keys: orphanKeys,
  }
}

function getPublicUrlFromEnv(env) {
  const url = env.PHOTOS_PUBLIC_URL
  return typeof url === 'string' && url.trim() ? url.replace(/\/$/, '') : null
}

export async function getR2PublicUrl() {
  const { env } = await getWranglerPlatform()
  return getPublicUrlFromEnv(env)
}

export async function getR2BucketName() {
  return 'homepage-photos'
}
