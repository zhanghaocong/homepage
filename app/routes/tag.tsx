import { PhotoList, PhotoListMissing } from '~/features/collections/PhotoList'
import { getPhotoListByTag, photoTags } from '~/features/collections/data/photoCollections'
import { site } from '~/shared/data/site'
import type { Route } from './+types/tag'

export function meta({ params }: Route.MetaArgs) {
  const list = getPhotoListByTag(params.tag ?? '')
  return [
    { title: list ? `#${list.id} — ${site.name}` : `Tag — ${site.name}` },
    {
      name: 'description',
      content: list?.description ?? 'Browse photos by tag.',
    },
  ]
}

export default function TagRoute({ params }: Route.ComponentProps) {
  const tag = params.tag ?? ''
  const list = getPhotoListByTag(tag)

  if (!list) {
    return <PhotoListMissing kind="tag" value={tag} suggestions={photoTags} />
  }

  return <PhotoList list={list} />
}
