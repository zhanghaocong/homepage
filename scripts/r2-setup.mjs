/**
 * One-shot R2 setup: create bucket and sync public/albums.
 *
 * Prerequisites:
 *   npx wrangler login
 *
 * Usage:
 *   node scripts/r2-setup.mjs
 */
import { execSync, spawnSync } from 'node:child_process'

import { getR2PublicUrl, syncAlbumsToR2 } from './lib/r2-sync.mjs'

function run(command) {
  console.log(`→ ${command}`)
  execSync(command, { stdio: 'inherit' })
}

function ensureLoggedIn() {
  try {
    run('npx wrangler whoami')
  } catch {
    throw new Error('Not logged in. Run: npx wrangler login')
  }
}

function ensureBucket() {
  console.log('→ npx wrangler r2 bucket create homepage-photos')
  const result = spawnSync('npx', ['wrangler', 'r2', 'bucket', 'create', 'homepage-photos'], {
    encoding: 'utf8',
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`

  if (result.status === 0) {
    return
  }

  if (output.includes('already exists') || output.includes('10004')) {
    console.log('Bucket homepage-photos already exists')
    return
  }

  if (output.includes('10042') || output.includes('enable R2')) {
    throw new Error(
      'R2 is not enabled for this account. Open https://dash.cloudflare.com/8b7eba6c480b84cad297f995413afd14/r2/overview and enable R2, then rerun: npm run r2:setup',
    )
  }

  process.stdout.write(output)
  throw new Error('Failed to create R2 bucket homepage-photos')
}

async function main() {
  ensureLoggedIn()
  ensureBucket()

  const publicUrl = await getR2PublicUrl()
  if (!publicUrl) {
    throw new Error('Set vars.PHOTOS_PUBLIC_URL in wrangler.json before running setup')
  }

  console.log(`\nSyncing albums to R2 (public base: ${publicUrl})...`)
  const sync = await syncAlbumsToR2()
  console.log(`Uploaded ${sync.uploaded} objects`)

  console.log(`\nDone.`)
  console.log(`\nNext: npm run deploy`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
