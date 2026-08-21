<script setup lang="ts">
import { Eye, Code2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

interface RelatedSkill {
  slug: string
  title: string
  authorName: string
  description: string
  category: string
  views: number
  uses: number
  dateAdded: string
}

defineProps<{
  skills: RelatedSkill[]
  categorySlug?: string
}>()

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toString()
}
</script>

<template>
  <section v-if="skills.length > 0">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-semibold text-white">Related Skills</h2>
      <RouterLink
        v-if="categorySlug"
        :to="`/skills/${categorySlug}`"
        class="text-sm text-accent-500 transition-colors hover:text-accent-400"
      >
        View More →
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="s in skills"
        :key="s.slug"
        :to="`/skills/${s.slug}`"
        class="group rounded-xl border border-gray-800 bg-[#1f1f1f] p-4 transition-colors hover:border-gray-700"
      >
        <div class="mb-2 flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400"
          >
            {{ s.title.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <h3
              class="truncate text-sm font-semibold text-white transition-colors group-hover:text-accent-400"
            >
              {{ s.title }}
            </h3>
            <p class="text-xs text-gray-500">by {{ s.authorName }}</p>
          </div>
        </div>

        <p class="mb-3 line-clamp-2 text-xs text-gray-400">
          {{ s.description }}
        </p>

        <div v-if="s.views > 0 || s.uses > 0" class="flex items-center gap-3 text-xs text-gray-500">
          <span v-if="s.views > 0" class="flex items-center gap-1">
            <Eye class="h-3.5 w-3.5" />
            {{ formatNumber(s.views) }}
          </span>
          <span v-if="s.uses > 0" class="flex items-center gap-1">
            <Code2 class="h-3.5 w-3.5" />
            {{ formatNumber(s.uses) }}
          </span>
        </div>

        <span class="mt-2 inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {{ s.category }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
