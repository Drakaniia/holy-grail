<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  allTags: string[]
  selectedTags: string[]
  matchMode: 'and' | 'or'
}>()

const emit = defineEmits<{
  'toggle-tag': [tag: string]
  'set-match-mode': [mode: 'and' | 'or']
  'clear-all': []
}>()

const showClear = computed(() => props.selectedTags.length > 0)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="tag in allTags"
      :key="tag"
      class="rounded-full px-3 py-1 text-xs font-medium transition-all"
      :class="
        selectedTags.includes(tag)
          ? 'bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/50'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
      "
      @click="emit('toggle-tag', tag)"
    >
      {{ tag }}
      <span v-if="selectedTags.includes(tag)" class="ml-1">&times;</span>
    </button>

    <button
      v-if="selectedTags.length >= 2"
      class="rounded-full border border-gray-700 px-2 py-1 text-xs font-medium text-gray-400 hover:border-gray-600"
      :title="`Switch to ${matchMode === 'and' ? 'OR' : 'AND'} mode`"
      @click="emit('set-match-mode', matchMode === 'and' ? 'or' : 'and')"
    >
      {{ matchMode.toUpperCase() }}
    </button>

    <button
      v-if="showClear"
      class="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-gray-500 hover:text-gray-300"
      @click="emit('clear-all')"
    >
      <X class="h-3 w-3" />
      Clear
    </button>
  </div>
</template>
