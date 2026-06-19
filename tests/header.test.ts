// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Navbar from '../src/components/Navbar.vue'

// Mock vue-router hooks and components
const mockRoute = {
  name: 'site-detail',
  params: { slug: 'vercel' },
}
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

// Mock sites store
vi.mock('@/stores/sites', () => ({
  useSitesStore: () => ({
    getSiteBySlug: (slug: string) => {
      if (slug === 'vercel') {
        return {
          slug: 'vercel',
          name: 'Vercel',
          parentCategory: 'development',
          subcategory: 'cloud-hosting',
          website: 'https://vercel.com',
        }
      }
      return null
    },
    loadSites: vi.fn(),
  }),
}))

describe('Header Title and Document Title Behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockRoute.name = 'site-detail'
    mockRoute.params.slug = 'vercel'
    document.title = 'Holy Grail'
  })

  it('displays the site title in the navbar brand header link instead of Holy Grail on site-detail page', () => {
    const wrapper = mount(Navbar)
    const brandSpan = wrapper.find('.truncate')
    expect(brandSpan.exists()).toBe(true)
    expect(brandSpan.text()).toBe('Vercel')
  })

  it('displays Holy Grail in the navbar brand header link when not on site-detail page', () => {
    mockRoute.name = 'home'
    mockRoute.params.slug = ''
    const wrapper = mount(Navbar)
    const brandSpan = wrapper.find('.truncate')
    expect(brandSpan.exists()).toBe(true)
    expect(brandSpan.text()).toBe('Holy Grail')
  })
})

describe('SiteDetail Document Title Behavior', () => {
  let SiteDetailComponent: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockRoute.name = 'site-detail'
    mockRoute.params.slug = 'vercel'
    document.title = 'Holy Grail'
    
    // Import dynamically to avoid mock issues
    const module = await import('../src/pages/SiteDetail.vue')
    SiteDetailComponent = module.default
  })

  it('updates document.title to include the site name when mounted', async () => {
    mount(SiteDetailComponent)
    expect(document.title).toBe('Vercel | Holy Grail')
  })
})

