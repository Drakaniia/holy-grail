// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'

describe('useAuthDialog composable', () => {
  let useAuthDialog: any

  beforeEach(async () => {
    // Clear any module cache by importing fresh
    const mod = await import('../../../src/composables/useAuthDialog')
    useAuthDialog = mod.useAuthDialog
  })

  it('defaults to isOpen=false and mode="login"', () => {
    const { authDialogState } = useAuthDialog()
    expect(authDialogState.value.isOpen).toBe(false)
    expect(authDialogState.value.mode).toBe('login')
  })

  it('sets isOpen=true and mode="login" when openAuthDialog("login") is called', () => {
    const { authDialogState, openAuthDialog } = useAuthDialog()
    openAuthDialog('login')
    expect(authDialogState.value.isOpen).toBe(true)
    expect(authDialogState.value.mode).toBe('login')
  })

  it('sets isOpen=true and mode="signup" when openAuthDialog("signup") is called', () => {
    const { authDialogState, openAuthDialog } = useAuthDialog()
    openAuthDialog('signup')
    expect(authDialogState.value.isOpen).toBe(true)
    expect(authDialogState.value.mode).toBe('signup')
  })

  it('resets isOpen to false when closeAuthDialog() is called', () => {
    const { authDialogState, openAuthDialog, closeAuthDialog } = useAuthDialog()
    openAuthDialog('login')
    expect(authDialogState.value.isOpen).toBe(true)

    closeAuthDialog()
    expect(authDialogState.value.isOpen).toBe(false)
    expect(authDialogState.value.mode).toBe('login')
  })

  it('state is shared across multiple calls to useAuthDialog (singleton)', () => {
    const { openAuthDialog } = useAuthDialog()
    const { authDialogState } = useAuthDialog()
    // State is shared on the module, so first call opens it
    openAuthDialog('signup')
    expect(authDialogState.value.isOpen).toBe(true)
    expect(authDialogState.value.mode).toBe('signup')
  })

  it('supports openAuthDialog("reset") for password reset mode', () => {
    const { authDialogState, openAuthDialog } = useAuthDialog()
    openAuthDialog('reset')
    expect(authDialogState.value.isOpen).toBe(true)
    expect(authDialogState.value.mode).toBe('reset')
  })
})
