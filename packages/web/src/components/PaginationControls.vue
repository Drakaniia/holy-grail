<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const visiblePages = computed(() => {
  if (props.totalPages <= 4) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const clampedPage = Math.min(Math.max(props.currentPage, 1), props.totalPages)
  const pages = new Set([1, clampedPage, props.totalPages])

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= props.totalPages)
    .sort((first, second) => first - second)
  const result: Array<number | 'ellipsis'> = []

  for (const page of sortedPages) {
    const previousPage = result.at(-1)

    if (typeof previousPage === 'number' && page - previousPage > 1) {
      if (page - previousPage === 2) {
        result.push(previousPage + 1)
      } else {
        result.push('ellipsis')
      }
    }

    result.push(page)
  }

  return result
})

function selectPage(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('pageChange', page)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="mt-8 flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2"
    aria-label="Pagination"
  >
    <button
      type="button"
      :disabled="currentPage === 1"
      class="h-8 rounded-lg border border-gray-800 bg-[#1f1f1f] px-2 text-xs font-medium text-gray-400 transition-all hover:border-accent-700 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
      @click="selectPage(currentPage - 1)"
    >
      <span class="sm:hidden">Prev</span>
      <span class="hidden sm:inline">Previous</span>
    </button>

    <template v-for="(page, index) in visiblePages" :key="`${page}-${index}`">
      <button
        v-if="typeof page === 'number'"
        type="button"
        class="h-8 w-8 rounded-lg text-xs font-medium transition-all sm:h-10 sm:w-10 sm:text-sm"
        :class="
          currentPage === page
            ? 'bg-accent-600 text-white shadow-[0_0_18px_rgba(255,122,0,0.22)]'
            : 'border border-gray-800 bg-[#1f1f1f] text-gray-400 hover:border-accent-700 hover:text-accent-300'
        "
        :aria-current="currentPage === page ? 'page' : undefined"
        @click="selectPage(page)"
      >
        {{ page }}
      </button>
      <span
        v-else
        class="inline-flex h-8 items-center rounded-lg px-1.5 text-xs font-medium text-accent-500/80 sm:h-10 sm:px-2 sm:text-sm"
        aria-hidden="true"
      >
        ...
      </span>
    </template>

    <button
      type="button"
      :disabled="currentPage === totalPages"
      class="h-8 rounded-lg border border-gray-800 bg-[#1f1f1f] px-2 text-xs font-medium text-gray-400 transition-all hover:border-accent-700 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
      @click="selectPage(currentPage + 1)"
    >
      Next
    </button>
  </nav>
</template>
