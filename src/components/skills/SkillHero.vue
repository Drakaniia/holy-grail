<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Code2, User, Calendar } from 'lucide-vue-next'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'

interface SkillData {
  slug: string
  title: string
  category: string
  authorName: string
  repoLink: string
  dateAdded: string
  views: number
  uses: number
  tags: string[]
}

const props = defineProps<{
  skill: SkillData | null
}>()

const bookmarkResource = computed(() => {
  if (!props.skill) return null
  return {
    type: 'skill' as const,
    slug: props.skill.slug,
    title: props.skill.title,
    url: `https://github.com/${props.skill.repoLink}`,
    category: props.skill.category,
  }
})

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toString()
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const initial = computed(() => (props.skill?.title?.charAt(0) ?? 'S').toUpperCase())
</script>

<template>
  <div v-if="skill" class="flex items-start justify-between gap-6">
    <!-- Left: Icon + Info -->
    <div class="flex min-w-0 flex-1 items-start gap-4">
      <!-- Icon Placeholder -->
      <div
        class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-2xl font-bold text-gray-400"
      >
        {{ initial }}
      </div>

      <!-- Info Stack -->
      <div class="min-w-0 flex-1 space-y-3">
        <!-- Title Row -->
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="min-w-0 break-words text-4xl font-bold text-white">
            {{ skill.title }}
          </h1>
          <!-- Version badge -- TODO: show when skill.version available -->
          <span class="rounded-md border border-gray-700 px-2 py-0.5 text-sm text-gray-500">
            v1.0.0
          </span>
          <!-- Verified badge -- TODO: show when skill.verified available -->
          <span class="text-green-500" title="Verified">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-5 w-5"
            >
              <path
                fill-rule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <BookmarkButton v-if="bookmarkResource" :resource="bookmarkResource" variant="detail" />
        </div>

        <!-- Metadata Row -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
          <span class="flex items-center gap-1">
            <User class="h-3.5 w-3.5" />
            {{ skill.authorName }}
          </span>
          <span class="text-gray-600">·</span>
          <span class="flex items-center gap-1">
            <Calendar class="h-3.5 w-3.5" />
            {{ formatDate(skill.dateAdded) }}
          </span>
        </div>

        <!-- Category Badge -->
        <span
          class="inline-block rounded-full border border-gray-700 px-3 py-0.5 text-xs text-gray-300"
        >
          {{ skill.category }}
        </span>

        <!-- Stats Row -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
          <span class="flex items-center gap-1.5">
            <Eye class="h-4 w-4" />
            {{ formatNumber(skill.views) }} views
          </span>
          <span class="flex items-center gap-1.5">
            <Code2 class="h-4 w-4" />
            {{ formatNumber(skill.uses) }} uses
          </span>
        </div>
      </div>
    </div>

    <!-- Right: GitHub link -->
    <a
      :href="`https://github.com/${skill.repoLink}`"
      target="_blank"
      rel="noopener noreferrer"
      class="shrink-0 text-gray-400 transition-colors hover:text-white"
      title="View on GitHub"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-6 w-6"
      >
        <path
          fill-rule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
          clip-rule="evenodd"
        />
      </svg>
    </a>
  </div>
</template>
