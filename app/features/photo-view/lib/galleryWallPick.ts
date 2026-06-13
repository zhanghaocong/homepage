import { isFrameVisible } from '~/features/home/lib/galleryLayout'
import { getFrameScreenRect, listAllFrameSpecs } from '~/features/home/lib/galleryLayoutStore'

function pointInRect(x: number, y: number, rect: { left: number; top: number; width: number; height: number }) {
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height
}

/** Pick the topmost (smallest) visible wall frame at viewport coordinates. */
export function pickWallLayoutIdAt(clientX: number, clientY: number): string | null {
  let best: { id: string; area: number } | null = null

  for (const spec of listAllFrameSpecs()) {
    const screen = getFrameScreenRect(spec.id)
    if (!screen || !isFrameVisible(screen)) continue
    if (!pointInRect(clientX, clientY, screen)) continue
    const area = screen.width * screen.height
    if (!best || area < best.area) {
      best = { id: spec.id, area }
    }
  }

  return best?.id ?? null
}
