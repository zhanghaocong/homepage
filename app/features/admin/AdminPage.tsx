import { useCallback, useEffect, useState } from 'react'

import { fetchAdminState, regenerateManifest, syncToR2 } from './api'
import { SeriesDetail } from './SeriesDetail'
import { SeriesSidebar } from './SeriesSidebar'
import type { AdminState } from './types'

export function AdminPage() {
  const [state, setState] = useState<AdminState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const next = await fetchAdminState()
    setState(next)
    setSelectedId((current) => {
      if (current && next.manifest.series.some((series) => series.id === current)) {
        return current
      }
      return next.manifest.series[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    void load()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : '无法加载管理数据')
      })
      .finally(() => setLoading(false))
  }, [load])

  async function refresh() {
    await load()
  }

  async function runGlobal(task: () => Promise<void>, successMessage: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await task()
      setMessage(successMessage)
      await refresh()
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const selectedSeries = state?.manifest.series.find((series) => series.id === selectedId) ?? null

  if (loading) {
    return <p className="text-sm text-[var(--site-fg-muted)]">加载中…</p>
  }

  if (!state) {
    return (
      <div className="rounded-xl border border-red-500/30 px-4 py-6 text-sm text-red-500">
        {error ?? '无法连接管理 API。请确认正在使用 npm run dev 启动。'}
      </div>
    )
  }

  return (
    <article className="space-y-8">
      <header className="space-y-2 border-b border-[var(--site-border)] pb-8">
        <p className="font-[family-name:var(--site-font-mono)] text-xs tracking-[0.28em] text-[var(--site-fg-muted)] uppercase">
          Dev only
        </p>
        <h1 className="font-[family-name:var(--site-font-display)] text-4xl font-light tracking-tight text-[var(--site-fg)]">
          照片管理
        </h1>
        <p className="text-lg text-[var(--site-fg-muted)]">上传图片、管理 series，并同步到 Cloudflare R2。</p>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--site-border)] px-4 py-3 text-sm">
        <span className="text-[var(--site-fg-muted)]">
          manifest: {new Date(state.manifest.generatedAt).toLocaleString()}
        </span>
        <span className="text-[var(--site-fg-muted)]">·</span>
        <span className={state.r2Configured ? 'text-emerald-600' : 'text-[var(--site-fg-muted)]'}>
          R2 {state.r2Configured ? `已绑定 (${state.r2Bucket})` : '未绑定'}
        </span>
        {state.r2PublicUrl ? (
          <>
            <span className="text-[var(--site-fg-muted)]">·</span>
            <span className="truncate font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">
              {state.r2PublicUrl}
            </span>
          </>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runGlobal(async () => {
                await regenerateManifest()
              }, '已根据 archive 目录重新生成 series.json')
            }
            className="rounded-lg border border-[var(--site-border)] px-3 py-1.5 text-sm transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
          >
            重新生成 manifest
          </button>
          <button
            type="button"
            disabled={busy || !state.r2Configured}
            onClick={() =>
              void runGlobal(async () => {
                const { sync } = await syncToR2(false)
                setMessage(`已上传 ${sync.uploaded} 个文件到 R2`)
              }, 'R2 同步完成')
            }
            className="rounded-lg border border-[var(--site-border)] px-3 py-1.5 text-sm transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
          >
            同步到 R2
          </button>
          <button
            type="button"
            disabled={busy || !state.r2Configured || !state.r2PublicUrl}
            onClick={() =>
              void runGlobal(async () => {
                const { sync } = await syncToR2(true)
                setMessage(`已上传 ${sync.uploaded} 个文件，并更新 manifest URL`)
              }, '已同步 R2 并更新 manifest URL')
            }
            className="rounded-lg border border-[var(--site-border)] px-3 py-1.5 text-sm transition hover:bg-[var(--site-tag-bg)] disabled:opacity-50"
          >
            同步并改用 CDN URL
          </button>
        </div>
      </section>

      {!state.r2PublicUrl ? (
        <p className="rounded-xl border border-dashed border-[var(--site-border)] px-4 py-3 text-sm text-[var(--site-fg-muted)]">
          在 <code className="font-[family-name:var(--site-font-mono)] text-xs">wrangler.json</code> 配置{' '}
          <code className="font-[family-name:var(--site-font-mono)] text-xs">vars.PHOTOS_PUBLIC_URL</code>。首次请运行{' '}
          <code className="font-[family-name:var(--site-font-mono)] text-xs">npx wrangler login</code> 后执行{' '}
          <code className="font-[family-name:var(--site-font-mono)] text-xs">npm run r2:setup</code>。
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-500">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600">{message}</p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <SeriesSidebar
          seriesList={state.manifest.series}
          selectedId={selectedId}
          busy={busy}
          onSelect={setSelectedId}
          onBusyChange={setBusy}
          onManifestChange={refresh}
          onError={setError}
        />

        <div className="min-w-0 rounded-xl border border-[var(--site-border)] p-4 lg:p-6">
          {selectedSeries ? (
            <SeriesDetail
              series={selectedSeries}
              busy={busy}
              onBusyChange={setBusy}
              onManifestChange={refresh}
              onError={setError}
            />
          ) : (
            <p className="text-sm text-[var(--site-fg-muted)]">先创建一个 series，或从左侧选择。</p>
          )}
        </div>
      </div>
    </article>
  )
}
