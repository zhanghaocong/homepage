import { Link } from 'react-router'
import { seriesList } from '~/data/series'

export function SeriesIndexPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-2 border-b border-[var(--site-border)] pb-8">
        <p className="font-[family-name:var(--site-font-mono)] text-xs tracking-[0.28em] text-[var(--site-fg-muted)] uppercase">
          Series
        </p>
        <h1 className="font-[family-name:var(--site-font-display)] text-4xl font-light tracking-tight text-[var(--site-fg)]">
          系列
        </h1>
        <p className="text-lg text-[var(--site-fg-muted)]">按系列浏览归档，点击后进入长卷对应位置。</p>
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
                  <span className="font-[family-name:var(--site-font-mono)] text-xs text-[var(--site-fg-muted)]">
                    {series.photos.length}
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
