// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const mockRoute = { name: 'login', query: {}, params: {}, fullPath: '/login', path: '/login', matched: [], meta: {} }
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockPush, replace: vi.fn(), afterEach: vi.fn() }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
  RouterView: {
    template: '<div class="router-view-stub"><slot /></div>',
  },
}))

// Mock the stores that App.vue depends on
vi.mock('@/stores/sites', () => ({
  useSitesStore: () => ({ loadSites: vi.fn(), getSitesByParentCategory: () => [] }),
}))

vi.mock('@/stores/skills', () => ({
  useSkillsStore: () => ({ getSkillsByParentCategory: () => [] }),
}))

vi.mock('@/stores/extensions', () => ({
  useExtensionsStore: () => ({ getExtensionsByParentCategory: () => [] }),
}))

vi.mock('@/composables/useDeferredAuthStatus', () => ({
  useDeferredAuthStatus: () => ({ isAuthenticated: false }),
}))

// Mock lazy-loaded sidebar and command palette
vi.mock('../src/components/Sidebar.vue', () => ({
  default: { template: '<div class="sidebar-stub" />' },
}))

vi.mock('../src/components/search/CommandPalette.vue', () => ({
  default: { template: '<div class="command-palette-stub" />' },
}))

describe('App.vue auth dialog integration', () => {
  let App: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.title = 'Holy Grail'
    mockRoute.name = 'login'
    mockRoute.path = '/login'
    mockRoute.fullPath = '/login'
    mockRoute.matched = [{ path: '/login' }]
    const mod = await import('../src/App.vue')
    App = mod.default
  })

  it('renders the app shell (with sidebar and navbar) on /login route', () => {
    const wrapper = mount(App, { shallow: true })
    expect(wrapper.find('.sidebar-stub').exists()).toBe(true)
  })

  it('does not render the app shell on /auth/callback route', () => {
    mockRoute.name = 'auth-callback'
    mockRoute.path = '/auth/callback'
    mockRoute.fullPath = '/auth/callback'
    const wrapper = mount(App, { shallow: true })
    expect(wrapper.find('.sidebar-stub').exists()).toBe(false)
  })

  it('renders AuthDialogRoot when on login or signup route', () => {
    const wrapper = mount(App, { shallow: true })
    expect(wrapper.findComponent({ name: 'AuthDialogRoot' }).exists()).toBe(true)
  })
})
