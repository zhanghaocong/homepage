import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { manifestApiMiddleware } from './server/vite-manifest-api.ts'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    reactRouter(),
    {
      name: 'manifest-api',
      configureServer(server) {
        server.middlewares.use(manifestApiMiddleware())
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
})
