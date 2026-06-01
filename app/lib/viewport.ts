declare global {
  interface Window {
    _w: number
    _h: number
  }
}

export function syncViewportGlobals() {
  window._w = window.innerWidth
  window._h = window.innerHeight
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

export function initViewport() {
  syncViewportGlobals()
  window.addEventListener('resize', syncViewportGlobals)
  return () => window.removeEventListener('resize', syncViewportGlobals)
}
