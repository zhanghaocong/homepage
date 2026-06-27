import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router'

import { Header } from '~/shared/components/Header'
import { site } from '~/shared/data/site'
import { themeBootScript } from '~/shared/lib/theme'
import type { Route } from './+types/root'
import './app.css'

export function meta() {
  return [{ title: site.title }, { name: 'description', content: site.description }]
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="is-js" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Meta />
        <Links />
      </head>
      <body className="page">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const location = useLocation()
  const isArchive = location.pathname === '/'
  const isAdmin = location.pathname.startsWith('/admin')

  const mainClassName = isArchive
    ? 'flex min-h-0 flex-1 flex-col'
    : isAdmin
      ? 'mx-auto w-full max-w-6xl flex-1 py-12 pl-[var(--site-sidebar-width)] pr-6'
      : 'mx-auto w-full max-w-3xl flex-1 py-12 pl-[var(--site-sidebar-width)] pr-6'

  return (
    <div className="flex min-h-screen flex-col bg-[var(--site-bg)] font-[family-name:var(--site-font)] text-[var(--site-fg)] antialiased">
      <Header />
      <main className={mainClassName}>
        <Outlet />
      </main>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--site-bg)] font-[family-name:var(--site-font)] text-[var(--site-fg)] antialiased">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 py-12 pl-[var(--site-sidebar-width)] pr-6">
        <div className="space-y-4 text-center">
          <h1 className="font-[family-name:var(--site-font-display)] text-3xl font-light tracking-tight text-[var(--site-fg)]">
            {message}
          </h1>
          <p className="text-[0.9375rem] leading-relaxed text-[var(--site-fg-muted)]">{details}</p>
          <Link
            to="/"
            className="inline-block text-sm font-medium text-[var(--site-fg-muted)] underline underline-offset-4 transition-colors hover:text-[var(--site-fg)]"
          >
            Back to archive
          </Link>
          {stack && (
            <pre className="mt-6 w-full overflow-x-auto rounded-lg border border-[var(--site-border)] p-4 text-left text-sm">
              <code>{stack}</code>
            </pre>
          )}
        </div>
      </main>
    </div>
  )
}
