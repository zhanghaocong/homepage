import { CATEGORY_UI, galleryImages, imageUrl, type CateImage, type CateKey } from '~/data/gallery'

export type PhotoCollectionKind = 'album' | 'tag'

export type PhotoListPhoto = {
  id: string
  src: string
  largeSrc: string
  width: number
  height: number
  albumId: string
  albumTitle: string
  tags: string[]
}

export type PhotoCollectionSummary = {
  id: string
  title: string
  description: string
  count: number
  href: string
}

export type PhotoListModel = {
  kind: PhotoCollectionKind
  id: string
  title: string
  description: string
  count: number
  photos: PhotoListPhoto[]
  collections: PhotoCollectionSummary[]
}

type AlbumDefinition = {
  id: string
  title: string
  category: CateKey
  description: string
}

const albumDefinitions: AlbumDefinition[] = CATEGORY_UI.map(({ id, label }) => ({
  id,
  title: label,
  category: label as CateKey,
  description: `${label} photographs from the wall archive.`,
}))

function formatTagTitle(tag: string) {
  return tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function orientationTag(image: CateImage) {
  return image.width >= image.height ? 'horizontal' : 'vertical'
}

export const allPhotos: PhotoListPhoto[] = albumDefinitions.flatMap((album) =>
  galleryImages[album.category].map((image, index) => {
    const tags = [album.id, orientationTag(image)]
    return {
      id: `${album.id}-${index}`,
      src: imageUrl(image.medium),
      largeSrc: imageUrl(image['2048x2048']),
      width: image.width,
      height: image.height,
      albumId: album.id,
      albumTitle: album.title,
      tags,
    }
  }),
)

export const photoAlbums: PhotoCollectionSummary[] = albumDefinitions.map((album) => ({
  id: album.id,
  title: album.title,
  description: album.description,
  count: galleryImages[album.category].length,
  href: `/albums/${album.id}`,
}))

export const photoTags: PhotoCollectionSummary[] = Array.from(
  allPhotos.reduce((tags, photo) => {
    for (const tag of photo.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1)
    }
    return tags
  }, new Map<string, number>()),
).map(([id, count]) => ({
  id,
  title: formatTagTitle(id),
  description: `Photos tagged ${formatTagTitle(id).toLowerCase()}.`,
  count,
  href: `/tags/${id}`,
}))

export function getPhotoListByAlbum(albumId: string): PhotoListModel | null {
  const album = photoAlbums.find((item) => item.id === albumId)
  if (!album) return null

  const photos = allPhotos.filter((photo) => photo.albumId === album.id)
  return {
    kind: 'album',
    id: album.id,
    title: album.title,
    description: album.description,
    count: photos.length,
    photos,
    collections: photoAlbums,
  }
}

export function getPhotoListByTag(tag: string): PhotoListModel | null {
  const summary = photoTags.find((item) => item.id === tag)
  if (!summary) return null

  const photos = allPhotos.filter((photo) => photo.tags.includes(summary.id))
  return {
    kind: 'tag',
    id: summary.id,
    title: summary.title,
    description: summary.description,
    count: photos.length,
    photos,
    collections: photoTags,
  }
}
