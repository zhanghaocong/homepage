export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'site-theme'
export const THEME_CHANGE_EVENT = 'site-theme-change'

export function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const raw = localStorage.getItem(THEME_STORAGE_KEY)
  if (raw === 'light' || raw === 'dark') return raw
  return 'system'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  // theme-* avoids photoyoshi .l-light/.l-dark (grid/full view) background rules
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light')
  root.style.colorScheme = resolved
  root.dataset.theme = resolved
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: resolved }))
}

export function setThemePreference(preference: ThemePreference) {
  if (preference === 'system') {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  }
  applyResolvedTheme(resolveTheme(preference))
}

export function getResolvedTheme(): ResolvedTheme {
  if (typeof document !== 'undefined') {
    const fromDom = document.documentElement.dataset.theme
    if (fromDom === 'light' || fromDom === 'dark') return fromDom
  }
  return resolveTheme(getStoredPreference())
}

/** Toggle between light and dark; icon reflects the active theme. */
export function toggleTheme(): ResolvedTheme {
  const next = getResolvedTheme() === 'light' ? 'dark' : 'light'
  setThemePreference(next)
  return next
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null

export function initTheme() {
  const preference = getStoredPreference()
  applyResolvedTheme(resolveTheme(preference))

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  if (systemListener) mq.removeEventListener('change', systemListener)
  systemListener = () => {
    if (getStoredPreference() === 'system') {
      applyResolvedTheme(resolveTheme('system'))
    }
  }
  mq.addEventListener('change', systemListener)
}

/** Inline in `<head>` to avoid theme flash before hydration. */
export const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.add(d?"theme-dark":"theme-light");r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("theme-light");}})();`
