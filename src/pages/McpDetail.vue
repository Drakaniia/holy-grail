<script setup lang="ts">
import { computed, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Code2,
  Wrench,
  X,
} from 'lucide-vue-next'
import { useMcpStore } from '@/stores/mcp'
import McpHero from '@/components/mcp/McpHero.vue'

const route = useRoute()
const router = useRouter()
const store = useMcpStore()
void store.loadServers()

const slug = computed(() => route.params.slug as string)
const server = computed(() => store.getServerBySlug(slug.value))

watchEffect(() => {
  if (server.value) {
    document.title = `${server.value.name} | Holy Grail`
  } else {
    document.title = 'Holy Grail'
  }
})

onUnmounted(() => {
  document.title = 'Holy Grail'
})

const backRoute = computed(() => {
  if (!server.value) return '/mcp'
  return `/mcp/${server.value.parentCategory}`
})

const hasDistinctDocs = computed(() =>
  Boolean(server.value?.docs && server.value.docs !== server.value.website),
)
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <div v-if="server" class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      <!-- Back + Close -->
      <div class="mb-5 flex items-center justify-between">
        <button
          type="button"
          class="inline-flex w-fit items-center gap-2 text-gray-400 transition-colors hover:text-white"
          @click="router.push(backRoute)"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="text-sm">Back</span>
        </button>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-[#1f1f1f] text-gray-400 transition-colors hover:border-gray-700 hover:text-white"
          aria-label="Close"
          @click="router.push(backRoute)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Hero -->
      <McpHero :server="server" />

      <!-- Install Command -->
      <div v-if="server.installCommand" class="mb-6 rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
        <h3 class="mb-2 text-sm font-medium text-gray-400">Install</h3>
        <pre class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-gray-300">{{ server.installCommand }}</pre>
      </div>

      <!-- Tools -->
      <div v-if="server.tools?.length" class="mb-6">
        <h3 class="mb-3 text-base font-semibold text-white">Tools</h3>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            v-for="tool in server.tools"
            :key="tool.name"
            class="flex items-start gap-3 rounded-lg border border-gray-800 p-4"
          >
            <Wrench class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <div>
              <h4 class="text-sm font-medium text-white">{{ tool.name }}</h4>
              <p class="text-xs text-gray-500">{{ tool.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Connections -->
      <div v-if="server.connections?.length" class="mb-6">
        <h3 class="mb-3 text-base font-semibold text-white">Connections</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="conn in server.connections"
            :key="conn"
            class="rounded-md bg-gray-800 px-3 py-1 text-xs text-gray-400"
          >
            {{ conn }}
          </span>
        </div>
      </div>

      <!-- Links -->
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <a
          :href="server.website"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
        >
          <Globe class="h-4 w-4 text-gray-500" />
          Website
        </a>
        <a
          v-if="hasDistinctDocs"
          :href="server.docs"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
        >
          <ExternalLink class="h-4 w-4 text-gray-500" />
          Docs
        </a>
        <a
          v-if="server.sourceCode"
          :href="server.sourceCode"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
        >
          <Code2 class="h-4 w-4 text-gray-500" />
          Source Code
        </a>
      </div>
    </div>

    <div v-else-if="store.loading" class="mx-auto max-w-6xl px-4 py-24">
      <div class="h-96 animate-pulse rounded-xl border border-gray-800 bg-[#1f1f1f]" />
    </div>

    <div v-else-if="store.loadError" class="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 class="mb-2 text-2xl font-bold text-white">Could not load MCP servers</h2>
      <p class="mb-6 text-gray-400">{{ store.loadError }}</p>
      <button
        @click="router.push('/mcp')"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Browse MCP Servers
      </button>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="mb-2 text-2xl font-bold text-white">Server not found</h2>
      <p class="mb-6 text-gray-400">The MCP server you're looking for doesn't exist.</p>
      <button
        @click="router.push('/mcp')"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Browse MCP Servers
      </button>
    </div>
  </div>
</template>
