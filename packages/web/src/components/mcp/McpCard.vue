<script setup lang="ts">
import { computed } from 'vue'
import { Plug, Wrench } from 'lucide-vue-next'
import type { McpServer } from '@/stores/mcp'

const props = defineProps<{
  server: McpServer
}>()

const toolCount = computed(() => props.server.tools?.length || 0)

const transportColor: Record<string, string> = {
  stdio: 'text-green-400',
  http: 'text-blue-400',
  websocket: 'text-purple-400',
}
</script>

<template>
  <RouterLink
    :to="`/mcp/${server.slug}`"
    class="group relative block rounded-xl border border-gray-800 bg-[#1f1f1f] p-4 transition-all hover:border-gray-700"
  >
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <h3
          class="truncate text-sm font-semibold text-white transition-colors group-hover:text-accent-400"
        >
          {{ server.name }}
        </h3>
        <p class="mt-1 line-clamp-2 text-xs text-gray-400">
          {{ server.description }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span class="flex items-center gap-1" :class="transportColor[server.transport] || ''">
            <Plug class="h-3.5 w-3.5" />
            {{ server.transport }}
          </span>
          <span v-if="toolCount > 0" class="flex items-center gap-1">
            <Wrench class="h-3.5 w-3.5" />
            {{ toolCount }} tool{{ toolCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="server.tags?.length" class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="tag in server.tags.slice(0, 3)"
            :key="tag"
            class="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-500"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
