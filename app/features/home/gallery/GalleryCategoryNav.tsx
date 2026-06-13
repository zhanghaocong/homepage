import { CATEGORY_UI, galleryCounts, galleryTotal } from '~/data/gallery'
import { useHomeController, useHomeUi } from '~/features/home/ctx'

export function GalleryCategoryNav() {
  const controller = useHomeController()
  const { currentCategory } = useHomeUi()

  return (
    <div className="p-home__fixed to">
      <div className="p-home__category to">
        <div className="p-home__category--title">
          {CATEGORY_UI.map(({ id, label }) => (
            <a
              key={id}
              href={`/${id}`}
              className={`p-home__category--item ${id === currentCategory ? 'active' : ''}`}
              data-category={id}
              onClick={(event) => {
                event.preventDefault()
                controller.jumpToCategory(id)
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
