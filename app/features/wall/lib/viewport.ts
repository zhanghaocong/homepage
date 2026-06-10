export type ViewportSize = {
  w: number
  h: number
}

/** SSR / module-init fallback before `initViewport` runs. */
export const VIEWPORT_SSR_DEFAULT: ViewportSize = { w: 1440, h: 900 }

let viewport: ViewportSize = VIEWPORT_SSR_DEFAULT
const listeners = new Set<() => void>()

export function getViewportSize(): ViewportSize {
  return viewport
}

export function subscribeViewport(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyViewportListeners() {
  for (const listener of listeners) listener()
}

export function syncViewport() {
  if (typeof window === 'undefined') return
  viewport = { w: window.innerWidth, h: window.innerHeight }
  document.documentElement.style.setProperty('--vh', `${viewport.h * 0.01}px`)
  notifyViewportListeners()
}

/** @deprecated Use `syncViewport` — kept for callers that still use the old name. */
export function syncViewportGlobals() {
  syncViewport()
}

export function initViewport() {
  syncViewport()
  window.addEventListener('resize', syncViewport)
  return () => window.removeEventListener('resize', syncViewport)
}
