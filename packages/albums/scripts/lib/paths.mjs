import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const packageRoot = join(__dirname, '../..')
export const albumsRoot = join(packageRoot, 'public')
export const homepageRoot = join(packageRoot, '../homepage')
export const wranglerConfigPath = join(homepageRoot, 'wrangler.json')
