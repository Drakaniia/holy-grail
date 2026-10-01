<script setup lang="ts">
interface Tab {
  id: string
  label: string
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'preview', label: 'Preview' },
  { id: 'usage', label: 'Usage' },
  { id: 'installation', label: 'Installation Method' },
  { id: 'skillmd', label: 'SKILL.md' },
  { id: 'resources', label: 'Resources' },
  { id: 'related', label: 'Related Skills' },
]

defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  'update:activeTab': [tabId: string]
}>()

function selectTab(tab: Tab) {
  emit('update:activeTab', tab.id)
}
</script>

<template>
  <div role="tablist" aria-label="Skill detail sections" class="flex border-b border-gray-800">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      :aria-selected="activeTab === tab.id ? 'true' : 'false'"
      @click="selectTab(tab)"
      class="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-200"
      :class="activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
    >
      {{ tab.label }}
      <!-- Active indicator -->
      <span v-if="activeTab === tab.id" class="absolute inset-x-0 bottom-0 h-0.5 bg-accent-500" />
    </button>
  </div>
</template>
