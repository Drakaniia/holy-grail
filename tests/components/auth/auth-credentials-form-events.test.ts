// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'login', query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

// Mock stores needed by the merged component
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({ success: vi.fn() }),
}))

vi.mock('@/lib/analytics', () => ({
  trackSignup: vi.fn(),
}))

describe('AuthDialog.vue mode-specific forms', () => {
  let AuthDialog: any
  let wrapper: ReturnType<typeof mount> | null

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    const mod = await import('../src/components/auth/AuthDialog.vue')
    AuthDialog = mod.default
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows signup fields (name, confirm password) when mode is signup', async () => {
    wrapper = mount(AuthDialog, {
      props: {
        mode: 'signup',
        disabled: false,
        error: null,
        loading: false,
        notice: null,
      },
    })
    
    // Clicking "Continue with email" in document.body reveals the input fields
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const continueBtn = buttons.find(b => b.textContent?.includes('Continue with email'))
    expect(continueBtn).toBeTruthy()
    continueBtn!.click()
    
    // Wait for the next tick to let Vue re-render the template
    await nextTick()

    expect(document.body.textContent).toContain('Name')
    expect(document.body.textContent).toContain('Confirm password')
  })

  it('shows forgot password link when mode is login', async () => {
    wrapper = mount(AuthDialog, {
      props: {
        mode: 'login',
        disabled: false,
        error: null,
        loading: false,
        notice: null,
      },
    })

    // Clicking "Continue with email" in document.body reveals the input fields
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const continueBtn = buttons.find(b => b.textContent?.includes('Continue with email'))
    expect(continueBtn).toBeTruthy()
    continueBtn!.click()

    // Wait for the next tick to let Vue re-render the template
    await nextTick()

    expect(document.body.textContent).toContain('Forgot password')
  })

  it('shows "Back to Sign In" in reset mode', () => {
    wrapper = mount(AuthDialog, {
      props: {
        mode: 'reset',
        disabled: false,
        error: null,
        loading: false,
        notice: null,
      },
    })
    expect(document.body.textContent).toContain('Back to Sign In')
  })
})
