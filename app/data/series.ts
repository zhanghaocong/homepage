import seriesManifest from './series.json'

export type Photo = {
  id: string
  seriesId: string
  thumbSrc: string
  previewSrc: string
  largeSrc: string
  /** Alias of previewSrc for covers and admin thumbnails */
  src: string
  width: number
  height: number
}

export type Series = {
  id: string
  title: string
  photos: Photo[]
}

export const seriesList: Series[] = seriesManifest.series

export const archivePhotos: Photo[] = seriesList.flatMap((series) => series.photos)

export function getSeriesById(seriesId: string): Series | undefined {
  return seriesList.find((series) => series.id === seriesId)
}

export function getPhotoById(photoId: string): Photo | undefined {
  return archivePhotos.find((photo) => photo.id === photoId)
}
