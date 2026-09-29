<script setup lang="ts">
import type { Component } from 'vue'
import SidebarDisclosure from './SidebarDisclosure.vue'
import SidebarNavRow from './SidebarNavRow.vue'

export interface SidebarNavGroupItemView {
  name: string
  icon: Component
  route: string
  count: number
  active: boolean
}

const props = defineProps<{
  id: string
  group: string
  icon: Component
  name: string
  route: string
  count: number
  active: boolean
  expanded: boolean
  items: SidebarNavGroupItemView[]
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <li>
    <SidebarNavRow
      :button-id="`${props.id}-button`"
      :icon="props.icon"
      :label="props.name"
      :count="props.count"
      :active="props.active"
      expandable
      :expanded="props.expanded"
      :controls="`${props.id}-region`"
      :aria-label="`Toggle ${props.name}`"
      @press="emit('toggle')"
    />

    <SidebarDisclosure
      :id="`${props.id}-region`"
      :open="props.expanded"
      :labelledby="`${props.id}-button`"
    >
      <ul class="ml-3 flex flex-col gap-px pb-1">
        <li v-for="item in props.items" :key="item.route">
          <SidebarNavRow
            :icon="item.icon"
            :label="item.name"
            :to="item.route"
            :count="item.count"
            :active="item.active"
          />
        </li>
      </ul>
    </SidebarDisclosure>
  </li>
</template>
