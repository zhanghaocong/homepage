import { WallPage } from '~/features/wall/WallPage'
import { site } from '~/shared/data/site'

export function meta() {
  return [{ title: site.title }, { name: 'description', content: site.description }]
}

export default function Index() {
  return <WallPage />
}
