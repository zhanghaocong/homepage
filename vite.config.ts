import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
// @ts-expect-error dev-only middleware has no typed .mjs entry
import { adminApiPlugin } from './scripts/vite-admin-api.mjs'

function vendorChunk(id: string) {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('/three/') || id.includes('/@react-three/')) return 'three-vendor'
  if (id.includes('/postprocessing/')) return 'postprocessing-vendor'
  return undefined
}

export default defineConfig(({ mode }) => ({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    ...(mode === 'development' ? [adminApiPlugin()] : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return vendorChunk(id)
        },
      },
    },
  },
}))
