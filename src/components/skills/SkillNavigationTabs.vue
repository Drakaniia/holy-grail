<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

export interface Tab {
  id: string
  label: string
  enabled: boolean
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', enabled: true },
  { id: 'preview', label: 'Preview', enabled: true },
  { id: 'usage', label: 'Usage', enabled: true },
  { id: 'installation', label: 'Installation Method', enabled: true },
  { id: 'skillmd', label: 'SKILL.md', enabled: true },
  { id: 'resources', label: 'Resources', enabled: true },
  { id: 'related', label: 'Related Skills', enabled: true },
  { id: 'history', label: 'Version History', enabled: false },
]

defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  'update:activeTab': [tabId: string]
}>()

function selectTab(tab: Tab) {
  if (tab.enabled) {
    emit('update:activeTab', tab.id)
  }
}
</script>

<template>
  <div role="tablist" aria-label="Skill detail sections" class="flex border-b border-gray-800">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :role="tab.enabled ? 'tab' : 'presentation'"
      :aria-selected="activeTab === tab.id ? 'true' : 'false'"
      :aria-disabled="!tab.enabled"
      :disabled="!tab.enabled"
      @click="selectTab(tab)"
      class="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-200"
      :class="[
        activeTab === tab.id
          ? 'text-white'
          : tab.enabled
            ? 'text-gray-500 hover:text-gray-300'
            : 'cursor-not-allowed text-gray-700',
      ]"
    >
      {{ tab.label }}
      <AlertCircle v-if="!tab.enabled" class="h-3.5 w-3.5" />
      <!-- Active indicator -->
      <span
        v-if="activeTab === tab.id"
        class="absolute inset-x-0 bottom-0 h-0.5 bg-accent-500 transition-all duration-200"
      />
    </button>
  </div>
</template>
