<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-vue-next'
import { useSkillsStore } from '@/stores/skills'
import PaginationControls from '@/components/PaginationControls.vue'
import SkillCard from '@/components/skills/SkillCard.vue'
import SkillCardSkeleton from '@/components/skills/SkillCardSkeleton.vue'
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
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
              AURA {{ category.toUpperCase() }}
            </p>
            <h1 class="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl mb-4">
              {{ pageTitle }}
            </h1>
            <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
              {{ pageDescription }}
            </p>
          </div>

          <div class="w-full flex-shrink-0 sm:w-auto">
            <div
              class="w-full border border-gray-800 rounded-xl px-5 py-4 sm:min-w-[200px] sm:px-6 sm:py-5"
              style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
            >
              <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                LIBRARY PULSE
              </p>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-3xl font-bold text-white">{{ filteredSkills.length }}</span>
                <span class="text-sm text-gray-500">skills</span>
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

    <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
      <div
        class="border border-gray-800 rounded-xl p-4 mb-6"
        style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="relative min-w-0 flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              v-model="store.searchQuery"
              @input="store.setSearchQuery(store.searchQuery)"
              type="text"
              placeholder="Search skills by name or intent"
              class="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all"
            />
          </div>

          <div
            class="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-gray-700 p-1 md:w-auto"
            style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
          >
            <button
              @click="store.setTab('popular')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                store.activeTab === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <TrendingUp class="w-3.5 h-3.5" />
              POPULAR
            </button>
            <button
              @click="store.setTab('trending')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                store.activeTab === 'trending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <TrendingUp class="w-3.5 h-3.5" />
              TRENDING
            </button>
            <button
              @click="store.setTab('recent')"
              class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                store.activeTab === 'recent' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              "
            >
              <Clock class="w-3.5 h-3.5" />
              RECENT
            </button>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              Showing {{ pageRangeStart }}-{{ pageRangeEnd }} of {{ displaySkills.length }} skills
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-for="filter in categoryFilters"
            :key="filter"
            @click="store.setCategory(filter)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="
              store.activeCategory === filter
                ? 'bg-accent-600 text-white'
                : 'text-gray-400 hover:text-white border border-gray-700'
            "
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <div
        v-if="store.loading && filteredSkills.length === 0"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading skills"
      >
        <SkillCardSkeleton v-for="index in 8" :key="index" />
      </div>

      <div
        v-else-if="store.loadError"
        class="border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-100"
      >
        {{ store.loadError }}
      </div>

      <div
        v-else-if="paginatedSkills.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <SkillCard v-for="skill in paginatedSkills" :key="skill.slug" :skill="skill" />
      </div>

      <div v-else class="text-center py-16">
        <p class="text-gray-500 text-lg">No skills found matching your search.</p>
        <button
          @click="
            store.setSearchQuery('')
            store.setCategory('All')
          "
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
