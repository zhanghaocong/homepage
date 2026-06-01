import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router'

import { Footer } from '~/components/Footer'
import { Header } from '~/components/Header'
import { site } from '~/data/site'
import { themeBootScript } from '~/lib/theme'
import type { Route } from './+types/root'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'stylesheet', href: 'https://use.typekit.net/oqy1tlz.css' },
  { rel: 'stylesheet', href: 'https://photoyoshi.com/assets/css/style.css' },
]

export function meta() {
  return [{ title: site.title }, { name: 'description', content: site.description }]
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="is-js is-load__before" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Meta />
        <Links />
      </head>
      <body className="page" data-xhr="wrapper">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPhotoListRoute = location.pathname.startsWith('/albums/') || location.pathname.startsWith('/tags/')

  if (isHome) {
    return (
      <>
        <Header />
        <Outlet />
      </>
    )
  }

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Header />
      <main className={`mx-auto w-full flex-1 px-6 py-12 ${isPhotoListRoute ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <Outlet />
      </main>
      <Footer />
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
    <div className="site-shell flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="space-y-4 text-center">
          <h1 className="site-page-title text-3xl">{message}</h1>
          <p className="site-prose">{details}</p>
          <Link to="/" className="site-header__link inline-block text-sm font-medium underline underline-offset-4">
            Back to home
          </Link>
          {stack && (
            <pre className="site-card mt-6 w-full overflow-x-auto p-4 text-left text-sm">
              <code>{stack}</code>
            </pre>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
