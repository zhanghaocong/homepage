/**
 * Sync public/albums to the PHOTOS R2 binding from wrangler.json.
 *
 * Usage:
 *   node scripts/sync-albums-to-r2.mjs
 */
import { syncAlbumsToR2 } from './lib/r2-sync.mjs'

async function main() {
  const result = await syncAlbumsToR2()
  console.log(`Uploaded ${result.uploaded} objects to R2`)

  if (result.keys.length > 0) {
    console.log(`First key: ${result.keys[0]}`)
    console.log(`Last key: ${result.keys[result.keys.length - 1]}`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
