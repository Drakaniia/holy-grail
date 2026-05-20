<script setup lang="ts">
import { computed } from 'vue'
import { Star, Eye, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import SiteFavicon from './SiteFavicon.vue'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import type { Site } from '@/stores/sites'

const props = defineProps<{
  site: Site
}>()

const hasRepoStats = computed(() => Boolean(props.site.sourceCode))
const bookmarkResource = computed(() => ({
  type: 'site' as const,
  slug: props.site.slug,
  title: props.site.name,
  url: props.site.website,
  category: props.site.category,
}))

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}
</script>

<template>
  <article
    class="group relative overflow-hidden rounded-xl border border-gray-800 transition-all hover:border-gray-700"
    style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
  >
    <div class="absolute right-4 top-4 z-10">
      <BookmarkButton :resource="bookmarkResource" />
    </div>

    <RouterLink
      :to="`/sites/${site.slug}`"
      class="block p-5 pr-16"
    >
      <div class="flex min-w-0 items-start gap-4 mb-3">
        <!-- Icon -->
        <SiteFavicon :website="site.website" :name="site.name" size="md" />

        <!-- Name and Category -->
        <div class="flex-1 min-w-0">
          <div class="flex min-w-0 items-center gap-2 mb-1">
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
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        <div v-if="hasRepoStats && site.stars > 0" class="flex items-center gap-1">
          <Star class="w-3.5 h-3.5" />
          <span>{{ formatNumber(site.stars) }}</span>
        </div>
        <div v-if="hasRepoStats && site.watchers > 0" class="flex items-center gap-1">
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
  </article>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
