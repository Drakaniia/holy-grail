<script setup lang="ts">
import { Eye, Code2, User } from 'lucide-vue-next'
import type { Skill } from '@/stores/skills'

defineProps<{
  skill: Skill
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
    :to="`/skills/${skill.slug}`"
    class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group block"
  >
    <div class="flex items-start justify-between mb-3">
      <h3 class="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors pr-6">
        {{ skill.title }}
      </h3>
      <ExternalLink class="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
    </div>

    <p class="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
      {{ skill.description }}
    </p>

    <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
            {{ skill.authorName.charAt(0).toUpperCase() }}
          </div>
          <span class="text-xs text-gray-400">{{ skill.authorName }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-gray-500">
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
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
