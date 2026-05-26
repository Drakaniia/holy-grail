<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'

const props = defineProps<{
  resourceTypeLabel: string
  name: string
  url: string
  description: string
  category: string
  submitterNote: string
}>()
</script>

<template>
  <section class="border border-gray-800 bg-[#060606] p-5" aria-labelledby="publish-summary-title">
    <p class="text-xs font-semibold uppercase tracking-widest text-accent-300">
      Final check
    </p>
    <h2 id="publish-summary-title" class="mt-2 text-xl font-bold text-white">
      Review before queueing
    </h2>

    <dl class="mt-5 divide-y divide-gray-800 border border-gray-800">
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">Type</dt>
        <dd class="text-sm text-gray-200">{{ props.resourceTypeLabel }}</dd>
      </div>
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">Name</dt>
        <dd class="text-sm text-gray-200">{{ props.name || 'Not set' }}</dd>
      </div>
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">URL</dt>
        <dd>
          <a
            v-if="props.url"
            :href="props.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex max-w-full items-center gap-1 break-all text-sm text-accent-300 hover:text-accent-200"
          >
            {{ props.url }}
            <ExternalLink class="h-3.5 w-3.5 shrink-0" />
          </a>
          <span v-else class="text-sm text-gray-500">Not set</span>
        </dd>
      </div>
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">Category</dt>
        <dd class="text-sm text-gray-200">{{ props.category || 'Not set' }}</dd>
      </div>
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">Description</dt>
        <dd class="text-sm leading-6 text-gray-300">{{ props.description || 'Not set' }}</dd>
      </div>
      <div class="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
        <dt class="text-xs font-semibold uppercase tracking-widest text-gray-600">Reviewer note</dt>
        <dd class="text-sm leading-6 text-gray-300">
          {{ props.submitterNote || 'No extra note' }}
        </dd>
      </div>
    </dl>
  </section>
</template>
