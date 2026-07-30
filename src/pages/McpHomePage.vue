<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMcpStore } from '@/stores/mcp'
import McpCard from '@/components/mcp/McpCard.vue'

const route = useRoute()
const store = useMcpStore()

onMounted(() => {
  void store.loadServers()
})

const parentCategory = computed(() => route.params.category as string)

const pageTitle = computed(() => {
  const labels: Record<string, string> = {
    development: 'Development',
    database: 'Database',
    ai: 'AI',
    cloud: 'Cloud',
  }
  return labels[parentCategory.value] || parentCategory.value
})

const servers = computed(() => {
  return store.getServersByParentCategory(parentCategory.value)
})
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <div class="border-b border-gray-800">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <p class="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500">MCP Servers</p>
        <h1 class="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          {{ pageTitle }}
        </h1>
        <p class="max-w-2xl text-base leading-relaxed text-gray-400">
          Model Context Protocol servers that connect AI agents to tools and data sources.
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div
        v-if="store.loading && servers.length === 0"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-32 animate-pulse rounded-xl border border-gray-800 bg-[#1f1f1f]"
        />
      </div>

      <div
        v-else-if="store.loadError"
        class="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-100"
      >
        {{ store.loadError }}
      </div>

      <div
        v-else-if="servers.length > 0"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <McpCard v-for="server in servers" :key="server.slug" :server="server" />
      </div>

      <div v-else class="py-16 text-center">
        <p class="text-lg text-gray-500">No MCP servers found in this category.</p>
      </div>
    </div>
  </div>
</template>
