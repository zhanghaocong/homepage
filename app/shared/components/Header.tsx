import { Link, NavLink } from 'react-router'
import { ThemeToggle } from '~/shared/components/ThemeToggle'
import { site } from '~/shared/data/site'

export function Header() {
  return (
    <header className="l-header site-header">
      <div className="l-header__inner site-header__inner">
        <h1 className="site-header__logo">
          <Link to="/" aria-label="Home">
            {site.name}
          </Link>
        </h1>
        <nav className="site-header__nav">
          <NavLink to="/" end className="site-header__link">
            Wall
          </NavLink>
          <NavLink to="/about" className="site-header__link">
            About
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
