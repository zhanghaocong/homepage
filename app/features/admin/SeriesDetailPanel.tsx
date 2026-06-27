import { useRef, useState } from 'react'

import type { Photo, Series } from './types'

type SeriesDetailPanelProps = {
  series: Series | null
  onUpdateTitle: (seriesId: string, title: string) => Promise<void>
  onUpload: (seriesId: string, files: File[]) => Promise<void>
  onDeletePhoto: (seriesId: string, photoId: string) => Promise<void>
  onReorder: (seriesId: string, photoIds: string[]) => Promise<void>
  busy: boolean
}

function movePhoto(photos: Photo[], fromIndex: number, toIndex: number) {
  const next = [...photos]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function SeriesDetailPanel({
  series,
  onUpdateTitle,
  onUpload,
  onDeletePhoto,
  onReorder,
  busy,
}: SeriesDetailPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  if (!series) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-[var(--site-border)] p-8 text-sm text-[var(--site-fg-muted)]">
        选择一个 series 开始管理照片
      </section>
    )
  }

  if (title !== series.title && !savingTitle) {
    setTitle(series.title)
  }

  async function handleSaveTitle(event: React.FormEvent) {
    event.preventDefault()
    if (!series || title.trim() === series.title) return
    setSavingTitle(true)
    try {
      await onUpdateTitle(series.id, title.trim())
    } finally {
      setSavingTitle(false)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!series || !files?.length) return
    setUploading(true)
    try {
      await onUpload(series.id, Array.from(files))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDropReorder(targetIndex: number) {
    if (!series || dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }

    const reordered = movePhoto(series.photos, dragIndex, targetIndex)
    setDragIndex(null)
    await onReorder(
      series.id,
      reordered.map((photo) => photo.id),
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-4 border-b border-[var(--site-border)] pb-6">
        <form onSubmit={handleSaveTitle} className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 space-y-1">
            <span className="text-xs text-[var(--site-fg-muted)]">标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-[var(--site-border)] bg-transparent px-3 py-2 text-lg"
              disabled={busy || savingTitle}
            />
          </label>
          <button
            type="submit"
            disabled={busy || savingTitle || title.trim() === series.title}
            className="rounded-lg border border-[var(--site-border)] px-3 py-2 text-sm transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
          >
            {savingTitle ? '保存中…' : '保存标题'}
          </button>
        </form>
        <p className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">{series.id}</p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium tracking-wide text-[var(--site-fg)] uppercase">Photos</h3>
          <label className="cursor-pointer rounded-lg border border-[var(--site-border)] px-3 py-2 text-sm transition hover:bg-[var(--site-tag-bg)]">
            {uploading ? '上传中…' : '上传图片'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy || uploading}
              onChange={(event) => void handleUpload(event.target.files)}
            />
          </label>
        </div>

        {series.photos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--site-border)] px-4 py-8 text-center text-sm text-[var(--site-fg-muted)]">
            还没有照片，点击上传
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {series.photos.map((photo, index) => (
              <li
                key={photo.id}
                draggable={!busy}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleDropReorder(index)}
                onDragEnd={() => setDragIndex(null)}
                className={`overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-tag-bg)] ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <img src={photo.thumbSrc ?? photo.previewSrc ?? photo.src} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">
                    #{index + 1} · {photo.width}×{photo.height}
                  </span>
                  <button
                    type="button"
                    onClick={() => void onDeletePhoto(series.id, photo.id)}
                    disabled={busy}
                    className="text-xs text-[var(--site-fg-muted)] hover:text-red-500"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {series.photos.length > 1 ? (
          <p className="text-xs text-[var(--site-fg-muted)]">拖拽卡片可调整顺序，完成后会重写 photo id。</p>
        ) : null}
      </div>
    </section>
  )
}
