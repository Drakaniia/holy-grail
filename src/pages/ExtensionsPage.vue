<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useExtensionsStore } from '@/stores/extensions'
import { Star, Users } from 'lucide-vue-next'

const route = useRoute()
const store = useExtensionsStore()

const parentCategory = computed(() => route.params.category as string)
const subcategory = computed(() => route.params.subcategory as string | undefined)

onMounted(() => {
  void store.loadExtensions()
})

const pageTitle = computed(() => {
  const labels: Record<string, string> = {
    writing: 'Writing',
    productivity: 'Productivity',
    'developer-tools': 'Developer Tools',
    privacy: 'Privacy',
    research: 'Research',
    design: 'Design',
    automation: 'Automation',
  }
  return labels[parentCategory.value] || parentCategory.value
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    writing: 'Chrome extensions for citation, research writing, grammar, and academic workflows',
    productivity: 'Chrome extensions for everyday productivity and browser-based task management',
    'developer-tools': 'Chrome extensions for developer workflows, debugging, and web inspection',
    privacy: 'Chrome extensions for privacy, security, and safer browsing habits',
    research: 'Chrome extensions for research discovery, note capture, and source management',
    design: 'Chrome extensions for design inspiration, color, typography, and visual workflows',
    automation: 'Chrome extensions for automating repetitive browser tasks and workflows',
  }
  return descriptions[parentCategory.value] || 'Curated Chrome extensions'
})

const extensions = computed(() => {
  if (subcategory.value) {
    return store.getExtensionsBySubcategory(parentCategory.value, subcategory.value)
  }
  return store.getExtensionsByParentCategory(parentCategory.value)
})

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return num.toString()
}
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          {{ parentCategory }}
        </p>
        <h1 class="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl mb-4">
          {{ pageTitle }}
        </h1>
        <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
          {{ pageDescription }}
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          v-for="extension in extensions"
          :key="extension.slug"
          :to="`/extensions/${extension.slug}`"
          class="group relative overflow-hidden rounded-xl border border-gray-800 p-5 transition-all hover:border-gray-700"
          style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%), #1f1f1f"
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
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
