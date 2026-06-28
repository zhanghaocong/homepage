import { createRequestHandler } from 'react-router'

import { serveArchiveFromR2 } from './archive'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

export default {
  async fetch(request, env, ctx) {
    const archiveResponse = await serveArchiveFromR2(request, env)
    if (archiveResponse) {
      return archiveResponse
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    })
  },
} satisfies ExportedHandler<Env>
