<script setup lang="ts">
import { computed, nextTick, shallowRef } from 'vue'
import { FileCode2, Info } from 'lucide-vue-next'
import DocsCodeBlock from '@/components/docs/DocsCodeBlock.vue'
import type { McpClientConfig } from './mcpServerTools'

/**
 * WAI-ARIA tabs with automatic activation: one tab stop for the whole strip (roving tabindex),
 * arrows move between clients, Home/End jump to the ends.
 */
const props = defineProps<{
  clients: McpClientConfig[]
}>()

const activeId = shallowRef(props.clients[0]?.id ?? '')

const activeClient = computed(
  () => props.clients.find((client) => client.id === activeId.value) ?? props.clients[0],
)

function tabId(id: string) {
  return `mcp-client-tab-${id}`
}

function panelId(id: string) {
  return `mcp-client-panel-${id}`
}

function selectIndex(index: number) {
  const client = props.clients[index]
  if (!client) return

  activeId.value = client.id
  // Looked up by id: refs collected inside v-for are not guaranteed to follow source order.
  void nextTick(() => document.getElementById(tabId(client.id))?.focus())
}

function handleKeydown(event: KeyboardEvent, index: number) {
  const last = props.clients.length - 1
  const targets: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }

  const next = targets[event.key]
  if (next === undefined) return

  event.preventDefault()
  selectIndex(next)
}
</script>

<template>
  <div>
    <div
      role="tablist"
      aria-label="MCP client"
      class="flex overflow-x-auto border-b border-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="(client, index) in clients"
        :id="tabId(client.id)"
        :key="client.id"
        type="button"
        role="tab"
        :aria-selected="activeId === client.id ? 'true' : 'false'"
        :aria-controls="panelId(client.id)"
        :tabindex="activeId === client.id ? 0 : -1"
        class="relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500"
        :class="activeId === client.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
        @click="selectIndex(index)"
        @keydown="handleKeydown($event, index)"
      >
        {{ client.label }}
        <span
          v-if="activeId === client.id"
          class="absolute inset-x-0 bottom-0 h-0.5 bg-accent-500"
          aria-hidden="true"
        />
      </button>
    </div>

    <div
      v-if="activeClient"
      :id="panelId(activeClient.id)"
      role="tabpanel"
      :aria-labelledby="tabId(activeClient.id)"
      tabindex="0"
      class="pt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
    >
      <p class="flex items-center gap-2 text-xs text-gray-500">
        <FileCode2 class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <code class="font-mono text-gray-400">{{ activeClient.location }}</code>
      </p>

      <DocsCodeBlock
        v-if="activeClient.hosted"
        :label="activeClient.hosted.label"
        :code="activeClient.hosted.code"
        :copy-label="`Copy ${activeClient.label} hosted config`"
      />
      <DocsCodeBlock
        :label="activeClient.local.label"
        :code="activeClient.local.code"
        :copy-label="`Copy ${activeClient.label} local config`"
      />

      <p v-if="activeClient.note" class="flex items-start gap-2 text-xs text-gray-500">
        <Info class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{{ activeClient.note }}</span>
      </p>
    </div>
  </div>
</template>
