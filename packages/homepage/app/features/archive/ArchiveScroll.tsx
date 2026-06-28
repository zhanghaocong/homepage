import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { seriesList } from '~/data/series'
import { isPhotoInPreloadRange } from '~/features/archive/lib/photoPreload'
import { scrollToSeries } from '~/features/archive/lib/pageScroll'
import {
  useArchivePhotoPreload,
  useArchiveVisibleIndex,
} from '~/features/archive/useArchiveVisibleIndex'
import '~/features/archive/archive.css'

export function ArchiveScroll() {
  const [searchParams] = useSearchParams()
  const visibleIndex = useArchiveVisibleIndex()
  useArchivePhotoPreload(visibleIndex)

  useEffect(() => {
    document.documentElement.classList.add('is-archive-scroll')
    return () => {
      document.documentElement.classList.remove('is-archive-scroll')
    }
  }, [])

  useEffect(() => {
    const seriesId = searchParams.get('series')
    if (!seriesId) return
    scrollToSeries(seriesId)
  }, [searchParams])

  let photoOffset = 0

  return (
    <div className="archive">
      {seriesList.map((series) => {
        const startIndex = photoOffset
        photoOffset += series.photos.length

        return (
          <section
            key={series.id}
            id={`series-${series.id}`}
            className="archive__series"
            aria-label={series.title}
          >
            {series.photos.map((photo, indexInSeries) => {
              const index = startIndex + indexInSeries
              const inRange = isPhotoInPreloadRange(index, visibleIndex)

              return (
                <figure
                  key={photo.id}
                  className="archive__photo"
                  data-photo-index={index}
                >
                  <img
                    src={photo.largeSrc}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    loading={inRange ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === visibleIndex ? 'high' : undefined}
                  />
                </figure>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
