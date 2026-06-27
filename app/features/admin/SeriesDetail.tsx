import { useRef, useState } from 'react'

import { deletePhoto, reorderPhotos, uploadPhotos } from './api'
import type { Photo, Series } from './types'

type SeriesDetailProps = {
  series: Series
  busy: boolean
  onBusyChange: (busy: boolean) => void
  onManifestChange: () => Promise<void>
  onError: (message: string) => void
}

function movePhoto(photos: Photo[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= photos.length || fromIndex === toIndex) {
    return photos
  }

  const next = [...photos]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function SeriesDetail({ series, busy, onBusyChange, onManifestChange, onError }: SeriesDetailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  async function run<T>(task: () => Promise<T>) {
    onBusyChange(true)
    try {
      return await task()
    } catch (error) {
      onError(error instanceof Error ? error.message : '操作失败')
      return undefined
    } finally {
      onBusyChange(false)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return

    await run(async () => {
      await uploadPhotos(
        series.id,
        Array.from(files).filter((file) => file.type.startsWith('image/')),
      )
      await onManifestChange()
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm('删除这张照片？')) return

    await run(async () => {
      await deletePhoto(series.id, photoId)
      await onManifestChange()
    })
  }

  async function handleReorder(nextPhotos: Photo[]) {
    await run(async () => {
      await reorderPhotos(
        series.id,
        nextPhotos.map((photo) => photo.id),
      )
      await onManifestChange()
    })
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-[var(--site-fg)]">{series.title}</h2>
          <p className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">{series.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-[var(--site-border)] px-3 py-1.5 text-sm text-[var(--site-fg)] transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
          >
            上传图片
          </button>
        </div>
      </div>

      {series.photos.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-[var(--site-border)] px-4 py-10 text-center text-sm text-[var(--site-fg-muted)]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            void handleUpload(event.dataTransfer.files)
          }}
        >
          拖拽图片到此处，或点击「上传图片」
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.photos.map((photo, index) => (
            <li
              key={photo.id}
              draggable={!busy}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (dragIndex === null) return
                void handleReorder(movePhoto(series.photos, dragIndex, index))
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-tag-bg)] ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <img src={photo.thumbSrc ?? photo.previewSrc ?? photo.src} alt="" width={photo.width} height={photo.height} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate font-[family-name:var(--site-font-mono)] text-[10px] text-[var(--site-fg-muted)]">
                  {photo.id}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => void handleReorder(movePhoto(series.photos, index, index - 1))}
                    className="rounded px-1.5 py-0.5 text-xs text-[var(--site-fg-muted)] hover:bg-[var(--site-bg)] disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === series.photos.length - 1}
                    onClick={() => void handleReorder(movePhoto(series.photos, index, index + 1))}
                    className="rounded px-1.5 py-0.5 text-xs text-[var(--site-fg-muted)] hover:bg-[var(--site-bg)] disabled:opacity-30"
                    aria-label="Move later"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDeletePhoto(photo.id)}
                    className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-[var(--site-bg)] disabled:opacity-30"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
