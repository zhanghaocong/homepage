import { preloadGalleryImages, type GalleryLoadProgress } from '~/lib/preloadGalleryImages'

export function initKoalaLoader(root: HTMLElement, onComplete: () => void) {
  const num = root.querySelector<HTMLElement>('.l-splash__num')
  let countEnd = false
  let loadEnd = false

  const complete = () => {
    if (num) num.textContent = '100'
    onComplete()
  }

  const tryComplete = () => {
    if (loadEnd && countEnd) complete()
  }

  const onProgress = ({ ratio }: GalleryLoadProgress) => {
    if (!num) return
    const value = Math.min(99, Math.floor(ratio * 100))
    num.textContent = String(value)
    if (ratio >= 1) {
      loadEnd = true
      tryComplete()
    }
  }

  const { promise, cancel } = preloadGalleryImages(onProgress)

  let n = 0
  const counter = window.setInterval(() => {
    if (n < 99) {
      n += 3
      if (num && Number(num.textContent) < n) {
        num.textContent = String(n)
      }
    } else {
      window.clearInterval(counter)
      countEnd = true
      tryComplete()
    }
  }, 10.1010101010101)

  void promise.catch(() => {
    loadEnd = true
    tryComplete()
  })

  return () => {
    cancel()
    window.clearInterval(counter)
  }
}
