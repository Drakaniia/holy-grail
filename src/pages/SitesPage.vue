<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, TrendingUp, Clock, Star, Sparkles } from 'lucide-vue-next'
import { sortSitesForTab, useSitesStore } from '@/stores/sites'
import PaginationControls from '@/components/PaginationControls.vue'
import SiteCard from '@/components/sites/SiteCard.vue'
import { trackSearchQuery } from '@/lib/analytics'

const route = useRoute()
const store = useSitesStore()
void store.loadSites()

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
    development: 'Cloud hosting, learning paths, references, repositories, and developer workflow resources',
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

const categoryFilters = computed(() => {
  const categories = new Set(filteredSites.value.map(site => site.category))
  return ['All', ...Array.from(categories).sort()]
})

const displaySites = computed(() => {
  let result = [...filteredSites.value]

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

const pageRangeStart = computed(() => {
  if (displaySites.value.length === 0) return 0
  return (store.currentPage - 1) * store.itemsPerPage + 1
})

const pageRangeEnd = computed(() =>
  Math.min(store.currentPage * store.itemsPerPage, displaySites.value.length)
)

function setPage(page: number) {
  store.setPage(Math.min(Math.max(page, 1), Math.max(totalPages.value, 1)))
}

watch([category, subcategory], () => {
  store.setCategory('All')
  store.setPage(1)
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

          <div class="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-gray-700 p-1 md:w-auto" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
            <button
              @click="store.setTab('trending')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'trending' ? 'bg-accent-600 text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              TRENDING
            </button>
            <button
              @click="store.setTab('newest')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'newest' ? 'bg-accent-600 text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <Clock class="w-3.5 h-3.5" />
              NEWEST
            </button>
            <button
              @click="store.setTab('popular')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'popular' ? 'bg-accent-600 text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <Star class="w-3.5 h-3.5" />
              POPULAR
            </button>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              Showing {{ pageRangeStart }}-{{ pageRangeEnd }} of {{ displaySites.length }} sites
            </span>
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

      <div v-if="store.loading && filteredSites.length === 0" class="flex items-center justify-center py-16">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles class="h-5 w-5 animate-pulse text-yellow-500" />
          Loading sites...
        </div>
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
