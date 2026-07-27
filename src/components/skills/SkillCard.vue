<script setup lang="ts">
import { computed } from 'vue'
import { Code2, Eye } from 'lucide-vue-next'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import type { Skill } from '@/stores/skills'

const props = defineProps<{
  skill: Skill
}>()

const palette = [
  'from-amber-500/40',
  'from-sky-500/40',
  'from-rose-500/40',
  'from-emerald-500/40',
  'from-violet-500/40',
  'from-cyan-500/40',
  'from-orange-500/40',
  'from-teal-500/40',
  'from-pink-500/40',
  'from-indigo-500/40',
]

const accentColor = computed(() => {
  let hash = 0
  const name = props.skill.authorName
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % palette.length
  const from = palette[idx]
  const to = from.replace('from-', 'to-').replace('/40', '/10')
  return { from, to }
})

const authorInitial = computed(() =>
  props.skill.authorName.charAt(0).toUpperCase(),
)

const bookmarkResource = computed(() => ({
  type: 'skill' as const,
  slug: props.skill.slug,
  title: props.skill.title,
  url: `https://github.com/${props.skill.repoLink}`,
  category: props.skill.category,
}))

const displayTags = computed(() => {
  const tags = [props.skill.category, ...props.skill.tags]
  if (tags.length <= 3) return tags
  return [...tags.slice(0, 2), `+${tags.length - 2} more`]
})

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

function getAuthorColor(name: string): string {
  const colors = [
    'bg-amber-500/20 text-amber-400',
    'bg-sky-500/20 text-sky-400',
    'bg-rose-500/20 text-rose-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-violet-500/20 text-violet-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-orange-500/20 text-orange-400',
    'bg-teal-500/20 text-teal-400',
    'bg-pink-500/20 text-pink-400',
    'bg-indigo-500/20 text-indigo-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return colors[Math.abs(hash) % colors.length]
}
</script>

<template>
  <RouterLink
    :to="`/skills/${skill.slug}`"
    class="group relative block overflow-hidden rounded-xl border border-gray-800 bg-[#1f1f1f] transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20"
  >
    <!-- Colored top accent strip -->
    <div
      class="h-0.5 w-full bg-gradient-to-r"
      :class="[accentColor.from, accentColor.to]"
    />

    <div class="absolute right-2.5 top-3.5 z-10">
      <BookmarkButton :resource="bookmarkResource" />
    </div>

    <div class="flex flex-col gap-3 p-4 pt-3.5">
      <!-- Creator row: avatar + name + github handle -->
      <div class="flex items-center gap-2.5 pr-8">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          :class="getAuthorColor(skill.authorName)"
        >
          {{ authorInitial }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] font-medium leading-none text-gray-300">
            {{ skill.authorName }}
          </p>
          <p class="mt-0.5 truncate text-[11px] text-gray-600">
            @{{ skill.author }}
          </p>
        </div>
      </div>

      <!-- Title -->
      <h3
        class="leading-snug tracking-tight text-white transition-colors group-hover:text-accent-400"
      >
        <span class="text-base font-semibold">{{ skill.title }}</span>
      </h3>

      <!-- Description -->
      <p class="line-clamp-2 text-[13px] leading-relaxed text-gray-500">
        {{ skill.description }}
      </p>

      <!-- Stats row (hidden when no data) -->
      <div
        v-if="skill.views > 0 || skill.uses > 0"
        class="flex items-center gap-3 text-xs text-gray-500"
      >
        <div v-if="skill.views > 0" class="flex items-center gap-1">
          <Eye class="h-3.5 w-3.5" />
          <span>{{ formatNumber(skill.views) }}</span>
        </div>
        <div v-if="skill.uses > 0" class="flex items-center gap-1">
          <Code2 class="h-3.5 w-3.5" />
          <span>{{ formatNumber(skill.uses) }}</span>
        </div>
      </div>

      <!-- Tags + badges -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="rounded-md bg-gray-800/80 px-2 py-0.5 text-[11px] text-gray-500"
        >
          {{ tag }}
        </span>
        <span
          v-if="skill.sourceType === 'project'"
          class="rounded-md bg-amber-900/20 px-2 py-0.5 text-[11px] text-amber-400/80"
          title="Installed locally in this project"
        >
          Local
        </span>
      </div>
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
