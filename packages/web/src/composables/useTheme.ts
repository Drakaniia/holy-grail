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
  root.dataset.theme = nextTheme
  root.classList.toggle('light', nextTheme === 'light')
  root.classList.toggle('dark', nextTheme === 'dark')
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

function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  initializeTheme()

  const isLightMode = computed(() => theme.value === 'light')
  const themeToggleLabel = computed(() => 'Toggle Theme')

  return {
    theme: readonly(theme),
    isLightMode,
    themeToggleLabel,
    setTheme,
    toggleTheme,
  }
}
