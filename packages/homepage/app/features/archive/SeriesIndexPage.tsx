import { Link } from 'react-router'
import { seriesList } from '~/data/series'

export function SeriesIndexPage() {
  const totalPhotos = seriesList.reduce((sum, series) => sum + series.photos.length, 0)

  return (
    <article className="space-y-10">
      <div
        className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        role="status"
      >
        Cloud Agent 预览验证 — 若你看到这条绿色提示，说明端口转发 + HMR 已生效。
      </div>

      <header className="space-y-2 border-b border-[var(--site-border)] pb-8">
        <p className="font-[family-name:var(--site-font-mono)] text-xs tracking-[0.28em] text-[var(--site-fg-muted)] uppercase">
          Series · Live Preview
        </p>
        <h1 className="font-[family-name:var(--site-font-display)] text-4xl font-light tracking-tight text-[var(--site-fg)]">
          系列索引
        </h1>
        <p className="text-lg text-[var(--site-fg-muted)]">
          共 {seriesList.length} 个系列、{totalPhotos} 张照片。点击卡片进入长卷对应位置。
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {seriesList.map((series) => {
          const cover = series.photos[0]
          if (!cover) return null

          return (
            <li key={series.id}>
              <Link
                to={`/?series=${series.id}#series-${series.id}`}
                className="group block overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-tag-bg)]"
              >
                <img
                  src={cover.thumbSrc ?? cover.previewSrc ?? cover.src}
                  alt=""
                  width={cover.width}
                  height={cover.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium text-[var(--site-fg)]">{series.title}</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-[family-name:var(--site-font-mono)] text-xs text-emerald-700 dark:text-emerald-300">
                    {series.photos.length} 张
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
