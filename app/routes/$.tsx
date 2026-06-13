import { Link } from 'react-router'

export function meta() {
  return [{ title: '404 — Page not found' }]
}

export default function NotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--site-fg)]">404</h1>
      <p className="text-[0.9375rem] leading-relaxed text-[var(--site-fg-muted)]">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="inline-block text-sm font-medium text-[var(--site-fg-muted)] underline underline-offset-4 transition-colors hover:text-[var(--site-fg)]"
      >
        Back to home
      </Link>
    </div>
  )
}
