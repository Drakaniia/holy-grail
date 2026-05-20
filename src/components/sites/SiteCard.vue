<script setup lang="ts">
import { Star, Eye, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import SiteFavicon from './SiteFavicon.vue'
import type { Site } from '@/stores/sites'

defineProps<{
  site: Site
}>()

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}
</script>

<template>
  <RouterLink
    :to="`/sites/${site.slug}`"
    class="border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group block"
    style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
  >
    <div class="flex items-start gap-4 mb-3">
      <!-- Icon -->
      <SiteFavicon :website="site.website" :name="site.name" size="md" />

      <!-- Name and Category -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
            {{ site.name }}
          </h3>
          <CheckCircle2 v-if="site.verified" class="w-4 h-4 text-green-500 flex-shrink-0" />
          <RefreshCw v-else class="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
        </div>
        <span class="inline-block px-2 py-0.5 bg-[#161b22] border border-gray-700 rounded-full text-[10px] text-gray-400">
          {{ site.category }}
        </span>
      </div>
    </div>

    <!-- Description -->
    <p class="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
      {{ site.description }}
    </p>

    <!-- Stats -->
    <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
      <div class="flex items-center gap-1">
        <Star class="w-3.5 h-3.5" />
        <span>{{ formatNumber(site.stars) }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Eye class="w-3.5 h-3.5" />
        <span>{{ formatNumber(site.watchers) }}</span>
      </div>
      <span class="text-gray-600">Added {{ site.addedDaysAgo }}mo ago</span>
    </div>

    <!-- Tags -->
    <div v-if="site.tags && site.tags.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in site.tags"
        :key="tag"
        class="px-2 py-0.5 bg-[#161b22] border border-gray-700 rounded text-[10px] text-gray-400"
      >
        {{ tag }}
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
