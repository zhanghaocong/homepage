import { useEffect, useState } from 'react'
import { archivePhotos } from '~/data/series'
import {
  ARCHIVE_PRELOAD_RANGE,
  findVisiblePhotoIndex,
} from '~/features/archive/lib/photoPreload'

export function useArchiveVisibleIndex() {
  const [visibleIndex, setVisibleIndex] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      const next = findVisiblePhotoIndex()
      setVisibleIndex((current) => (current === next ? current : next))
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [])

  return visibleIndex
}

export function useArchivePhotoPreload(visibleIndex: number) {
  useEffect(() => {
    const start = Math.max(0, visibleIndex - ARCHIVE_PRELOAD_RANGE)
    const end = Math.min(archivePhotos.length - 1, visibleIndex + ARCHIVE_PRELOAD_RANGE)

    for (let index = start; index <= end; index++) {
      const photo = archivePhotos[index]
      if (!photo) continue
      const img = new Image()
      img.src = photo.largeSrc
    }
  }, [visibleIndex])
}
