<script setup lang="ts">
defineProps<{
  skill: {
    title: string
    description: string
    repoLink: string
    tags: string[]
  } | null
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-5">
      <h3 class="mb-3 text-sm font-semibold text-white">How Agents Use This Skill</h3>
      <div class="space-y-3">
        <div v-if="skill?.repoLink" class="flex items-start gap-3">
          <span class="mt-0.5 rounded-md bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400">
            CLI
          </span>
          <code class="flex-1 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-gray-300">
            npx grail add {{ skill.repoLink }} --skill {{ skill?.title?.toLowerCase().replace(/\s+/g, '-') }}
          </code>
        </div>
      </div>
    </div>

    <div v-if="skill?.tags?.length" class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-5">
      <h3 class="mb-3 text-sm font-semibold text-white">Triggers</h3>
      <p class="text-sm text-gray-400">
        This skill activates when the agent detects keywords like:
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="tag in skill?.tags"
          :key="tag"
          class="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>
