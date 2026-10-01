import { computed, readonly, shallowRef } from 'vue'

export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'holy-grail-theme'
const theme = shallowRef<ThemeMode>('dark')
let initialized = false

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
  } catch {
    return 'dark'
  }
}

function persistTheme(nextTheme: ThemeMode) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  } catch {}
}

function applyTheme(nextTheme: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('light', nextTheme === 'light')
  root.style.colorScheme = nextTheme
}

export function initializeTheme() {
  if (initialized) {
    return
  }

  theme.value = getStoredTheme()
  applyTheme(theme.value)
  initialized = true
}

function setTheme(nextTheme: ThemeMode) {
  theme.value = nextTheme
  applyTheme(nextTheme)
  persistTheme(nextTheme)
}

export function useTheme() {
  initializeTheme()

  return {
    theme: readonly(theme),
    isLightMode: computed(() => theme.value === 'light'),
    setTheme,
  }
}
