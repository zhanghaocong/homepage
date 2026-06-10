import { useEffect, useRef, useState } from 'react'
import { preloadGalleryImages } from '~/features/wall/lib/preloadGalleryImages'

const LOADER_TICK_MS = 10.1010101010101
const LOADER_STEP = 3
const LOADER_CAP = 99

export function useGalleryLoader(enabled: boolean, onComplete: () => void) {
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!enabled) return

    let countEnd = false
    let loadEnd = false
    let counter = 0
    let cancelled = false
    let completed = false

    const bumpProgress = (value: number) => {
      setProgress((prev) => Math.max(prev, value))
    }

    const tryComplete = () => {
      if (cancelled || completed || !loadEnd || !countEnd) return
      completed = true
      bumpProgress(100)
      onCompleteRef.current()
    }

    const { promise, cancel: cancelPreload } = preloadGalleryImages(({ ratio }) => {
      bumpProgress(Math.min(LOADER_CAP, Math.floor(ratio * 100)))
      if (ratio >= 1) {
        loadEnd = true
        tryComplete()
      }
    })

    const counterId = window.setInterval(() => {
      if (counter < LOADER_CAP) {
        counter += LOADER_STEP
        bumpProgress(counter)
        return
      }
      window.clearInterval(counterId)
      countEnd = true
      tryComplete()
    }, LOADER_TICK_MS)

    void promise.catch(() => {
      loadEnd = true
      tryComplete()
    })

    return () => {
      cancelled = true
      cancelPreload()
      window.clearInterval(counterId)
    }
  }, [enabled])

  return progress
}
