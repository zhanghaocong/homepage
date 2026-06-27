import { ArchiveScroll } from '~/features/archive/ArchiveScroll'
import { site } from '~/shared/data/site'

export function meta() {
  return [{ title: site.title }, { name: 'description', content: site.description }]
}

export default function Index() {
  return <ArchiveScroll />
}
