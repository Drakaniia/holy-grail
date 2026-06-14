<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useExtensionsStore } from '@/stores/extensions'
import { Star, Users } from 'lucide-vue-next'

const route = useRoute()
const store = useExtensionsStore()

onMounted(() => {
  void store.loadExtensions()
})

const parentCategory = computed(() => route.params.category as string)
const subcategory = computed(() => route.params.subcategory as string | undefined)

const categories = [
  { key: 'writing', name: 'Writing', description: 'Citation, research writing, grammar, and academic workflows', accent: '#39ffb4', count: 0 },
  { key: 'productivity', name: 'Productivity', description: 'Everyday productivity and browser-based task management', accent: '#7aa7ff', count: 0 },
  { key: 'developer-tools', name: 'Developer Tools', description: 'Developer workflows, debugging, and web inspection', accent: '#ff5f8f', count: 0 },
  { key: 'privacy', name: 'Privacy', description: 'Privacy, security, and safer browsing habits', accent: '#a78bfa', count: 0 },
  { key: 'research', name: 'Research', description: 'Research discovery, note capture, and source management', accent: '#ffd166', count: 0 },
  { key: 'design', name: 'Design', description: 'Design inspiration, color, typography, and visual workflows', accent: '#ff8c1a', count: 0 },
  { key: 'automation', name: 'Automation', description: 'Automating repetitive browser tasks and workflows', accent: '#34d399', count: 0 },
]

const categorySummaries = computed(() =>
  categories.map(cat => ({
    ...cat,
    count: store.getExtensionsByParentCategory(cat.key).length,
  }))
)

const extensions = computed(() => {
  const base = subcategory.value
    ? store.getExtensionsBySubcategory(parentCategory.value, subcategory.value)
    : store.getExtensionsByParentCategory(parentCategory.value)

  return base
})

const featuredExtensions = computed(() =>
  extensions.value.filter(e => e.featured).slice(0, 6),
)

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return num.toString()
}
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          Chrome Extensions
        </p>
        <h1 class="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl mb-4">
          Extensions
        </h1>
        <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
          Curated Chrome extensions to enhance your browsing experience
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
      <!-- Category Grid -->
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <span class="w-1 h-5 bg-accent-500 rounded-full" />
          Browse by Category
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <RouterLink
            v-for="cat in categorySummaries"
            :key="cat.key"
            :to="`/extensions/${cat.key}`"
            class="ext-card group relative overflow-hidden rounded-xl border p-5 transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors">
                {{ cat.name }}
              </h3>
              <span class="text-xs text-gray-500">{{ cat.count }}</span>
            </div>
            <p class="text-xs text-gray-400 line-clamp-2">{{ cat.description }}</p>
          </RouterLink>
        </div>
      </section>

        <div v-if="store.loading" class="grid grid-cols-1 gap-6">
          <div v-for="index in 3" :key="index" class="ext-card-skeleton border rounded-xl h-32 animate-pulse" />
      </div>

      <div v-else-if="store.loadError" class="border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-100">
        {{ store.loadError }}
      </div>

      <template v-else>
        <section v-if="featuredExtensions.length" class="mb-12">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="w-1 h-5 bg-accent-500 rounded-full" />
            Featured Extensions
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RouterLink
              v-for="extension in featuredExtensions"
              :key="extension.slug"
              :to="`/extensions/${extension.slug}`"
              class="ext-card group relative overflow-hidden rounded-xl border p-5 transition-all"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
                    {{ extension.name }}
                  </h3>
                  <p class="text-xs text-gray-400 line-clamp-2 mt-2">
                    {{ extension.description }}
                  </p>
                  <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span v-if="extension.chromeWebStoreRating > 0" class="flex items-center gap-1 text-amber-400">
                      <Star class="w-3.5 h-3.5 fill-amber-400" />
                      {{ extension.chromeWebStoreRating.toFixed(1) }}
                    </span>
                    <span v-if="extension.userCount > 0" class="flex items-center gap-1">
                      <Users class="w-3.5 h-3.5" />
                      {{ formatNumber(extension.userCount) }}
                    </span>
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="w-1 h-5 bg-accent-500 rounded-full" />
            All Extensions
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <RouterLink
              v-for="extension in extensions"
              :key="extension.slug"
              :to="`/extensions/${extension.slug}`"
              class="ext-card group relative overflow-hidden rounded-xl border p-5 transition-all"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
                    {{ extension.name }}
                  </h3>
                  <p class="text-xs text-gray-400 line-clamp-2 mt-2">
                    {{ extension.description }}
                  </p>
                  <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span v-if="extension.chromeWebStoreRating > 0" class="flex items-center gap-1 text-amber-400">
                      <Star class="w-3.5 h-3.5 fill-amber-400" />
                      {{ extension.chromeWebStoreRating.toFixed(1) }}
                    </span>
                    <span v-if="extension.userCount > 0" class="flex items-center gap-1">
                      <Users class="w-3.5 h-3.5" />
                      {{ formatNumber(extension.userCount) }}
                    </span>
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ext-card {
  border-color: #1f2937;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%),
    #1f1f1f;
}

.ext-card:hover {
  border-color: #374151;
}

.ext-card-skeleton {
  border-color: #1f2937;
  background: #1f1f1f;
}

:global(html.light .ext-card) {
  border-color: var(--mocha-border);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.09), rgba(255, 140, 26, 0) 58%),
    var(--mocha-surface);
  box-shadow: 0 1px 0 rgba(45, 33, 25, 0.04);
}

:global(html.light .ext-card:hover) {
  border-color: var(--mocha-border-strong);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.13), rgba(255, 140, 26, 0) 60%),
    var(--mocha-surface-strong);
}

:global(html.light .ext-card-skeleton) {
  border-color: var(--mocha-border);
  background: var(--mocha-surface-muted);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
