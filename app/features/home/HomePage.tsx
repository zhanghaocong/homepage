import { lazy, Suspense } from 'react'
import { HomePageFallback } from '~/features/home/HomePageFallback'
import { ClientOnly } from '~/shared/components/ClientOnly'
import '~/features/home/home.css'

const HomePageClient = lazy(() => import('~/features/home/HomePage.client', { ssr: false }))

export function HomePage() {
  return (
    <ClientOnly fallback={<HomePageFallback />}>
      <Suspense fallback={<HomePageFallback />}>
        <HomePageClient />
      </Suspense>
    </ClientOnly>
  )
}
