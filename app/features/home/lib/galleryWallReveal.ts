import gsap from 'gsap'
import { getGalleryMetrics, listAllFrameSpecs, recomputeGalleryMetrics } from '~/features/home/lib/galleryLayoutStore'
import { applyGalleryGsapTarget, galleryGsapTarget } from '~/features/home/lib/galleryStore'
import type { PatchHomeShell } from '~/features/home/lib/splashAnimation'
import type { JsScroll } from '~/features/home/lib/jsScroll'
import { getViewportSize } from '~/features/home/lib/viewport'
import {
  beginSplashGather,
  endSplashGather,
  getSplashFrameTween,
  groupLayoutColumns,
  initSplashColumn,
  splashFinalFrameSize,
} from '~/features/home/lib/splashGatherState'

function killSplashTweens(columns: ReturnType<typeof groupLayoutColumns>) {
  for (const column of columns) {
    for (const spec of column) {
      const tween = getSplashFrameTween(spec.id)
      if (tween) gsap.killTweensOf(tween)
    }
  }
}

export type GalleryWallRevealHooks = {
  onReveal?: () => void
  onComplete?: () => void
  /** Called each frame while splash tweens run (layout → mesh sync). */
  onLayoutTick?: () => void
  patchShell?: PatchHomeShell
}

/**
 * Replay homepage gallery gather + reveal (no splash DOM).
 * Call after `beginSplashGather()` + `initSplashColumn()` and wall meshes are visible.
 */
export function runGalleryWallReveal(scroll: JsScroll, hooks?: GalleryWallRevealHooks) {
  recomputeGalleryMetrics()
  beginSplashGather()
  hooks?.patchShell?.({ shell: { gather: true } })

  const metrics = getGalleryMetrics()
  const columns = groupLayoutColumns(listAllFrameSpecs())

  for (const column of columns) {
    initSplashColumn(column, metrics)
  }

  hooks?.onReveal?.()
  hooks?.onLayoutTick?.()

  killSplashTweens(columns)

  const distance = window.innerWidth < 680 ? 4.48 : 2.125
  const revealTarget = getViewportSize().h * distance
  const start = scroll.delta1
  if (start < revealTarget) {
    const remaining = revealTarget - start
    const duration = Math.max(0.9, 2.5 * (remaining / revealTarget))
    scroll.onScrollTo(revealTarget, duration, 0, 'power4.out')
  }

  const layoutTick = () => hooks?.onLayoutTick?.()
  gsap.ticker.add(layoutTick)

  const gatherEndDelay = 0.7 + 1.35 + 0.2
  gsap.delayedCall(gatherEndDelay, () => {
    gsap.ticker.remove(layoutTick)
    hooks?.patchShell?.({ shell: { gather: false } })
    endSplashGather()
    hooks?.onComplete?.()
  })

  const { centerRow } = metrics

  for (const column of columns) {
    const center = column.find((s) => s.row === centerRow)
    if (center) {
      const tween = getSplashFrameTween(center.id)
      const final = splashFinalFrameSize(center, metrics)
      if (tween) {
        gsap.to(tween, {
          width: final.width,
          duration: 1.8,
          ease: 'power4.out',
          delay: 0.35,
        })
        gsap.to(tween, {
          height: final.height,
          duration: 1.4,
          ease: 'power4.out',
        })
      }
    }

    for (const spec of column) {
      if (spec.row === centerRow) continue
      const tween = getSplashFrameTween(spec.id)
      if (!tween) continue
      const dist = Math.abs(spec.row - centerRow)
      const delay = dist === 1 ? 0.38 : 0.7
      gsap.to(tween, { x: 0, duration: 1.35, ease: 'expo.out', delay })
    }
  }

  gsap.fromTo('.to', { opacity: 0 }, { opacity: 1, duration: 0.45, delay: 1.2 })
  gsap.timeline().fromTo(
    galleryGsapTarget,
    {
      modeChangePow: 1,
      duration: 1,
      ease: 'power1.out',
      onUpdate: applyGalleryGsapTarget,
    },
    {
      modeChangePow: 0,
      duration: 1.2,
      ease: 'power1.out',
      onUpdate: applyGalleryGsapTarget,
    },
  )
}
