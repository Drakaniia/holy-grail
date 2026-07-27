<script setup lang="ts">
defineProps<{
  contentHtml: string
  loading: boolean
  error: string | null
}>()
</script>

<template>
  <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-5">
    <h3 class="mb-4 text-lg font-semibold text-white">Usage Guide</h3>
    <div v-if="loading" class="animate-pulse space-y-3">
      <div class="h-4 w-3/4 rounded bg-gray-800" />
      <div class="h-4 w-1/2 rounded bg-gray-800" />
      <div class="h-4 w-2/3 rounded bg-gray-800" />
    </div>
    <div v-else-if="error" class="text-sm text-red-400">{{ error }}</div>
    <div
      v-else-if="contentHtml"
      class="prose prose-invert max-w-none text-sm text-gray-300"
      v-html="contentHtml"
    />
    <p v-else class="text-sm text-gray-500">
      Load the SKILL.md content to see usage instructions.
    </p>
  </div>
</template>
