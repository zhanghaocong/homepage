import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

function vendorChunk(id: string) {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('/three/') || id.includes('/@react-three/')) return 'three-vendor'
  if (id.includes('/postprocessing/')) return 'postprocessing-vendor'
  if (id.includes('/gsap/')) return 'gsap-vendor'
  return undefined
}

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return vendorChunk(id)
        },
      },
    },
  },
})
