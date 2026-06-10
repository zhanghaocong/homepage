import AboutPage from '~/features/about/AboutPage'
import { site } from '~/shared/data/site'

export function meta() {
  return [
    { title: `About — ${site.name}` },
    {
      name: 'description',
      content: `Learn more about ${site.name}.`,
    },
  ]
}

export default AboutPage
