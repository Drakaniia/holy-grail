<script setup lang="ts">
import { computed } from 'vue'
import { Code2, ExternalLink, Eye, User } from 'lucide-vue-next'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import type { Skill } from '@/stores/skills'

const props = defineProps<{
  skill: Skill
}>()

const bookmarkResource = computed(() => ({
  type: 'skill' as const,
  slug: props.skill.slug,
  title: props.skill.title,
  url: `https://github.com/${props.skill.repoLink}`,
  category: props.skill.category,
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
      :to="`/skills/${skill.slug}`"
      class="block p-5 pr-16"
    >
      <div class="flex min-w-0 items-start justify-between gap-3 mb-3">
        <h3 class="min-w-0 break-words text-sm font-semibold text-white transition-colors group-hover:text-accent-400">
          {{ skill.title }}
        </h3>
        <ExternalLink class="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
      </div>

      <p class="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
        {{ skill.description }}
      </p>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
        <div class="flex items-center gap-1">
          <Eye class="w-3.5 h-3.5" />
          <span>{{ formatNumber(skill.views) }} views</span>
        </div>
        <div class="flex items-center gap-1">
          <Code2 class="w-3.5 h-3.5" />
          <span>{{ formatNumber(skill.uses) }} Uses</span>
        </div>
      </div>

      <div class="border-t border-gray-800 pt-3">
        <div class="flex min-w-0 items-center justify-between gap-3">
          <div class="min-w-0 flex items-center gap-2">
            <div class="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {{ skill.authorName.charAt(0).toUpperCase() }}
            </div>
            <span class="truncate text-xs text-gray-400">{{ skill.authorName }}</span>
          </div>
          <div class="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span class="truncate max-w-[120px]">{{ skill.repoLink }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <User class="w-3 h-3" />
          <span>Added by {{ skill.addedBy }}</span>
        </div>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
