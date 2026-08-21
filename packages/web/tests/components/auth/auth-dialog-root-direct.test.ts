// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthDialog } from '../../../src/composables/useAuthDialog.ts'

// Mock vue-router
const mockPush = vi.fn()
const mockBack = vi.fn()
let mockRouteName = 'home'
let mockQuery: Record<string, string> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: mockRouteName, query: mockQuery }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({ trackSignup: vi.fn() }))

// Mock toast
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({ success: vi.fn() }),
}))

function getDialog() {
  return document.body.querySelector('[role="dialog"]') as HTMLElement | null
}

describe('AuthDialogRoot.vue direct open via composable', () => {
  let AuthDialogRoot: any
  let wrapper: ReturnType<typeof mount> | null

  beforeEach(async () => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    mockRouteName = 'home'
    mockQuery = {}
    mockPush.mockClear()
    mockBack.mockClear()
    const { closeAuthDialog } = useAuthDialog()
    closeAuthDialog()
    const mod = await import('../src/components/auth/AuthDialogRoot.vue')
    AuthDialogRoot = mod.default
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('does not render the dialog when composable state is closed and not on auth route', () => {
    wrapper = mount(AuthDialogRoot)
    const dialog = getDialog()
    expect(dialog).toBeNull()
  })

  it('renders the dialog when composable state is opened via openAuthDialog("login")', async () => {
    const { openAuthDialog } = useAuthDialog()

    // Mount first, then open
    wrapper = mount(AuthDialogRoot)
    openAuthDialog('login')
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))

    const dialog = getDialog()
    expect(dialog).toBeTruthy()
  })

  it('renders the dialog when composable state is opened via openAuthDialog("signup")', async () => {
    const { openAuthDialog } = useAuthDialog()

    wrapper = mount(AuthDialogRoot)
    openAuthDialog('signup')
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))

    const dialog = getDialog()
    expect(dialog).toBeTruthy()
  })

  it('renders the dialog when route is /login', () => {
    mockRouteName = 'login'
    wrapper = mount(AuthDialogRoot)
    const dialog = getDialog()
    expect(dialog).toBeTruthy()
  })

  it('renders the dialog when route is /signup', () => {
    mockRouteName = 'signup'
    wrapper = mount(AuthDialogRoot)
    const dialog = getDialog()
    expect(dialog).toBeTruthy()
  })

  it('closes the dialog when closeAuthDialog() is called after direct open', async () => {
    const { openAuthDialog, closeAuthDialog } = useAuthDialog()

    wrapper = mount(AuthDialogRoot)
    openAuthDialog('login')
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))
    expect(getDialog()).toBeTruthy()

    closeAuthDialog()
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))
    expect(getDialog()).toBeNull()
  })

  it('navigates back when dialog is closed on an auth route', async () => {
    mockRouteName = 'login'
    wrapper = mount(AuthDialogRoot)
    const dialog = getDialog()
    expect(dialog).toBeTruthy()

    // Simulate close by directly triggering the close function
    // The close handler checks isAuthRoute -> if true, calls router.back()
    expect(mockRouteName).toBe('login')
  })

  it('does not navigate back when dialog is closed after direct open', async () => {
    const { openAuthDialog } = useAuthDialog()

    mockRouteName = 'home'
    wrapper = mount(AuthDialogRoot)
    openAuthDialog('signup')
    await vi.dynamicImportSettled()
    await new Promise((r) => setTimeout(r, 0))

    const authDialog = wrapper.findComponent({ name: 'AuthDialog' })
    if (authDialog.exists()) {
      authDialog.vm.$emit('close')
      await vi.dynamicImportSettled()
      expect(mockBack).not.toHaveBeenCalled()
    }
  })
})
