<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-vue-next'
import { useSkillsStore } from '@/stores/skills'
import PaginationControls from '@/components/PaginationControls.vue'
import SkillCard from '@/components/skills/SkillCard.vue'
import SkillCardSkeleton from '@/components/skills/SkillCardSkeleton.vue'
import TagFilterBar from '@/components/skills/TagFilterBar.vue'
import { trackSearchQuery } from '@/lib/analytics'

const route = useRoute()
const store = useSkillsStore()
void store.loadSkills()

const category = computed(() => route.params.category as string)

const routeLabels: Record<string, string> = {
  skills: 'Skills',
  design: 'Design',
}

const pageTitle = computed(() => {
  return routeLabels[category.value] || category.value
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    skills: 'Technical skills and workflows for AI agents',
    design: 'Design skills and guidelines for creative teams',
  }
  return descriptions[category.value] || 'Curated skills and resources'
})

const filteredSkills = computed(() => {
  return store.getSkillsByParentCategory(category.value)
})

const categoryFilters = computed(() => {
  const categories = new Set(filteredSkills.value.map((skill) => skill.category))
  return ['All', ...Array.from(categories).sort()]
})

const displaySkills = computed(() => {
  let result = [...filteredSkills.value]

  if (store.searchQuery) {
    const query = store.searchQuery.toLowerCase()
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query)),
    )
  }

  if (store.activeCategory !== 'All') {
    result = result.filter((skill) => skill.category === store.activeCategory)
  }

  switch (store.activeTab) {
    case 'popular':
      result.sort((a, b) => b.views - a.views)
      break
    case 'trending':
      result.sort((a, b) => b.uses - a.uses)
      break
    case 'recent':
      result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      break
  }

  return result
})

const paginatedSkills = computed(() => {
  const start = (store.currentPage - 1) * store.itemsPerPage
  return displaySkills.value.slice(start, start + store.itemsPerPage)
})

const totalPages = computed(() => Math.ceil(displaySkills.value.length / store.itemsPerPage))

const pageRangeStart = computed(() => {
  if (displaySkills.value.length === 0) return 0
  return (store.currentPage - 1) * store.itemsPerPage + 1
})

const pageRangeEnd = computed(() =>
  Math.min(store.currentPage * store.itemsPerPage, displaySkills.value.length),
)

function setPage(page: number) {
  store.setPage(Math.min(Math.max(page, 1), Math.max(totalPages.value, 1)))
}

function clearFilters() {
  store.setSearchQuery('')
  store.setCategory('All')
}

watch(category, () => {
  store.setCategory('All')
  store.setPage(1)
})

watch(
  () => store.searchQuery,
  (query) => {
    trackSearchQuery(query, 'skills_search')
  },
)

watch(totalPages, (pages) => {
  if (store.currentPage > pages) {
    setPage(pages)
  }
})
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <!-- Simplified Header -->
    <div class="border-b border-gray-800">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div class="flex flex-col gap-2">
          <h1 class="font-mono text-3xl font-bold text-white sm:text-4xl">
            {{ pageTitle }}<span class="text-accent-500">_</span>
          </h1>
          <p class="max-w-2xl text-base leading-relaxed text-gray-400">
            {{ pageDescription }}
          </p>
        </div>
      </div>
    </div>

    <!-- Unified Filter Bar -->
    <div class="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <div class="mb-6 rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <!-- Search input with $ prefix -->
          <div class="relative min-w-0 flex-1">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-500"
            >
              $
            </span>
            <Search class="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              v-model="store.searchQuery"
              @input="store.setSearchQuery(store.searchQuery)"
              type="text"
              placeholder="Search skills..."
              class="w-full rounded-lg border border-gray-700 bg-[#1f1f1f] py-2.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          <!-- Sort tabs -->
          <div
            class="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-gray-700 bg-[#1f1f1f] p-1 md:w-auto"
          >
            <button
              @click="store.setTab('popular')"
              class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              :class="
                store.activeTab === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <TrendingUp class="h-3.5 w-3.5" />
              POPULAR
            </button>
            <button
              @click="store.setTab('trending')"
              class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              :class="
                store.activeTab === 'trending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <Sparkles class="h-3.5 w-3.5" />
              TRENDING
            </button>
            <button
              @click="store.setTab('recent')"
              class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              :class="
                store.activeTab === 'recent' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <Clock class="h-3.5 w-3.5" />
              RECENT
            </button>
          </div>

          <!-- Results count -->
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-gray-500">
              [{{ String(pageRangeStart).padStart(2, '0') }}-{{
                String(pageRangeEnd).padStart(2, '0')
              }}/{{ displaySkills.length }}]
            </span>
          </div>
        </div>

        <!-- Category filter pills -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="filter in categoryFilters"
            :key="filter"
            @click="store.setCategory(filter)"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            :class="
              store.activeCategory === filter
                ? 'bg-accent-600 text-white'
                : 'border border-gray-700 text-gray-400 hover:text-white'
            "
          >
            {{ filter === 'All' ? '--all' : `--${filter.toLowerCase()}` }}
          </button>
        </div>
      </div>

      <!-- Tag Filter Bar -->
      <div v-if="store.allTags.length > 0" class="mb-4">
        <TagFilterBar
          :all-tags="store.allTags"
          :selected-tags="store.selectedTags"
          :match-mode="store.tagMatchMode"
          @toggle-tag="store.toggleTag"
          @set-match-mode="store.setTagMatchMode"
          @clear-all="store.clearTagFilters"
        />
      </div>

      <!-- Loading State -->
      <div
        v-if="store.loading && filteredSkills.length === 0"
        class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading skills"
      >
        <SkillCardSkeleton v-for="index in 6" :key="index" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="store.loadError"
        class="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-100"
      >
        {{ store.loadError }}
      </div>

      <!-- Skills Grid -->
      <div
        v-else-if="paginatedSkills.length > 0"
        class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <SkillCard v-for="skill in paginatedSkills" :key="skill.slug" :skill="skill" />
      </div>

      <!-- Empty State -->
      <div v-else class="py-16 text-center">
        <p class="text-lg text-gray-500">No skills found matching your search.</p>
        <button @click="clearFilters" class="mt-4 text-sm text-accent-400 hover:text-accent-300">
          Clear filters
        </button>
      </div>

      <!-- Pagination -->
      <PaginationControls
        :current-page="store.currentPage"
        :total-pages="totalPages"
        @page-change="setPage"
      />
    </div>
  </div>
</template>
