import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect } from 'vite'

import {
  addPhoto,
  createAlbum,
  deleteAlbum,
  listAlbums,
  listPhotos,
  removePhoto,
  reorderAlbums,
  reorderPhotos,
} from './manifest.ts'
import { albumsRoot } from './paths.ts'

type JsonBody = Record<string, unknown>

async function readJsonBody(req: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) return {}

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as JsonBody
  } catch {
    throw new Error('请求体不是有效的 JSON')
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function sendError(res: ServerResponse, error: unknown) {
  const message = error instanceof Error ? error.message : '未知错误'
  sendJson(res, 400, { error: message })
}

function contentTypeForPath(filePath: string) {
  if (filePath.endsWith('.avif')) return 'image/avif'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  if (filePath.endsWith('.webp')) return 'image/webp'
  return undefined
}

function serveAlbumFile(url: string, res: ServerResponse, next: Connect.NextFunction) {
  if (!url.startsWith('/albums/')) {
    next()
    return
  }

  const relativePath = url.slice('/albums/'.length)
  const filePath = normalize(join(albumsRoot, relativePath))

  if (!filePath.startsWith(albumsRoot) || !existsSync(filePath)) {
    next()
    return
  }

  const stat = statSync(filePath)
  if (!stat.isFile()) {
    next()
    return
  }

  const contentType = contentTypeForPath(filePath)
  if (contentType) {
    res.setHeader('content-type', contentType)
  }

  createReadStream(filePath).pipe(res)
}

async function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string) {
  const method = req.method ?? 'GET'

  try {
    if (method === 'GET' && pathname === '/api/albums') {
      sendJson(res, 200, { albums: await listAlbums() })
      return
    }

    if (method === 'POST' && pathname === '/api/albums') {
      const body = await readJsonBody(req)
      const id = typeof body.id === 'string' ? body.id.trim() : ''
      if (!id) throw new Error('缺少相册 ID')
      await createAlbum(id)
      sendJson(res, 201, { ok: true })
      return
    }

    if (method === 'PUT' && pathname === '/api/albums/order') {
      const body = await readJsonBody(req)
      const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : []
      await reorderAlbums(ids)
      sendJson(res, 200, { ok: true })
      return
    }

    const albumMatch = pathname.match(/^\/api\/albums\/([^/]+)$/)
    if (albumMatch) {
      const albumId = decodeURIComponent(albumMatch[1]!)

      if (method === 'DELETE') {
        const body = await readJsonBody(req)
        await deleteAlbum(albumId, { removeFiles: body.removeFiles === true })
        sendJson(res, 200, { ok: true })
        return
      }
    }

    const photosMatch = pathname.match(/^\/api\/albums\/([^/]+)\/photos$/)
    if (photosMatch) {
      const albumId = decodeURIComponent(photosMatch[1]!)

      if (method === 'GET') {
        sendJson(res, 200, { photos: await listPhotos(albumId) })
        return
      }

      if (method === 'POST') {
        const body = await readJsonBody(req)
        const id = typeof body.id === 'string' ? body.id.trim() : ''
        if (!id) throw new Error('缺少照片基名')
        await addPhoto(albumId, id)
        sendJson(res, 201, { ok: true })
        return
      }

      if (method === 'PUT') {
        const body = await readJsonBody(req)
        const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : []
        await reorderPhotos(albumId, ids)
        sendJson(res, 200, { ok: true })
        return
      }
    }

    const photoMatch = pathname.match(/^\/api\/albums\/([^/]+)\/photos\/([^/]+)$/)
    if (photoMatch && method === 'DELETE') {
      const albumId = decodeURIComponent(photoMatch[1]!)
      const photoId = decodeURIComponent(photoMatch[2]!)
      await removePhoto(albumId, photoId)
      sendJson(res, 200, { ok: true })
      return
    }

    sendJson(res, 404, { error: '未找到接口' })
  } catch (error) {
    sendError(res, error)
  }
}

export function manifestApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0] ?? ''

    if (url.startsWith('/api/')) {
      void handleApi(req, res, url)
      return
    }

    serveAlbumFile(url, res, next)
  }
}
