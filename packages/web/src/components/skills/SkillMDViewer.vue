<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

defineProps<{
  contentHtml: string
  expanded: boolean
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  'toggle-expand': []
}>()
</script>

<template>
  <section class="rounded-xl border border-gray-800 bg-[#1f1f1f]">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-5 pb-3">
      <h3 class="text-lg font-semibold text-white">SKILL.md</h3>
      <button
        @click="emit('toggle-expand')"
        class="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-white"
        :aria-expanded="expanded"
      >
        {{ expanded ? 'Collapse' : 'Expand' }}
        <component :is="expanded ? ChevronUp : ChevronDown" class="h-4 w-4" />
      </button>
    </div>

    <!-- Content -->
    <div
      class="overflow-hidden transition-all duration-300"
      :class="expanded ? 'max-h-none' : 'max-h-96'"
    >
      <div class="border-t border-gray-800 px-6 py-4">
        <!-- Loading -->
        <div v-if="loading" class="space-y-3 py-8">
          <div class="h-4 w-3/5 rounded bg-gray-800" />
          <div class="h-4 w-full rounded bg-gray-800" />
          <div class="h-4 w-4/5 rounded bg-gray-800" />
          <div class="h-4 w-3/4 rounded bg-gray-800" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-8 text-center text-sm text-gray-500">
          <p>Failed to load SKILL.md content.</p>
          <p class="mt-1 text-gray-600">{{ error }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!contentHtml" class="py-8 text-center text-sm text-gray-500">
          No SKILL.md available.
        </div>

        <!-- Rendered -->
        <div
          v-else
          class="skill-content prose prose-invert prose-sm max-w-none overflow-x-auto break-words"
          v-html="contentHtml"
        />
      </div>
    </div>

    <!-- Gradient fade when collapsed -->
    <div
      v-if="!expanded && contentHtml"
      class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1f1f1f] to-transparent"
    />
  </section>
</template>

<style scoped>
@reference "tailwindcss";

.skill-content :deep(h1) {
  @apply mb-4 mt-0 text-2xl font-bold text-white;
}
.skill-content :deep(h2) {
  @apply mb-3 mt-6 text-xl font-semibold text-white;
}
.skill-content :deep(h3) {
  @apply mb-2 mt-4 text-lg font-medium text-white;
}
.skill-content :deep(h4) {
  @apply mb-2 mt-4 text-base font-medium text-white;
}
.skill-content :deep(p) {
  @apply mb-4 leading-relaxed text-gray-400;
}
.skill-content :deep(ul) {
  @apply mb-4 list-inside list-disc space-y-1 text-gray-400;
}
.skill-content :deep(ol) {
  @apply mb-4 list-inside list-decimal space-y-1 text-gray-400;
}
.skill-content :deep(li) {
  @apply text-gray-400;
}
.skill-content :deep(code) {
  background: #1f1f1f;
  color: #ffa54d;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}
.skill-content :deep(pre) {
  @apply mb-4 overflow-x-auto rounded-lg border border-gray-800 bg-[#1f1f1f] p-4;
}
.skill-content :deep(pre code) {
  @apply bg-transparent p-0 text-gray-300;
}
.skill-content :deep(strong) {
  @apply font-semibold text-white;
}
.skill-content :deep(a) {
  color: #ffa54d;
}
.skill-content :deep(a:hover) {
  color: #ffc080;
}
.skill-content :deep(blockquote) {
  @apply my-4 border-l-4 border-gray-700 pl-4 italic text-gray-500;
}
.skill-content :deep(hr) {
  @apply my-6 border-gray-800;
}
.skill-content :deep(table) {
  @apply mb-4 w-full border-collapse;
}
.skill-content :deep(th) {
  @apply border-b border-gray-700 px-3 py-2 text-left text-sm font-semibold text-white;
}
.skill-content :deep(td) {
  @apply border-b border-gray-800 px-3 py-2 text-sm text-gray-400;
}

/* Collapsed gradient container */
.skill-content-wrapper {
  position: relative;
}
</style>
