/**
 * Delete R2 objects under albums/ that no longer exist in @internal/albums/public/.
 *
 * Usage:
 *   node scripts/prune-albums-from-r2.mjs           # delete orphans
 *   node scripts/prune-albums-from-r2.mjs --dry-run # preview only
 */
import { pruneAlbumsFromR2 } from './lib/r2-sync.mjs'

const dryRun = process.argv.includes('--dry-run')

async function main() {
  const result = await pruneAlbumsFromR2({ dryRun })

  console.log(`${dryRun ? 'Would delete' : 'Deleted'} ${result.keys.length} orphan object(s) under ${result.prefix}/`)
  console.log(`Local files: ${result.localCount}, R2 objects: ${result.remoteCount}`)

  if (result.keys.length > 0) {
    for (const key of result.keys) {
      console.log(`  ${dryRun ? '-' : '×'} ${key}`)
    }
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
