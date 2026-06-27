import { useRef, useState } from 'react'

import type { Series } from './types'

type SeriesListPanelProps = {
  series: Series[]
  selectedId: string | null
  onSelect: (seriesId: string) => void
  onCreate: (input: { id: string; title: string }) => Promise<void>
  onDelete: (seriesId: string) => Promise<void>
  busy: boolean
}

export function SeriesListPanel({ series, selectedId, onSelect, onCreate, onDelete, busy }: SeriesListPanelProps) {
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setCreating(true)
    try {
      await onCreate({ id, title })
      setId('')
      setTitle('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium tracking-wide text-[var(--site-fg)] uppercase">Series</h2>

      <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-[var(--site-border)] p-4">
        <p className="text-xs text-[var(--site-fg-muted)]">新建系列</p>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="id，如 tokyo-2026"
          className="w-full rounded-lg border border-[var(--site-border)] bg-transparent px-3 py-2 text-sm"
          disabled={busy || creating}
        />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题"
          className="w-full rounded-lg border border-[var(--site-border)] bg-transparent px-3 py-2 text-sm"
          disabled={busy || creating}
        />
        <button
          type="submit"
          disabled={busy || creating || !id.trim() || !title.trim()}
          className="rounded-lg border border-[var(--site-border)] px-3 py-2 text-sm transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
        >
          {creating ? '创建中…' : '创建'}
        </button>
      </form>

      <ul className="divide-y divide-[var(--site-border)] rounded-xl border border-[var(--site-border)]">
        {series.map((item) => (
          <li key={item.id}>
            <div
              className={`flex items-center gap-2 px-3 py-3 ${selectedId === item.id ? 'bg-[var(--site-tag-bg)]' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="min-w-0 flex-1 text-left"
                disabled={busy}
              >
                <p className="truncate text-sm font-medium text-[var(--site-fg)]">{item.title}</p>
                <p className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">
                  {item.id} · {item.photos.length}
                </p>
              </button>
              <button
                type="button"
                onClick={() => void onDelete(item.id)}
                disabled={busy}
                className="shrink-0 rounded px-2 py-1 text-xs text-[var(--site-fg-muted)] hover:bg-[var(--site-bg)] hover:text-red-500"
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
