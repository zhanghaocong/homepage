import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const projectRoot = join(__dirname, '../..')
export const publicRoot = join(projectRoot, 'public')
export const archiveRoot = join(publicRoot, 'archive')
export const manifestPath = join(projectRoot, 'app/data/series.json')
