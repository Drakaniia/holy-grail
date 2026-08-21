<script setup lang="ts">
import { computed } from 'vue'
import { Code2, ExternalLink, Globe2, Trash2 } from 'lucide-vue-next'
import type { ProfileBookmarkItem } from '@/types/profile'

const props = defineProps<{
  disabled?: boolean
  item: ProfileBookmarkItem
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const typeLabel = computed(() => (props.item.type === 'site' ? 'Site' : 'Skill'))
</script>

<template>
  <article class="group border border-zinc-900 bg-[#1f1f1f] p-5 transition hover:border-zinc-700">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#1f1f1f] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400"
          >
            <Globe2 v-if="item.type === 'site'" class="h-3 w-3" />
            <Code2 v-else class="h-3 w-3" />
            {{ typeLabel }}
          </span>
          <span class="text-xs text-zinc-600">{{ item.category }}</span>
        </div>

        <RouterLink
          :to="item.route"
          class="block truncate text-base font-bold text-white transition group-hover:text-accent-300"
        >
          {{ item.title }}
        </RouterLink>
        <p class="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
          {{ item.description }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-900 text-zinc-600 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Remove bookmark"
        :disabled="disabled"
        @click="emit('remove', item.id)"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <div
      class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-4"
    >
      <RouterLink
        :to="item.route"
        class="text-sm font-semibold text-accent-300 transition hover:text-accent-100"
      >
        Open details
      </RouterLink>
      <a
        v-if="item.externalUrl"
        :href="item.externalUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm text-zinc-600 transition hover:text-white"
      >
        Source
        <ExternalLink class="h-3.5 w-3.5" />
      </a>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
