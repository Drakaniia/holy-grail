<script setup lang="ts">
import { ExternalLink, Github } from 'lucide-vue-next'

defineProps<{
  repoLink: string
}>()
</script>

<template>
  <section>
    <h2 class="mb-4 text-2xl font-semibold text-white">Resources</h2>

    <div class="space-y-3">
      <!-- GitHub Repo -->
      <a
        :href="`https://github.com/${repoLink}`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#1f1f1f] p-4 transition-colors hover:border-gray-700"
      >
        <Github class="h-5 w-5 text-gray-400" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white">GitHub Repository</p>
          <p class="truncate text-xs text-gray-500">{{ repoLink }}</p>
        </div>
        <ExternalLink class="h-4 w-4 shrink-0 text-gray-500" />
      </a>

      <!-- TODO: Additional resource links when data model supports -->
    </div>
  </section>
</template>
