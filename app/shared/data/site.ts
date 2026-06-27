type SiteLink = {
  label: string
  href: string
}

export const site = {
  name: 'Photo Archive',
  title: 'Photo Archive',
  description: 'Personal photography archive.',
  tagline: 'Series and moments.',
  links: [] as SiteLink[],
} as const
