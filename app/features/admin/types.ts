export type Photo = {
  id: string
  seriesId: string
  thumbSrc: string
  previewSrc: string
  largeSrc: string
  /** @deprecated use previewSrc */
  src: string
  width: number
  height: number
}

export type Series = {
  id: string
  title: string
  photos: Photo[]
}

export type SeriesManifest = {
  generatedAt: string
  sourceRoot: string
  series: Series[]
}

export type AdminState = {
  manifest: SeriesManifest
  r2Configured: boolean
  r2PublicUrl: string | null
  r2Bucket: string | null
}

export type SyncResult = {
  uploaded: number
  keys: string[]
  publicUrl: string | null
}
