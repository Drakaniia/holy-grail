<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, ChevronDown, List, Search, Send, Shuffle, Sparkles } from 'lucide-vue-next'
import { sortSitesForTab, useSitesStore, type SiteSortTab } from '@/stores/sites'
import PaginationControls from '@/components/PaginationControls.vue'
import SiteCard from '@/components/sites/SiteCard.vue'
import SiteCardSkeleton from '@/components/sites/SiteCardSkeleton.vue'
import { trackSearchQuery } from '@/lib/analytics'

type SiteTimeRange = 'all' | 'trending' | 'week' | 'month' | 'year'

const timeRangeOptions: { label: string; value: SiteTimeRange }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Trending', value: 'trending' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
]

const timeRangeDays: Partial<Record<SiteTimeRange, number>> = {
  week: 7,
  month: 30,
  year: 365,
}

const route = useRoute()
const store = useSitesStore()
void store.loadSites()

const activeTimeRange = shallowRef<SiteTimeRange>('all')
const isTimeRangeMenuOpen = shallowRef(false)
const timeRangeMenu = useTemplateRef<HTMLDivElement>('timeRangeMenu')

const category = computed(() => route.params.category as string)
const subcategory = computed(() => route.params.subcategory as string | undefined)

const routeLabels: Record<string, string> = {
  'cli-tools': 'CLI Tools',
  'ui-libraries': 'UI Libraries',
  ai: 'AI',
  design: 'Design',
  development: 'Development',
  watch: 'Watch',
  downloads: 'Downloads',
  image: 'Image',
  api: 'API',
  detector: 'Detector',
  automation: 'Automation',
  video: 'Video',
  ml: 'Machine Learning',
  chat: 'CHAT',
  wb: 'Website Development',
  research: 'Research',
  ppt: 'PPT',
  others: 'Others',
  inspiration: 'Inspiration',
  fonts: 'Fonts',
  '3d': '3D',
  prompts: 'Prompts',
  'icons-svg': 'ICONS/SVG',
  md: 'MD',
  'design-tools': 'Design Tools',
  learning: 'Learning',
  'cloud-hosting': 'Cloud & Hosting',
  references: 'References',
  tooling: 'Tooling',
  repositories: 'Repositories',
  mcp: 'MCP',
  monitoring: 'Monitoring',
  anime: 'Anime',
  'game-download': 'Game Download',
  'vfx-download': 'VFX Download',
  'software-download': 'Software Download',
  torrents: 'Torrents',
  movies: 'Movies',
}

const pageTitle = computed(() => {
  if (subcategory.value) {
    return routeLabels[subcategory.value] || subcategory.value
  }
  return routeLabels[category.value] || category.value
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    'cli-tools': 'Command-line tools and utilities for development workflows',
    'ui-libraries': 'UI component libraries and design systems',
    ai: 'AI-powered tools and services',
    design: 'Design resources, inspiration, and tools',
    development: 'Cloud hosting, learning paths, references, tooling, CLI tools, UI libraries, repositories, and developer workflow resources',
    watch: 'Saved streaming and watch source bookmarks for movies and anime',
    downloads: 'Saved download source bookmarks grouped by media and file type',
    image: 'AI image generation and editing tools',
    api: 'AI APIs and model providers',
    detector: 'AI detection and analysis tools',
    automation: 'AI automation and workflow tools',
    video: 'AI video generation and editing tools',
    ml: 'Machine learning frameworks, notebooks, data science platforms, and references',
    chat: 'AI chat assistants and conversational AI',
    wb: 'AI website development, app builders, and design-to-code generators',
    research: 'AI research and analysis tools',
    ppt: 'AI presentation and slide generation tools',
    others: 'Other AI tools and services',
    inspiration: 'Design inspiration and showcases',
    fonts: 'Font libraries and typography resources',
    '3d': '3D assets and modeling tools',
    prompts: 'Prompt libraries and collections',
    'icons-svg': 'Icon libraries and SVG resources',
    md: 'Markdown resources and tools',
    'design-tools': 'Design tools and utilities',
    learning: 'Courses, coding challenges, and structured programming practice',
    'development/cloud-hosting': 'Cloud platforms, hosting, databases, and backend services for development work',
    'development/cli-tools': 'Command-line tools and utilities for development workflows',
    'development/ui-libraries': 'UI component libraries and design systems for development work',
    references: 'Documentation, articles, and implementation references for developers',
    tooling: 'Developer tools, runtimes, package utilities, and workflow services',
    repositories: 'Source repositories and curated code collections',
    mcp: 'Model Context Protocol tools, docs, servers, and integrations',
    monitoring: 'Uptime, status, analytics, and production observability tools',
    'watch/movies': 'Movie watch source bookmarks grouped for quick launch',
    'watch/anime': 'Anime watch source bookmarks grouped for quick launch',
    'game-download': 'Game download source bookmarks from the imported browser folder',
    'vfx-download': 'VFX assets, templates, and graphics download source bookmarks',
    'software-download': 'Software download source bookmarks from the imported browser folder',
    torrents: 'Torrent index and search bookmarks from the imported browser folder',
    'downloads/movies': 'Movie download source bookmarks from the imported browser folder',
  }
  const key = subcategory.value ? `${category.value}/${subcategory.value}` : category.value
  return descriptions[key] || descriptions[subcategory.value || category.value] || 'Curated tools and resources'
})

