import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export const albumsRoot = join(packageRoot, '../albums/public')
export const albumManifestPath = join(albumsRoot, 'manifest.txt')

export const PHOTO_VARIANT_SUFFIXES = [
  '-l.avif',
  '-m.avif',
  '-s.avif',
  '-l.jpg',
  '-m.jpg',
  '-s.jpg',
] as const
