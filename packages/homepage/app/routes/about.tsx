import AboutPage from '~/features/about/AboutPage'
import { site } from '~/shared/data/site'

export function meta() {
  return [
    { title: `About — ${site.name}` },
    {
      name: 'description',
      content: '出行与日常的照片。',
    },
  ]
}

export default AboutPage
