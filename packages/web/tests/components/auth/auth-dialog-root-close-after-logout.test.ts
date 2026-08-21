// @vitest-environment happy-dom
/**
 * Regression test for: closing the login modal after logout was impossible.
 *
 * Root cause: handleClose() called router.back() when on an auth route AND
 * window.history.length > 1. This navigated back to the previously visited
 * protected page (e.g. /account). The navigation guard then detected the user
 * was unauthenticated and immediately redirected back to /login, re-showing the
 * modal. Users were trapped in a loop.
 *
 * Fix: always navigate to '/' when closing from an auth route — the only safe
 * destination when the user is unauthenticated.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthDialog } from '@/composables/useAuthDialog'

// --- Router mock ---
const mockPush = vi.fn()
const mockBack = vi.fn()
let mockRouteName = 'login'

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: mockRouteName, query: {} }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// --- Minimal dependency mocks ---
vi.mock('@/lib/analytics', () => ({ trackSignup: vi.fn() }))
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({ success: vi.fn(), info: vi.fn() }),
}))

// --- Helpers ---
function getCloseButton() {
  return document.body.querySelector('button[aria-label="Close"]') as HTMLButtonElement | null
}

function getBackdropButton() {
  return document.body.querySelector('[data-testid="auth-backdrop"]') as HTMLButtonElement | null
}

/**
 * Simulate the real-world post-logout condition: the user navigated to
 * /account, then was redirected to /login after signing out. history.length > 1.
 */
function simulateHistoryWithPreviousEntries() {
  Object.defineProperty(window, 'history', {
    value: { ...window.history, length: 5 },
    writable: true,
    configurable: true,
  })
}

function resetHistoryLength() {
  Object.defineProperty(window, 'history', {
    value: { ...window.history, length: 1 },
    writable: true,
    configurable: true,
  })
}

describe('AuthDialogRoot – closing dialog on auth route after logout (history.length > 1)', () => {
  let AuthDialogRoot: any
  let wrapper: ReturnType<typeof mount> | null = null

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    mockPush.mockClear()
    mockBack.mockClear()

    // Simulate real-world condition: user has history (was on /account before logout)
    simulateHistoryWithPreviousEntries()

    // Reset dialog composable state to closed
    const { closeAuthDialog } = useAuthDialog()
    closeAuthDialog()

    const mod = await import('@/components/auth/AuthDialogRoot.vue')
    AuthDialogRoot = mod.default
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    resetHistoryLength()
  })

  it('navigates to "/" when the X close button is clicked on the /login route (not router.back())', async () => {
    mockRouteName = 'login'
    wrapper = mount(AuthDialogRoot)

    const closeBtn = getCloseButton()
    expect(closeBtn, 'Close button should be visible on login route').toBeTruthy()
    closeBtn!.click()

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('navigates to "/" when the backdrop is clicked on the /login route (not router.back())', async () => {
    mockRouteName = 'login'
    wrapper = mount(AuthDialogRoot)

    const backdrop = getBackdropButton()
    expect(backdrop, 'Backdrop should be visible on login route').toBeTruthy()
    backdrop!.click()

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('navigates to "/" when Escape is pressed on the /login route (not router.back())', async () => {
    mockRouteName = 'login'
    wrapper = mount(AuthDialogRoot)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('navigates to "/" when the X close button is clicked on the /signup route (not router.back())', async () => {
    mockRouteName = 'signup'
    wrapper = mount(AuthDialogRoot)

    const closeBtn = getCloseButton()
    expect(closeBtn, 'Close button should be visible on signup route').toBeTruthy()
    closeBtn!.click()

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('closes the dialog without navigating when opened directly via composable (not on auth route)', async () => {
    mockRouteName = 'sites-home'
    const { openAuthDialog } = useAuthDialog()

    wrapper = mount(AuthDialogRoot)
    openAuthDialog('login')
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))

    const closeBtn = getCloseButton()
    expect(closeBtn).toBeTruthy()
    closeBtn!.click()

    // Dialog was opened directly (not on auth route) — no navigation at all
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })
})
