import { Link, NavLink } from 'react-router'
import { ThemeToggle } from '~/shared/components/ThemeToggle'
import { site } from '~/shared/data/site'

const navLinkClass =
  'text-sm font-normal leading-none text-[var(--site-fg-muted)] no-underline transition-colors duration-150 hover:text-[var(--site-fg)]'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${navLinkClass} text-[var(--site-fg)]` : navLinkClass
}

export function Header() {
  return (
    <header className="l-header bg-transparent">
      <div className="l-header__inner">
        <h1 className="m-0 text-sm font-medium tracking-[-0.01em] leading-none">
          <Link to="/" aria-label="Archive" className="text-[var(--site-fg)] no-underline hover:opacity-70">
            {site.name}
          </Link>
        </h1>
        <nav className="l-header__nav">
          <NavLink to="/series" className={navClass}>
            Series
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
        </nav>
        <div className="l-header__footer space-y-4">
          <ThemeToggle />
          <p className="m-0 text-[10px] leading-snug text-[var(--site-fg-muted)]">
            &copy; {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </header>
  )
}
