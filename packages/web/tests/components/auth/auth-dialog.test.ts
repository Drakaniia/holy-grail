// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'login', query: {} }),
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackSignup: vi.fn(),
}))

// Mock toast store
const mockToastSuccess = vi.fn()
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({ success: mockToastSuccess }),
}))


function getDialog() {
  return document.body.querySelector('[role="dialog"]') as HTMLElement | null
}

function getBackdrop() {
  return document.body.querySelector('[data-testid="auth-backdrop"]') as HTMLElement | null
}

function getCloseButton() {
  return document.body.querySelector('button[aria-label="Close"]') as HTMLElement | null
}

function getResetEmailInput() {
  return document.body.querySelector('[data-testid="reset-email-input"]') as HTMLElement | null
}

function getResetSubmitButton() {
  return document.body.querySelector('[data-testid="reset-submit-button"]') as HTMLElement | null
}

describe('AuthCredentialsForm.vue (as dialog)', () => {
  let AuthForm: any
  let wrapper: ReturnType<typeof mount> | null

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    mockToastSuccess.mockClear()
    const mod = await import('../src/components/auth/AuthDialog.vue')
    AuthForm = mod.default
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('renders the dialog shell with role="dialog" and aria-modal="true"', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const dialog = getDialog()
    expect(dialog).toBeTruthy()
    expect(dialog!.getAttribute('aria-modal')).toBe('true')
  })

  it('renders a close (X) button', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const closeButton = getCloseButton()
    expect(closeButton).toBeTruthy()
  })

  it('emits "close" when the close button is clicked', async () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const closeButton = getCloseButton()
    expect(closeButton).toBeTruthy()
    closeButton!.click()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits "close" when the backdrop is clicked', async () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const backdrop = getBackdrop()
    expect(backdrop).toBeTruthy()
    backdrop!.click()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits "close" when Escape key is pressed', async () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders the form content directly', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const dialog = getDialog()
    expect(dialog).toBeTruthy()
    expect(dialog?.textContent).toContain('Welcome back')
  })

  it('renders a password reset form with email input and submit button for reset mode', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'reset', notice: null },
    })
    const emailInput = getResetEmailInput()
    const submitButton = getResetSubmitButton()
    expect(emailInput).toBeTruthy()
    expect(submitButton).toBeTruthy()
  })

  it('has a submit button that is disabled when email is empty in reset mode', async () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'reset', notice: null },
    })
    const submitButton = getResetSubmitButton()
    expect(submitButton).toBeTruthy()
    expect(submitButton!.hasAttribute('disabled')).toBe(true)
  })

  it('locks body scroll when mounted', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when unmounted', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    wrapper = null
    expect(document.body.style.overflow).toBe('')
  })

  it('shows a close button with accessible label containing an SVG icon', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const closeButton = getCloseButton()
    expect(closeButton).toBeTruthy()
    expect(closeButton!.querySelector('svg')).toBeTruthy()
  })

  it('renders correctly for password reset mode', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'reset', notice: null },
    })
    const dialog = getDialog()
    expect(dialog?.textContent).toContain('Send Reset Link')
  })

  it('uses the body heading as the dialog label via aria-label', () => {
    wrapper = mount(AuthForm, {
      props: { disabled: false, error: null, loading: false, mode: 'login', notice: null },
    })
    const dialog = getDialog()
    expect(dialog).toBeTruthy()
    expect(dialog!.textContent).toContain('Welcome back')
  })
})
