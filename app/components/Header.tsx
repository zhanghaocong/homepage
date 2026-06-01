import { useAtomValue } from 'jotai/react'
import { Link, NavLink } from 'react-router'
import { ThemeToggle } from '~/components/ThemeToggle'
import { site } from '~/data/site'
import { closePhotoView } from '~/lib/photoViewController'
import { photoViewAtom, photoViewStore } from '~/lib/photoViewStore'

export function Header() {
  const photoViewOpen = useAtomValue(photoViewAtom, { store: photoViewStore }).open

  return (
    <header className="l-header site-header">
      <div className="l-header__inner site-header__inner">
        <h1 className="site-header__logo">
          <Link to="/" aria-label="Home">
            {site.name}
          </Link>
        </h1>
        <nav className="site-header__nav">
          {photoViewOpen ? (
            <button
              type="button"
              className="site-header__link site-header__link--close"
              onClick={() => closePhotoView()}
            >
              Close
            </button>
          ) : (
            <>
              <NavLink to="/" end className="site-header__link">
                Wall
              </NavLink>
              <NavLink to="/about" className="site-header__link">
                About
              </NavLink>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
