// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { installPageTitleGuard } from '../src/composables/usePageTitle'

// Minimal placeholder component for testing
const Placeholder = { template: '<div />' }

function buildRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Placeholder },
      { path: '/sites', name: 'sites-home', component: Placeholder },
      { path: '/sites/ai', name: 'sites-ai', component: Placeholder },
      { path: '/sites/ai/detector', name: 'sites-ai-detector', component: Placeholder },
      { path: '/sites/design', name: 'sites-design', component: Placeholder },
      { path: '/sites/design/inspiration', name: 'sites-design-inspiration', component: Placeholder },
      { path: '/sites/design/prompts', name: 'sites-design-prompts', component: Placeholder },
      { path: '/sites/development', name: 'sites-development', component: Placeholder },
      { path: '/sites/development/cloud-hosting', name: 'sites-development-cloud', component: Placeholder },
      { path: '/sites/watch', name: 'sites-watch', component: Placeholder },
      { path: '/sites/watch/movies', name: 'sites-watch-movies', component: Placeholder },
      { path: '/sites/downloads', name: 'sites-downloads', component: Placeholder },
      { path: '/skills/skills', name: 'skills-category', component: Placeholder },
      { path: '/skills/design', name: 'skills-design', component: Placeholder },
      { path: '/extensions/writing', name: 'extensions-writing', component: Placeholder },
      { path: '/extensions/developer-tools', name: 'extensions-dev-tools', component: Placeholder },
      { path: '/publish', name: 'publish', component: Placeholder },
      { path: '/login', name: 'login', component: Placeholder },
      { path: '/signup', name: 'signup', component: Placeholder },
      { path: '/account', name: 'account', component: Placeholder },
      { path: '/bookmarks', name: 'bookmarks', component: Placeholder },
      { path: '/changelog', name: 'changelog', component: Placeholder },
      { path: '/docs', name: 'docs', component: Placeholder },
    ],
  })
  installPageTitleGuard(router)
  return router
}

describe('Page Title Navigation (router-driven)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.title = 'Holy Grail'
  })

  afterEach(() => {
    document.title = 'Holy Grail'
  })

  async function navigateTo(router: ReturnType<typeof buildRouter>, path: string) {
    await router.push(path)
    await router.isReady()
  }

  it('sets "Holy Grail" on the home route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/')
    expect(document.title).toBe('Holy Grail')
  })

  it('sets "Sites | Holy Grail" on the sites home route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites')
    expect(document.title).toBe('Sites | Holy Grail')
  })

  it('sets "AI | Holy Grail" on the sites/ai route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/ai')
    expect(document.title).toBe('AI | Holy Grail')
  })

  it('sets "AI • Detector | Holy Grail" on the sites/ai/detector route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/ai/detector')
    expect(document.title).toBe('AI • Detector | Holy Grail')
  })

  it('sets "Design | Holy Grail" on the sites/design route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/design')
    expect(document.title).toBe('Design | Holy Grail')
  })

  it('sets "Design • Inspiration | Holy Grail" on the sites/design/inspiration route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/design/inspiration')
    expect(document.title).toBe('Design • Inspiration | Holy Grail')
  })

  it('sets "Design • Prompts | Holy Grail" on the sites/design/prompts route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/design/prompts')
    expect(document.title).toBe('Design • Prompts | Holy Grail')
  })

  it('sets "Development | Holy Grail" on the sites/development route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/development')
    expect(document.title).toBe('Development | Holy Grail')
  })

  it('sets "Development • Cloud & Hosting | Holy Grail" on the sites/development/cloud-hosting route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/development/cloud-hosting')
    expect(document.title).toBe('Development • Cloud & Hosting | Holy Grail')
  })

  it('sets "Watch | Holy Grail" on the sites/watch route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/watch')
    expect(document.title).toBe('Watch | Holy Grail')
  })

  it('sets "Watch • Movies | Holy Grail" on the sites/watch/movies route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/watch/movies')
    expect(document.title).toBe('Watch • Movies | Holy Grail')
  })

  it('sets "Downloads | Holy Grail" on the sites/downloads route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/sites/downloads')
    expect(document.title).toBe('Downloads | Holy Grail')
  })

  it('sets "Skills | Holy Grail" on the skills/skills route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/skills/skills')
    expect(document.title).toBe('Skills | Holy Grail')
  })

  it('sets "Skills • Design | Holy Grail" on the skills/design route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/skills/design')
    expect(document.title).toBe('Skills • Design | Holy Grail')
  })

  it('sets "Extensions • Writing | Holy Grail" on the extensions/writing route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/extensions/writing')
    expect(document.title).toBe('Extensions • Writing | Holy Grail')
  })

  it('sets "Extensions • Developer Tools | Holy Grail" on the extensions/developer-tools route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/extensions/developer-tools')
    expect(document.title).toBe('Extensions • Developer Tools | Holy Grail')
  })

  it('sets "Publish | Holy Grail" on the publish route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/publish')
    expect(document.title).toBe('Publish | Holy Grail')
  })

  it('sets "Sign In | Holy Grail" on the login route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/login')
    expect(document.title).toBe('Sign In | Holy Grail')
  })

  it('sets "Sign Up | Holy Grail" on the signup route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/signup')
    expect(document.title).toBe('Sign Up | Holy Grail')
  })

  it('sets "Account | Holy Grail" on the account route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/account')
    expect(document.title).toBe('Account | Holy Grail')
  })

  it('sets "Bookmarks | Holy Grail" on the bookmarks route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/bookmarks')
    expect(document.title).toBe('Bookmarks | Holy Grail')
  })

  it('sets "Changelog | Holy Grail" on the changelog route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/changelog')
    expect(document.title).toBe('Changelog | Holy Grail')
  })

  it('sets "Documentation | Holy Grail" on the docs route', async () => {
    const router = buildRouter()
    await navigateTo(router, '/docs')
    expect(document.title).toBe('Documentation | Holy Grail')
  })
})
