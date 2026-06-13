import { useMemo } from 'react'
import { GalleryShell } from '~/features/home/gallery/GalleryShell'
import { HomeControllerContext } from '~/features/home/ctx'
import { HomeController } from '~/features/home/home.controller'

export default function HomePageClient() {
  const controller = useMemo(() => new HomeController(), [])

  return (
    <HomeControllerContext value={controller}>
      <GalleryShell />
    </HomeControllerContext>
  )
}
