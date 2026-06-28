import { SeriesIndexPage } from '~/features/archive/SeriesIndexPage'
import { site } from '~/shared/data/site'

export function meta() {
  return [
    { title: `Series — ${site.title}` },
    { name: 'description', content: 'Browse the photography archive by series.' },
  ]
}

export default function SeriesRoute() {
  return <SeriesIndexPage />
}
