import { CATEGORY_UI, galleryCounts, galleryTotal } from '~/data/gallery'

type GalleryCategoryNavProps = {
  onCategorySelect: (category: string) => void
}

export function GalleryCategoryNav({ onCategorySelect }: GalleryCategoryNavProps) {
  return (
    <div className="p-home__fixed to">
      <div className="p-home__category to">
        <div className="p-home__category--title">
          {CATEGORY_UI.map(({ id, label }) => (
            <a
              key={id}
              href={`/${id}`}
              className={`p-home__category--item ${id === 'interior' ? 'active' : ''}`}
              data-category={id}
              onClick={(event) => {
                event.preventDefault()
                onCategorySelect(id)
              }}
            >
              <h2 className="fs-xl">{label}</h2>
              <p className="--n fs-s">( {galleryCounts[id]} )</p>
            </a>
          ))}
        </div>
        <p className="p-home__category--all fs-s">
          <span className="o">
            <span className="t"> /{galleryTotal}Photos </span>
          </span>
        </p>
      </div>
    </div>
  )
}
