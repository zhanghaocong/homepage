import { GalleryShell } from '~/features/wall/components/gallery/GalleryShell'
import { useGalleryRuntime } from '~/features/wall/components/gallery/useGalleryRuntime'

export function WallPage() {
  const runtime = useGalleryRuntime()

  return <GalleryShell runtime={runtime} />
}
