export const ARCHIVE_PRELOAD_RANGE = 2

export function findVisiblePhotoIndex() {
  const photos = document.querySelectorAll<HTMLElement>('.archive__photo')
  const center = window.innerHeight / 2
  let bestIndex = 0
  let nearest = Infinity

  photos.forEach((photo) => {
    const index = Number(photo.dataset.photoIndex)
    if (Number.isNaN(index)) return

    const rect = photo.getBoundingClientRect()
    const distance = Math.abs(rect.top + rect.height / 2 - center)
    if (distance < nearest) {
      nearest = distance
      bestIndex = index
    }
  })

  return bestIndex
}

export function isPhotoInPreloadRange(index: number, visibleIndex: number) {
  return Math.abs(index - visibleIndex) <= ARCHIVE_PRELOAD_RANGE
}
