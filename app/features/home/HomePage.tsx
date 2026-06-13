import { useMemo } from 'react'
import { GalleryShell } from '~/features/home/components/gallery/GalleryShell'
import { HomeControllerContext } from '~/features/home/ctx'
import { HomeController } from '~/features/home/home.controller'

export function HomePage() {
  const controller = useMemo(() => new HomeController(), [])

  return (
    <HomeControllerContext value={controller}>
      <GalleryShell />
    </HomeControllerContext>
  )
}
