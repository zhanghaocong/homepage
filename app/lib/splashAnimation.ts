import gsap from 'gsap'
import { getGalleryMetrics, listAllFrameSpecs, recomputeGalleryMetrics } from '~/lib/galleryLayoutStore'
import { runGalleryWallReveal } from '~/lib/galleryWallReveal'
import type { JsScroll } from '~/lib/jsScroll'
import { beginSplashGather, groupLayoutColumns, initSplashColumn } from '~/lib/splashGatherState'

export type SplashExitHooks = {
  onReveal?: () => void
  onComplete?: () => void
  onLayoutTick?: () => void
}

/** Title motion + splash sheet clip-out → wall reveal (photo-view close handoff). */
export function runSplashClipOutTimeline(onReveal: () => void) {
  const tl = gsap.timeline()
  tl.to('.l-splash .l-splash__title .in span', {
    top: '-14vw',
    duration: 0.5,
    ease: 'power1.in',
    stagger: 0.05,
  })
  tl.to(
    '.l-splash .l-splash__title .out span',
    { top: '0vh', duration: 0.9, ease: 'power3.out', stagger: 0.05 },
    '< 0.2',
  )
  tl.to(
    '.l-splash h1',
    {
      marginTop: '-30vh',
      duration: 2,
      ease: 'power4.inOut',
    },
    '< .2',
  )
  tl.fromTo(
    '.l-splash',
    { clipPath: 'inset(0vw 0vw 0vw 0vw)' },
    { clipPath: 'inset(0vw 0vw 100vh 0vw)', duration: 1.8, ease: 'expo.inOut' },
    '< 0.35',
  )
  tl.call(onReveal, [], '< 0.7')
  return tl
}

/** Full homepage splash clip (crop expand + clip-out) before wall reveal. */
export function runSplashClipTimeline(_root: HTMLElement, onReveal: () => void) {
  const tl = gsap.timeline()
  tl.to('.l-splash .l-splash__title .in span', {
    top: '-14vw',
    duration: 0.5,
    ease: 'power1.in',
    stagger: 0.05,
  })
  tl.to(
    '.l-splash .l-splash__title .out span',
    { top: '0vh', duration: 0.9, ease: 'power3.out', stagger: 0.05 },
    '< 0.2',
  )
  tl.to(
    '.l-splash h1',
    {
      marginTop: '-30vh',
      duration: 2,
      ease: 'power4.inOut',
    },
    '< .2',
  )

  if (window.innerWidth < 680) {
    if (window._w > window._h) {
      tl.to(
        '.l-splash__front-inner',
        {
          width: '130%',
          duration: 1.8,
          ease: 'power2.inOut',
        },
        '<',
      )
    } else {
      tl.to(
        '.l-splash__front-inner',
        {
          height: '120%',
          duration: 1.8,
          ease: 'power2.inOut',
        },
        '<',
      )
    }
    tl.fromTo(
      '.l-splash__front-wrap',
      { clipPath: 'inset(30vh 25vw 30vh 25vw)' },
      { clipPath: 'inset(0vh 0vw 0vh 0vw)', duration: 1.8, ease: 'expo.inOut' },
      '<',
    )
  } else {
    tl.to(
      '.l-splash__front-inner',
      {
        width: '130%',
        duration: 1.8,
        ease: 'power2.inOut',
      },
      '<',
    )
    tl.fromTo(
      '.l-splash__front-wrap',
      { clipPath: 'inset(22vh 38vw 22vh 38vw)' },
      { clipPath: 'inset(0vh 0vw 0vh 0vw)', duration: 1.8, ease: 'expo.inOut' },
      '<',
    )
    tl.to('.l-splash__front', { y: '-10vh', duration: 2, ease: 'expo.inOut' }, '<')
  }

  tl.fromTo(
    '.l-splash',
    { clipPath: 'inset(0vw 0vw 0vw 0vw)' },
    { clipPath: 'inset(0vw 0vw 100vh 0vw)', duration: 1.8, ease: 'expo.inOut' },
    '<',
  )
  tl.call(onReveal, [], '< 0.7')
  return tl
}

/** Show splash DOM with the closing photo, then homepage-style clip + wall reveal. */
export function runPhotoViewSplashExit(root: HTMLElement, scroll: JsScroll, imageUrl: string, hooks?: SplashExitHooks) {
  const html = document.documentElement
  const splashImg = root.querySelector<HTMLImageElement>('.l-splash__front--image img')
  if (splashImg) splashImg.src = imageUrl

  html.classList.remove('l-photo-view', 'l-cate', 'l-photo-view-ui')
  html.classList.add('is-photo-view-exit', 'is-load')

  gsap.set(root.querySelector('.l-splash'), { opacity: 1, visibility: 'visible' })
  gsap.set('.l-splash__title', { opacity: 1 })
  gsap.set('.l-splash__front', { opacity: 1, y: 0 })
  gsap.set('.l-splash__bottom', { opacity: 1 })
  gsap.set('.l-splash', { clipPath: 'inset(0vw 0vw 0vw 0vw)' })
  gsap.set('.l-splash__front-wrap', { clipPath: 'inset(0vh 0vw 0vh 0vw)' })
  gsap.set('canvas', { opacity: 0 })

  scroll.remeasure()
  recomputeGalleryMetrics()

  const revealGallery = () => {
    gsap.fromTo('canvas', { opacity: 0 }, { opacity: 1, duration: 0.85 })
    runGalleryWallReveal(scroll, {
      onReveal: hooks?.onReveal,
      onLayoutTick: hooks?.onLayoutTick,
      onComplete: () => {
        html.classList.remove('is-photo-view-exit', 'is-load')
        hooks?.onComplete?.()
      },
    })
  }

  runSplashClipOutTimeline(revealGallery)
}

export function runHomeSplash(
  root: HTMLElement,
  scroll: JsScroll,
  hooks?: {
    onGatherSet?: () => void
    onReveal?: () => void
    onGatherComplete?: () => void
  },
) {
  const html = document.documentElement
  gsap.set('canvas', { opacity: 0 })
  html.classList.add('is-load', 'is-gather')
  html.classList.remove('is-load__before')

  gsap.to(root.querySelector('.l-splash__title'), { opacity: 1, duration: 0.4 })
  gsap.to(root.querySelector('.l-splash__front'), {
    opacity: 1,
    duration: 0.3,
    delay: 0.1,
  })
  gsap.to(root.querySelector('.l-splash__bottom'), {
    opacity: 1,
    duration: 0.3,
    delay: 0.15,
  })

  if (window.innerWidth < 680) {
    gsap.set('.l-splash__front-wrap', {
      clipPath: 'inset(30vh 25vw 30vh 25vw)',
    })
  }

  window.setTimeout(() => {
    scroll.remeasure()
    recomputeGalleryMetrics()
    beginSplashGather()

    const metrics = getGalleryMetrics()
    const columns = groupLayoutColumns(listAllFrameSpecs())
    for (const column of columns) {
      initSplashColumn(column, metrics)
    }

    hooks?.onGatherSet?.()

    gsap.set('.to', { opacity: 0 })

    const revealGallery = () => {
      gsap.fromTo('canvas', { opacity: 0 }, { opacity: 1, duration: 0.85 })
      runGalleryWallReveal(scroll, {
        onReveal: hooks?.onReveal,
        onComplete: hooks?.onGatherComplete,
      })
    }

    runSplashClipTimeline(root, revealGallery)
  }, 600)

  window.setTimeout(() => {
    html.classList.remove('is-load')
  }, 2250)
}
