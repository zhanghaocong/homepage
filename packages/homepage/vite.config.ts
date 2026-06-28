import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const albumsRoot = join(dirname(fileURLToPath(import.meta.url)), '../albums/public')

function contentTypeForPath(filePath: string) {
  if (filePath.endsWith('.avif')) return 'image/avif'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  if (filePath.endsWith('.webp')) return 'image/webp'
  return undefined
}

function serveAlbumsInDev(): Plugin {
  return {
    name: 'serve-albums-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
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
      })
    },
  }
}

export default defineConfig(() => ({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    serveAlbumsInDev(),
  ],
}))
