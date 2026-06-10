import { PhotoList, PhotoListMissing } from '~/features/collections/PhotoList'
import { getPhotoListByAlbum, photoAlbums } from '~/features/collections/data/photoCollections'
import { site } from '~/shared/data/site'
import type { Route } from './+types/album'

export function meta({ params }: Route.MetaArgs) {
  const list = getPhotoListByAlbum(params.albumId ?? '')
  return [
    { title: list ? `${list.title} Album — ${site.name}` : `Album — ${site.name}` },
    {
      name: 'description',
      content: list?.description ?? 'Browse photos by album.',
    },
  ]
}

export default function AlbumRoute({ params }: Route.ComponentProps) {
  const albumId = params.albumId ?? ''
  const list = getPhotoListByAlbum(albumId)

  if (!list) {
    return <PhotoListMissing kind="album" value={albumId} suggestions={photoAlbums} />
  }

  return <PhotoList list={list} />
}
