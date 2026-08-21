<script setup lang="ts">
import type { ProfileTab, ProfileTabKey } from '@/types/profile'

defineProps<{
  activeTab: ProfileTabKey
  tabs: ProfileTab[]
}>()

const emit = defineEmits<{
  select: [tab: ProfileTabKey]
}>()
</script>

<template>
  <div
    class="inline-flex max-w-full overflow-x-auto rounded-lg border border-zinc-900 bg-[#1f1f1f]/80 p-1"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-semibold text-zinc-500 transition hover:text-zinc-100"
      :class="activeTab === tab.key ? 'bg-[#1f1f1f] text-white shadow-sm shadow-[#1f1f1f]/40' : ''"
      :aria-pressed="activeTab === tab.key"
      @click="emit('select', tab.key)"
    >
      <span>{{ tab.label }}</span>
      <span class="text-[11px]" :class="activeTab === tab.key ? 'text-zinc-300' : 'text-zinc-600'">
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
