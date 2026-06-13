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
      <div className="l-header__inner flex h-12 items-center justify-between px-5">
        <h1 className="m-0 text-sm font-medium tracking-[-0.01em] leading-none">
          <Link to="/" aria-label="Home" className="text-[var(--site-fg)] no-underline hover:opacity-70">
            {site.name}
          </Link>
        </h1>
        <nav className="flex items-center gap-4">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