const filteredSites = computed(() => {
  if (subcategory.value) {
    return store.getSitesBySubcategory(category.value, subcategory.value)
  }
  return store.getSitesByParentCategory(category.value)
})

const timeFilteredSites = computed(() => {
  const rangeDays = timeRangeDays[activeTimeRange.value]

  if (!rangeDays) {
    return filteredSites.value
  }

  return filteredSites.value.filter(site => site.addedDaysAgo <= rangeDays)
})

const categoryFilters = computed(() => {
  const categories = new Set(filteredSites.value.map(site => site.category))
  return ['All', ...Array.from(categories).sort()]
})

const activeTimeRangeLabel = computed(() => {
  return timeRangeOptions.find(option => option.value === activeTimeRange.value)?.label ?? 'All Time'
})

const displaySites = computed(() => {
  let result = [...timeFilteredSites.value]

  if (store.searchQuery) {
    const query = store.searchQuery.toLowerCase()
    result = result.filter(
      s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
      )
  }

  if (store.activeCategory !== 'All') {
    result = result.filter(site => site.category === store.activeCategory)
  }

  return sortSitesForTab(result, store.activeTab)
})

const paginatedSites = computed(() => {
  const start = (store.currentPage - 1) * store.itemsPerPage
  return displaySites.value.slice(start, start + store.itemsPerPage)
})

const totalPages = computed(() => Math.ceil(displaySites.value.length / store.itemsPerPage))

function setPage(page: number) {
  store.setPage(Math.min(Math.max(page, 1), Math.max(totalPages.value, 1)))
}

function getSortButtonClass(tab: SiteSortTab) {
  return store.activeTab === tab
    ? 'border-zinc-600 bg-zinc-800 text-white shadow-sm shadow-black/40'
    : 'border-gray-800 bg-black text-gray-400 hover:border-gray-700 hover:bg-zinc-900 hover:text-white'
}

function toggleTimeRangeMenu() {
  isTimeRangeMenuOpen.value = !isTimeRangeMenuOpen.value
}

function selectTimeRange(range: SiteTimeRange) {
  activeTimeRange.value = range
  isTimeRangeMenuOpen.value = false

  if (range === 'trending') {
    store.setTab('trending')
    return
  }

  store.setPage(1)
}

