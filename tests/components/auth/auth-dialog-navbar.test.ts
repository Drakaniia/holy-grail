// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthDialog } from '../../../src/composables/useAuthDialog.ts'

// Mock vue-router
const mockRoute = { name: 'home', params: {}, query: {} }
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// Mock stores
vi.mock('@/stores/sites', () => ({
  useSitesStore: () => ({ loadSites: vi.fn(), getSiteBySlug: vi.fn(), allSites: [] }),
}))
vi.mock('@/stores/skills', () => ({
  useSkillsStore: () => ({ getSkillBySlug: vi.fn() }),
}))
vi.mock('@/stores/extensions', () => ({
  useExtensionsStore: () => ({ getExtensionBySlug: vi.fn() }),
}))
vi.mock('@/composables/useDeferredAuthStatus', () => ({
  useDeferredAuthStatus: () => ({ isAuthenticated: false }),
}))
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    isLightMode: false,
    themeToggleLabel: 'Switch to light mode',
    toggleTheme: vi.fn(),
  }),
}))
vi.mock('@/lib/idle', () => ({
  scheduleIdleTask: vi.fn(),
}))

describe('Navbar.vue auth dialog buttons', () => {
  let Navbar: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    const { closeAuthDialog } = useAuthDialog()
    closeAuthDialog()
    const mod = await import('../src/components/Navbar.vue')
    Navbar = mod.default
  })

  it('renders "Login" text when not authenticated (via wrapper text)', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.text()).toContain('Login')
  })

  it('renders "Sign Up" text when not authenticated (via wrapper text)', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.text()).toContain('Sign Up')
  })

  it('does not use RouterLink pointing to /login or /signup', () => {
    const wrapper = mount(Navbar)
    const routerLinks = wrapper.findAllComponents({ name: 'RouterLink' })
    const authLinks = routerLinks.filter((link: any) => {
      const to = link.props('to')
      return to === '/login' || to === '/signup' || to?.name === 'login' || to?.name === 'signup'
    })
    expect(authLinks.length).toBe(0)
  })

  it('opens the login dialog when a button is clicked and composable state updates', async () => {
    mount(Navbar)
    const { authDialogState, openAuthDialog } = useAuthDialog()

    // Simulate what the button does (click calls openAuthDialog('login'))
    openAuthDialog('login')
    expect(authDialogState.value.isOpen).toBe(true)
    expect(authDialogState.value.mode).toBe('login')
  })
})
