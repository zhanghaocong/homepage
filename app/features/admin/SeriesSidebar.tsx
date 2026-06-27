import { useState } from 'react'

import { createSeries, deleteSeries, updateSeries } from './api'
import type { Series } from './types'

type SeriesSidebarProps = {
  seriesList: Series[]
  selectedId: string | null
  busy: boolean
  onSelect: (seriesId: string) => void
  onBusyChange: (busy: boolean) => void
  onManifestChange: () => Promise<void>
  onError: (message: string) => void
}

export function SeriesSidebar({
  seriesList,
  selectedId,
  busy,
  onSelect,
  onBusyChange,
  onManifestChange,
  onError,
}: SeriesSidebarProps) {
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

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

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!newId.trim() || !newTitle.trim()) return

    await run(async () => {
      const before = new Set(seriesList.map((item) => item.id))
      const { manifest } = await createSeries({ id: newId.trim(), title: newTitle.trim() })
      const created = manifest.series.find((item) => !before.has(item.id))
      await onManifestChange()
      if (created) onSelect(created.id)
      setNewId('')
      setNewTitle('')
    })
  }

  async function handleSaveTitle(seriesId: string) {
    if (!editTitle.trim()) return

    await run(async () => {
      await updateSeries(seriesId, { title: editTitle.trim() })
      setEditingId(null)
      await onManifestChange()
    })
  }

  async function handleDelete(seriesId: string) {
    if (!window.confirm(`删除系列「${seriesId}」及其所有图片？`)) return

    await run(async () => {
      await deleteSeries(seriesId)
      await onManifestChange()
    })
  }

  return (
    <aside className="space-y-6">
      <form onSubmit={(event) => void handleCreate(event)} className="space-y-3 rounded-xl border border-[var(--site-border)] p-4">
        <h2 className="text-sm font-medium tracking-wide text-[var(--site-fg)] uppercase">新建 Series</h2>
        <input
          value={newId}
          onChange={(event) => setNewId(event.target.value)}
          placeholder="id，如 tokyo-2026"
          className="w-full rounded-lg border border-[var(--site-border)] bg-transparent px-3 py-2 text-sm text-[var(--site-fg)] outline-none focus:border-[var(--site-fg-muted)]"
        />
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="标题"
          className="w-full rounded-lg border border-[var(--site-border)] bg-transparent px-3 py-2 text-sm text-[var(--site-fg)] outline-none focus:border-[var(--site-fg-muted)]"
        />
        <button
          type="submit"
          disabled={busy || !newId.trim() || !newTitle.trim()}
          className="w-full rounded-lg border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-fg)] transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
        >
          创建
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium tracking-wide text-[var(--site-fg)] uppercase">Series</h2>
        <ul className="divide-y divide-[var(--site-border)] rounded-xl border border-[var(--site-border)]">
          {seriesList.map((series) => {
            const isSelected = series.id === selectedId
            const isEditing = editingId === series.id

            return (
              <li key={series.id} className={isSelected ? 'bg-[var(--site-tag-bg)]' : undefined}>
                <button
                  type="button"
                  onClick={() => onSelect(series.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--site-fg)]">{series.title}</p>
                    <p className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">{series.id}</p>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">
                    {series.photos.length}
                  </span>
                </button>

                {isSelected ? (
                  <div className="space-y-2 border-t border-[var(--site-border)] px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--site-border)] bg-transparent px-2 py-1 text-sm text-[var(--site-fg)] outline-none"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSaveTitle(series.id)}
                          className="rounded-lg border border-[var(--site-border)] px-2 py-1 text-xs"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-[var(--site-border)] px-2 py-1 text-xs text-[var(--site-fg-muted)]"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(series.id)
                            setEditTitle(series.title)
                          }}
                          className="rounded-lg border border-[var(--site-border)] px-2 py-1 text-xs"
                        >
                          重命名
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(series.id)}
                          className="rounded-lg border border-[var(--site-border)] px-2 py-1 text-xs text-red-500"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
