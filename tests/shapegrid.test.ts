// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HomeHero from '../src/components/home/HomeHero.vue'
import ShapeGrid from '../src/components/home/ShapeGrid.vue'

// Mock useTheme composable
const mockIsLightMode = ref(false)
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    isLightMode: mockIsLightMode,
  }),
}))

// Mock useRandomPreviewTiles composable
vi.mock('@/composables/useRandomPreviewTiles', () => ({
  useRandomPreviewTiles: () => ({
    markImageFailed: vi.fn(),
    tiles: ref([]),
  }),
}))

describe('HomeHero ShapeGrid Colors', () => {
  beforeEach(() => {
    mockIsLightMode.value = false
  })

  it('uses darker visible colors for ShapeGrid border and hover fill in light mode', async () => {
    mockIsLightMode.value = true
    const wrapper = mount(HomeHero, {
      props: {
        totalSitesLabel: '10 sites',
        totalSkillsLabel: '5 skills',
        totalCategoriesLabel: '3 categories',
        previewItems: [],
        isLoading: false,
      },
    })
    const shapeGrid = wrapper.findComponent(ShapeGrid)
    expect(shapeGrid.exists()).toBe(true)
    expect(shapeGrid.props('borderColor')).toBe('rgba(217, 107, 0, 0.4)')
    expect(shapeGrid.props('hoverFillColor')).toBe('rgba(217, 107, 0, 0.2)')
  })

  it('uses standard translucent colors for ShapeGrid border and hover fill in dark mode', async () => {
    mockIsLightMode.value = false
    const wrapper = mount(HomeHero, {
      props: {
        totalSitesLabel: '10 sites',
        totalSkillsLabel: '5 skills',
        totalCategoriesLabel: '3 categories',
        previewItems: [],
        isLoading: false,
      },
    })
    const shapeGrid = wrapper.findComponent(ShapeGrid)
    expect(shapeGrid.exists()).toBe(true)
    expect(shapeGrid.props('borderColor')).toBe('rgba(255, 140, 26, 0.26)')
    expect(shapeGrid.props('hoverFillColor')).toBe('rgba(255, 140, 26, 0.18)')
  })
})
