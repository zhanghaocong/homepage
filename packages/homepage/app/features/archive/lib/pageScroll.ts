export function scrollToSeries(seriesId: string) {
  const section = document.getElementById(`series-${seriesId}`)
  const photo = section?.querySelector<HTMLElement>('.archive__photo')
  if (!photo) return

  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : 'smooth'

  photo.scrollIntoView({ block: 'center', behavior })
}
