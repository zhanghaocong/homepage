const CACHE_CONTROL = 'public, max-age=31536000, immutable'

export async function serveArchiveFromR2(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/archive/')) {
    return null
  }

  const key = url.pathname.slice(1)
  const object = await env.PHOTOS.get(key)

  if (!object) {
    return new Response('Not Found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', CACHE_CONTROL)

  if (request.headers.get('if-none-match') === object.httpEtag) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(object.body, { headers })
}
