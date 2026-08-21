<script setup lang="ts">
import { computed } from 'vue'
import { Plug, Wrench, CheckCircle2 } from 'lucide-vue-next'
import type { McpServer } from '@/stores/mcp'

const props = defineProps<{
  server: McpServer | null
}>()

const toolCount = computed(() => props.server?.tools?.length || 0)
</script>

<template>
  <div v-if="server" class="mb-8">
    <div class="flex flex-wrap items-center gap-3 mb-2">
      <h1 class="min-w-0 break-words text-2xl font-bold text-white">
        {{ server.name }}
      </h1>
      <CheckCircle2 v-if="server.verified" class="h-5 w-5 text-green-500" />
    </div>

    <p class="mb-4 max-w-2xl text-sm text-gray-400">{{ server.description }}</p>

    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400">
      <span class="flex items-center gap-1">
        <Plug class="h-4 w-4" />
        {{ server.transport }}
      </span>
      <span v-if="toolCount > 0" class="flex items-center gap-1">
        <Wrench class="h-4 w-4" />
        {{ toolCount }} tools
      </span>
    </div>

    <div v-if="server.tags?.length" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="tag in server.tags"
        :key="tag"
        class="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
