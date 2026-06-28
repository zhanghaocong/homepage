import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { manifestApiMiddleware } from './server/vite-manifest-api.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'manifest-api',
      configureServer(server) {
        server.middlewares.use(manifestApiMiddleware())
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
