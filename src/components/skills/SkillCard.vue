<script setup lang="ts">
import { computed } from 'vue'
import { Code2, Eye } from 'lucide-vue-next'
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

const displayTags = computed(() => {
  const tags = [props.skill.category, ...props.skill.tags]
  return tags.slice(0, 2)
})

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}
</script>

<template>
  <RouterLink
    :to="`/skills/${skill.slug}`"
    class="group relative block rounded-xl border border-gray-800 bg-[#1f1f1f] transition-all hover:border-gray-700"
  >
    <div class="absolute right-3 top-3 z-10">
      <BookmarkButton :resource="bookmarkResource" />
    </div>

    <div class="flex flex-col gap-2 p-4">
      <!-- Header row: avatar + title -->
      <div class="flex items-center gap-3 pr-8">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs text-gray-400"
        >
          {{ skill.authorName.charAt(0).toUpperCase() }}
        </div>
        <h3
          class="min-w-0 truncate text-sm font-semibold text-white transition-colors group-hover:text-accent-400"
        >
          {{ skill.title }}
        </h3>
      </div>

      <!-- Description -->
      <p class="line-clamp-1 text-xs text-gray-400">
        {{ skill.description }}
      </p>

      <!-- Stats row -->
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <Eye class="h-3.5 w-3.5" />
          <span>{{ formatNumber(skill.views) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Code2 class="h-3.5 w-3.5" />
          <span>{{ formatNumber(skill.uses) }}</span>
        </div>
      </div>

      <!-- Tag badges -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
