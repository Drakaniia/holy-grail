<script setup lang="ts">
defineProps<{
  /** `gray` for the bookmarks page, `zinc` for the profile page — the only difference between them. */
  tone?: 'gray' | 'zinc'
}>()
</script>

<template>
  <article
    class="border bg-[#1f1f1f] p-5"
    :class="tone === 'zinc' ? 'border-zinc-900' : 'border-gray-800'"
    aria-hidden="true"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <div class="hg-skeleton h-6 w-14 rounded"></div>
          <div class="hg-skeleton h-3 w-20 rounded"></div>
        </div>

        <div class="hg-skeleton h-5 w-44 max-w-full rounded"></div>
        <div class="mt-3 space-y-2">
          <div class="hg-skeleton h-3 w-full rounded"></div>
          <div class="hg-skeleton h-3 w-4/5 rounded"></div>
        </div>
      </div>

      <div class="hg-skeleton h-9 w-9 shrink-0 rounded"></div>
    </div>

    <div
      class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
      :class="tone === 'zinc' ? 'border-zinc-900' : 'border-gray-800'"
    >
      <div class="hg-skeleton h-4 w-24 rounded"></div>
      <div class="hg-skeleton h-4 w-16 rounded"></div>
    </div>
  </article>
</template>
