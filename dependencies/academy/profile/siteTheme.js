export const DEFAULT_SITE_THEME = 'soft-white'
export const SITE_THEME_STORAGE_KEY = 'polaris-site-theme'

export const SITE_THEMES = [
  {
    value: 'soft-white',
    label: 'Soft white',
    description: 'Warm, quiet ivory',
    swatch: '#f4f1e9',
  },
  {
    value: 'pale-blue',
    label: 'Pale blue',
    description: 'Cool, airy blue',
    swatch: '#dcebf1',
  },
]

export function normalizeSiteTheme(value) {
  return SITE_THEMES.some((theme) => theme.value === value) ? value : DEFAULT_SITE_THEME
}

export function readStoredSiteTheme() {
  try {
    return normalizeSiteTheme(localStorage.getItem(SITE_THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_SITE_THEME
  }
}

export function storeSiteTheme(value) {
  const theme = normalizeSiteTheme(value)
  document.documentElement.dataset.polarisTheme = theme
  try {
    localStorage.setItem(SITE_THEME_STORAGE_KEY, theme)
  } catch {
    // The DOM theme still applies when storage is unavailable.
  }
  return theme
}
