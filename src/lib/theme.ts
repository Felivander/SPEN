import type { Theme } from '../types'

/** Matches the two `theme-color` metas declared in index.html. */
const BAR_COLOR: Record<'light' | 'dark', string> = {
  light: '#EDEBE6',
  dark: '#151513',
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Applies the appearance. `data-theme` drives the CSS token aliases; the
 * `theme-color` meta keeps the iOS status bar and browser chrome in step,
 * which the media-query metas alone can't do once the user pins a choice.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement

  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme

  const resolved = resolveTheme(theme)

  // Drop the media-scoped metas so a single unconditional one wins.
  document
    .querySelectorAll('meta[name="theme-color"][media]')
    .forEach((el) => el.remove())

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = BAR_COLOR[resolved]
}

/** Re-applies on OS changes, but only while the user is on `system`. */
export function watchSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
