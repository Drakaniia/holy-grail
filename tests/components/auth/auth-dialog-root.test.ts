// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('AuthDialogRoot.vue', () => {
  let AuthDialogRoot: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    const mod = await import('../src/components/auth/AuthDialogRoot.vue')
    AuthDialogRoot = mod.default
  })

  it('exports a valid component', () => {
    expect(AuthDialogRoot).toBeDefined()
  })
})
