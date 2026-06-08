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
  <article class="site-card group relative overflow-hidden rounded-xl border transition-all">
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
            <h3 class="site-card__title text-sm font-semibold transition-colors truncate">
              {{ site.name }}
            </h3>
            <CheckCircle2 v-if="site.verified" class="w-4 h-4 text-green-500 flex-shrink-0" />
            <RefreshCw v-else class="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          </div>
          <span class="site-card__category inline-block px-2 py-0.5 rounded-full text-[10px]">
            {{ site.category }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <p class="site-card__description text-xs leading-relaxed mb-4 line-clamp-2">
        {{ site.description }}
      </p>

      <!-- Stats -->
      <div class="site-card__stats flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-3">
        <div v-if="hasRepoStats && site.stars > 0" class="flex items-center gap-1">
          <Star class="w-3.5 h-3.5" />
          <span>{{ formatNumber(site.stars) }}</span>
        </div>
        <div v-if="hasRepoStats && site.watchers > 0" class="flex items-center gap-1">
          <Eye class="w-3.5 h-3.5" />
          <span>{{ formatNumber(site.watchers) }}</span>
        </div>
        <span class="site-card__added">Added {{ site.addedDaysAgo }}mo ago</span>
      </div>

      <!-- Tags -->
      <div v-if="site.tags && site.tags.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in site.tags"
          :key="tag"
          class="site-card__tag px-2 py-0.5 rounded text-[10px]"
        >
          {{ tag }}
        </span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.site-card {
  border-color: #1f2937;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%),
    #1f1f1f;
}

.site-card:hover {
  border-color: #374151;
}

.site-card__title {
  color: #ffffff;
}

.site-card:hover .site-card__title {
  color: #fb923c;
}

.site-card__category,
.site-card__tag {
  border: 1px solid #374151;
  background: #1f1f1f;
  color: #9ca3af;
}

.site-card__description {
  color: #9ca3af;
}

.site-card__stats {
  color: #6b7280;
}

.site-card__added {
  color: #4b5563;
}

:global(html.light .site-card) {
  border-color: var(--mocha-border);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.09), rgba(255, 140, 26, 0) 58%),
    var(--mocha-surface);
  box-shadow: 0 1px 0 rgba(45, 33, 25, 0.04);
}

:global(html.light .site-card:hover) {
  border-color: var(--mocha-border-strong);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.13), rgba(255, 140, 26, 0) 60%),
    var(--mocha-surface-strong);
}

:global(html.light .site-card__title) {
  color: var(--mocha-text);
}

:global(html.light .site-card:hover .site-card__title) {
  color: #9a4800;
}

:global(html.light .site-card__category),
:global(html.light .site-card__tag) {
  border-color: var(--mocha-border);
  background: #fffdf8;
  color: var(--mocha-text-soft);
}

:global(html.light .site-card__description),
:global(html.light .site-card__stats) {
  color: var(--mocha-text-soft);
}

:global(html.light .site-card__added) {
  color: var(--mocha-muted);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
