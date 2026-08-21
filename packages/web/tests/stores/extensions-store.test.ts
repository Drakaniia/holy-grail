// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExtensionsStore } from '../../src/stores/extensions'

describe('Extensions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns the same singleton instance on multiple calls', () => {
    const instanceA = useExtensionsStore()
    const instanceB = useExtensionsStore()

    // Pinia stores are singletons — same reference = same data
    expect(instanceA).toBe(instanceB)
  })
})
