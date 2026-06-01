import { Link } from 'react-router'
import type { PhotoCollectionKind, PhotoCollectionSummary, PhotoListModel } from '~/data/photoCollections'

function labelForKind(kind: PhotoCollectionKind) {
  return kind === 'album' ? 'Album' : 'Tag'
}

export function PhotoList({ list }: { list: PhotoListModel }) {
  return (
    <div className="space-y-10">
      <header className="site-page-header space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.28em] text-[var(--site-fg-muted)] uppercase">
            {labelForKind(list.kind)}
          </p>
          <h1 className="site-page-title">{list.title}</h1>
          <p className="site-page-lead">{list.description}</p>
        </div>
        <p className="site-prose">
          {list.count} {list.count === 1 ? 'photo' : 'photos'}
        </p>
      </header>

      <CollectionSwitch currentId={list.id} items={list.collections} />

      <ul className="grid gap-4 sm:grid-cols-2">
        {list.photos.map((photo) => (
          <li key={photo.id} className="group">
            <a
              href={photo.largeSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-tag-bg)]"
            >
              <img
                src={photo.src}
                alt={`${photo.albumTitle} photo`}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </a>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to={`/albums/${photo.albumId}`} className="site-tag">
                {photo.albumTitle}
              </Link>
              {photo.tags.map((tag) => (
                <Link key={tag} to={`/tags/${tag}`} className="site-tag">
                  #{tag}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PhotoListMissing({
  kind,
  value,
  suggestions,
}: {
  kind: PhotoCollectionKind
  value: string
  suggestions: PhotoCollectionSummary[]
}) {
  return (
    <div className="space-y-8">
      <header className="site-page-header space-y-2">
        <h1 className="site-page-title">Nothing here yet</h1>
        <p className="site-page-lead">
          No {kind} named <span className="font-mono">{value}</span> exists in the current photo archive.
        </p>
      </header>
      <CollectionSwitch items={suggestions} />
    </div>
  )
}

function CollectionSwitch({ currentId, items }: { currentId?: string; items: PhotoCollectionSummary[] }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Photo collections">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className={`site-tag transition ${item.id === currentId ? 'text-[var(--site-fg)]' : ''}`}
        >
          {item.title}
          <span className="ml-1 text-[var(--site-fg-muted)]">({item.count})</span>
        </Link>
      ))}
    </nav>
  )
}
