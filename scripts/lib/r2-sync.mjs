import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { getPlatformProxy } from 'wrangler'

import { archiveRoot, projectRoot } from './paths.mjs'

/** @type {Awaited<ReturnType<typeof getPlatformProxy>> | null} */
let platformProxy = null

export async function getAdminPlatform() {
  if (!platformProxy) {
    platformProxy = await getPlatformProxy({
      configPath: join(projectRoot, 'wrangler.json'),
      persist: true,
    })
  }
  return platformProxy
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)))
      continue
    }
    if (entry.isFile()) {
      files.push(absolute)
    }
  }

  return files
}

export async function isR2Configured() {
  const { env } = await getAdminPlatform()
  return Boolean(env.PHOTOS)
}

export async function syncArchiveToR2() {
  const { env } = await getAdminPlatform()
  const bucket = env.PHOTOS

  if (!bucket) {
    throw new Error('Missing PHOTOS binding. Add r2_buckets to wrangler.json.')
  }

  let archiveExists = true
  try {
    await stat(archiveRoot)
  } catch {
    archiveExists = false
  }

  if (!archiveExists) {
    return { uploaded: 0, keys: [], publicUrl: getPublicUrlFromEnv(env) }
  }

  const files = await walkFiles(archiveRoot)
  const keys = []

  for (const file of files) {
    const key = relative(archiveRoot, file).split('\\').join('/')
    const objectKey = `archive/${key}`
    const body = await readFile(file)

    await bucket.put(objectKey, new Uint8Array(body), {
      httpMetadata: {
        contentType: file.endsWith('.webp') ? 'image/webp' : undefined,
      },
    })

    keys.push(objectKey)
  }

  return { uploaded: keys.length, keys, publicUrl: getPublicUrlFromEnv(env) }
}

function getPublicUrlFromEnv(env) {
  const url = env.PHOTOS_PUBLIC_URL
  return typeof url === 'string' && url.trim() ? url.replace(/\/$/, '') : null
}

export async function getR2PublicUrl() {
  const { env } = await getAdminPlatform()
  return getPublicUrlFromEnv(env)
}

export async function getR2BucketName() {
  return 'homepage-photos'
}