function closeTimeRangeMenu() {
  isTimeRangeMenuOpen.value = false
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target

  if (!(target instanceof Node) || timeRangeMenu.value?.contains(target)) {
    return
  }

  closeTimeRangeMenu()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeTimeRangeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

watch([category, subcategory], () => {
  store.setCategory('All')
  store.setPage(1)
  activeTimeRange.value = 'all'
})

watch(
  () => store.searchQuery,
  query => {
    trackSearchQuery(query, 'sites_search')
  },
)

watch(totalPages, pages => {
  if (store.currentPage > pages) {
    setPage(pages)
  }
})
</script>

<template>
  <div class="bg-black text-white">
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
              {{ category }}
            </p>
            <h1 class="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl mb-4">
              {{ pageTitle }}
            </h1>
            <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
              {{ pageDescription }}
            </p>
          </div>

          <div class="w-full flex-shrink-0 sm:w-auto">
            <div class="w-full border border-gray-800 rounded-xl px-5 py-4 sm:min-w-[200px] sm:px-6 sm:py-5" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                COLLECTION
              </p>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-3xl font-bold text-white">{{ filteredSites.length }}</span>
                <span class="text-sm text-gray-500">sites</span>
              </div>
              <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                <Sparkles class="w-3 h-3 text-yellow-500" />
                <span>Updated May 20, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="relative min-w-0 flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              v-model="store.searchQuery"
              @input="store.setSearchQuery(store.searchQuery)"
              type="text"
              placeholder="Search sites by name or category"
              class="w-full bg-black border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all"
            />
          </div>

          <div class="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <button
              type="button"
              @click="store.setTab('popular')"
              class="flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all"
              :class="getSortButtonClass('popular')"
            >
              <List class="h-3.5 w-3.5" />
              Popular
            </button>

            <div ref="timeRangeMenu" class="relative shrink-0">
              <button
                type="button"
                class="flex items-center gap-2 rounded-md border border-gray-800 bg-black px-3 py-2 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:bg-zinc-900 hover:text-white"
                :aria-expanded="isTimeRangeMenuOpen"
                aria-haspopup="menu"
                @click="toggleTimeRangeMenu"
              >
                {{ activeTimeRangeLabel }}
                <ChevronDown class="h-3.5 w-3.5 text-gray-500 transition-transform" :class="isTimeRangeMenuOpen ? 'rotate-180' : ''" />
              </button>

              <div
                v-if="isTimeRangeMenuOpen"
                class="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-gray-700 bg-zinc-900 py-1 shadow-xl shadow-black/50"
                role="menu"
              >
                <button
                  v-for="option in timeRangeOptions"
                  :key="option.value"
                  type="button"
                  class="block w-full px-3 py-2 text-left text-xs font-medium transition-colors"
                  :class="activeTimeRange === option.value ? 'bg-zinc-800 text-white' : 'text-gray-300 hover:bg-zinc-800 hover:text-white'"
                  role="menuitem"
                  @click="selectTimeRange(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <button
              type="button"
              @click="store.setTab('trending')"
              class="flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all"
              :class="getSortButtonClass('trending')"
            >
              <Shuffle class="h-3.5 w-3.5" />
              Explore
            </button>

            <button
              type="button"
              @click="store.setTab('newest')"
              class="flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all"
              :class="getSortButtonClass('newest')"
            >
              <Calendar class="h-3.5 w-3.5" />
              Recent
            </button>

            <RouterLink
              to="/publish"
              class="flex shrink-0 items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-500"
            >
              <Send class="h-3.5 w-3.5" />
              Publish
            </RouterLink>
          </div>

        </div>

        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-for="filter in categoryFilters"
            :key="filter"
            @click="store.setCategory(filter)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="store.activeCategory === filter
              ? 'bg-accent-600 text-white'
              : 'text-gray-400 hover:text-white border border-gray-700'"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <div
        v-if="store.loading && filteredSites.length === 0"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading sites"
      >
        <SiteCardSkeleton v-for="index in 6" :key="index" />
      </div>

      <div
        v-else-if="store.loadError"
        class="border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-100"
      >
        {{ store.loadError }}
      </div>

      <div v-else-if="paginatedSites.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SiteCard
          v-for="site in paginatedSites"
          :key="site.slug"
          :site="site"
        />
      </div>

      <div v-else class="text-center py-16">
        <p class="text-gray-500 text-lg">No sites found matching your search.</p>
        <button
          @click="store.setSearchQuery(''); store.setCategory('All')"
          class="mt-4 text-accent-400 hover:text-accent-300 text-sm"
        >
          Clear filters
        </button>
      </div>

      <PaginationControls
        :current-page="store.currentPage"
        :total-pages="totalPages"
        @page-change="setPage"
      />
    </div>
  </div>
</template>
