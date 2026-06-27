/**
 * Sync public/archive to the PHOTOS R2 binding from wrangler.json.
 *
 * Usage:
 *   node scripts/sync-archive-to-r2.mjs
 *   node scripts/sync-archive-to-r2.mjs --update-manifest
 */
import { syncArchiveToR2 } from './lib/r2-sync.mjs'
import { applyPublicUrl, readManifest, writeManifest } from './lib/manifest.mjs'

const updateManifest = process.argv.includes('--update-manifest')

async function main() {
  const result = await syncArchiveToR2()
  console.log(`Uploaded ${result.uploaded} objects to R2`)

  if (result.keys.length > 0) {
    console.log(`First key: ${result.keys[0]}`)
    console.log(`Last key: ${result.keys[result.keys.length - 1]}`)
  }

  if (updateManifest) {
    if (!result.publicUrl) {
      throw new Error('PHOTOS_PUBLIC_URL is empty in wrangler.json — set it before --update-manifest')
    }

    const manifest = await readManifest()
    const next = await writeManifest(applyPublicUrl(manifest, result.publicUrl))
    console.log(`Updated manifest (${next.series.length} series) with CDN base: ${result.publicUrl}`)
  } else if (!result.publicUrl) {
    console.log('Tip: set vars.PHOTOS_PUBLIC_URL in wrangler.json, then rerun with --update-manifest')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
