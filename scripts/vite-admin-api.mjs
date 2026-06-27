import { createReadStream, createWriteStream } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import Busboy from 'busboy'

import { deletePhotoFiles, IMAGE_EXT, processPhotoFromPath } from './lib/photo-pipeline.mjs'
import {
  addPhoto,
  applyPublicUrl,
  createSeries,
  deletePhoto,
  deleteSeries,
  readManifest,
  regenerateManifest,
  reorderPhotos,
  updateSeries,
  writeManifest,
} from './lib/manifest.mjs'
import { getR2BucketName, getR2PublicUrl, isR2Configured, syncArchiveToR2 } from './lib/r2-sync.mjs'

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function parseRoute(url) {
  const pathname = new URL(url, 'http://localhost').pathname
  const parts = pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean)
  return parts
}

async function saveUpload(file) {
  const tempDir = await mkdtemp(join(tmpdir(), 'homepage-admin-'))
  const tempPath = join(tempDir, file.filename)
  await pipeline(file.stream, createWriteStream(tempPath))
  return { tempDir, tempPath }
}

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers })
    const fields = {}
    const files = []

    busboy.on('field', (name, value) => {
      fields[name] = value
    })

    busboy.on('file', (name, stream, info) => {
      files.push({
        field: name,
        filename: info.filename,
        mimeType: info.mimeType,
        stream,
      })
    })

    busboy.on('error', reject)
    busboy.on('finish', () => resolve({ fields, files }))
    req.pipe(busboy)
  })
}

async function handleUpload(seriesId, req) {
  const manifest = await readManifest()
  const series = manifest.series.find((item) => item.id === seriesId)
  if (!series) {
    throw new Error(`Series not found: ${seriesId}`)
  }

  const { files } = await parseMultipart(req)
  const uploads = files.filter((file) => file.field === 'photos')
  const results = []

  for (const upload of uploads) {
    const ext = upload.filename.slice(upload.filename.lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXT.has(ext)) {
      throw new Error(`Unsupported file type: ${upload.filename}`)
    }

    const { tempDir, tempPath } = await saveUpload(upload)
    try {
      const index = series.photos.length + results.length
      const { photo } = await processPhotoFromPath({
        seriesId,
        index,
        inputPath: tempPath,
        originalName: upload.filename,
      })
      const nextManifest = await addPhoto(seriesId, photo)
      const nextSeries = nextManifest.series.find((item) => item.id === seriesId)
      series.photos = nextSeries?.photos ?? series.photos
      results.push(photo)
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }

  return { uploaded: results.length, photos: results }
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  try {
    const parts = parseRoute(req.url)
    const method = req.method ?? 'GET'

    if (method === 'GET' && parts.length === 0) {
      const manifest = await readManifest()
      return sendJson(res, 200, {
        manifest,
        r2Configured: await isR2Configured(),
        r2PublicUrl: await getR2PublicUrl(),
        r2Bucket: await getR2BucketName(),
      })
    }

    if (method === 'POST' && parts[0] === 'series' && parts.length === 1) {
      const body = await readJson(req)
      const manifest = await createSeries(body)
      return sendJson(res, 201, { manifest })
    }

    if (method === 'PATCH' && parts[0] === 'series' && parts.length === 2) {
      const body = await readJson(req)
      const manifest = await updateSeries(parts[1], body)
      return sendJson(res, 200, { manifest })
    }

    if (method === 'DELETE' && parts[0] === 'series' && parts.length === 2) {
      const manifest = await deleteSeries(parts[1])
      return sendJson(res, 200, { manifest })
    }

    if (method === 'POST' && parts[0] === 'series' && parts[2] === 'photos' && parts.length === 3) {
      const result = await handleUpload(parts[1], req)
      const manifest = await readManifest()
      return sendJson(res, 201, { ...result, manifest })
    }

    if (method === 'DELETE' && parts[0] === 'series' && parts[2] === 'photos' && parts.length === 4) {
      const seriesId = parts[1]
      const photoId = parts[3]
      const manifest = await readManifest()
      const series = manifest.series.find((item) => item.id === seriesId)
      const photo = series?.photos.find((item) => item.id === photoId)
      if (!photo) {
        throw new Error(`Photo not found: ${photoId}`)
      }
      await deletePhotoFiles(photo)
      const nextManifest = await deletePhoto(seriesId, photoId)
      return sendJson(res, 200, { manifest: nextManifest })
    }

    if (method === 'PUT' && parts[0] === 'series' && parts[2] === 'photos' && parts[3] === 'order' && parts.length === 4) {
      const body = await readJson(req)
      const manifest = await reorderPhotos(parts[1], body.photoIds)
      return sendJson(res, 200, { manifest })
    }

    if (method === 'POST' && parts[0] === 'regenerate' && parts.length === 1) {
      const manifest = await regenerateManifest()
      return sendJson(res, 200, { manifest })
    }

    if (method === 'POST' && parts[0] === 'sync-r2' && parts.length === 1) {
      const body = await readJson(req)
      const syncResult = await syncArchiveToR2()
      let manifest = await readManifest()

      if (body.updateManifest && syncResult.publicUrl) {
        manifest = await writeManifest(applyPublicUrl(manifest, syncResult.publicUrl))
      }

      return sendJson(res, 200, { manifest, sync: syncResult })
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    sendJson(res, 400, { error: message })
  }
}

export function adminApiPlugin() {
  return {
    name: 'homepage-admin-api',
    configureServer(server) {
      server.middlewares.use('/api/admin', (req, res, next) => {
        if (!req.url) {
          next()
          return
        }
        void handleRequest(req, res)
      })
    },
  }
}
