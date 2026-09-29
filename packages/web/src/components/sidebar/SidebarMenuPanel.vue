<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { sidebarMainMenuGroups, sidebarMainMenuItems, type SidebarSectionKey } from './sidebarNav'
import SidebarNavRow from './SidebarNavRow.vue'
import SidebarScrollFades from './SidebarScrollFades.vue'

/**
 * The root of the sidebar stack: Home, the four catalog sections and the two personal destinations,
 * under 21st's "Explore / Build" headers. A section row navigates *and* pushes the section view, so
 * the column behaves like the reference's `Explore › Components` drill-down.
 */
const emit = defineEmits<{
  select: [section: SidebarSectionKey]
}>()

const route = useRoute()
const scroller = useTemplateRef<HTMLElement>('scroller')

const groupedItems = computed(() =>
  sidebarMainMenuGroups.map((group) => ({
    ...group,
    items: sidebarMainMenuItems.filter((item) => item.group === group.key),
  })),
)
</script>

<template>
  <nav class="absolute inset-0 flex flex-col" aria-label="Main menu">
    <!-- `--sidebar-promo-height` is the pinned promo card's measured height (see SidebarFooter):
         reserving it keeps the last rows scrollable into view instead of parked under the card. -->
    <div
      ref="scroller"
      class="h-full overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style="padding-bottom: calc(var(--sidebar-promo-height, 0px) + 1.5rem)"
    >
      <div class="flex flex-col gap-px">
        <template v-for="group in groupedItems" :key="group.key">
          <h3
            v-if="group.name"
            class="flex h-7 items-center px-2 pt-2.5 pb-0.5 text-xs font-medium whitespace-nowrap text-sidebar-muted-foreground"
          >
            {{ group.name }}
          </h3>

          <ul class="flex flex-col gap-px">
            <li v-for="item in group.items" :key="item.route">
              <SidebarNavRow
                :icon="item.icon"
                :label="item.name"
                :to="item.route"
                :active="item.isActive(route.path)"
                @press="item.section && emit('select', item.section)"
              />
            </li>
          </ul>
        </template>
      </div>
    </div>

    <SidebarScrollFades :scroller="scroller" />
  </nav>
</template>
