<script setup lang="ts">
import { computed, reactive, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import {
  isActive,
  siteGroupNav,
  sidebarSections,
  type SidebarSection,
  type SidebarSectionKey,
  type SiteGroup,
} from './sidebarNav'
import { useSidebarCounts } from './useSidebarCounts'
import SidebarNavGroup from './SidebarNavGroup.vue'
import SidebarNavRow from './SidebarNavRow.vue'
import SidebarScrollFades from './SidebarScrollFades.vue'

/**
 * One section's destinations — the view pushed on top of the main menu. Only the sites section has
 * children, and those expand in place behind the measured height disclosure, so the stack never
 * needs a third level.
 */
const props = defineProps<{
  sectionKey: SidebarSectionKey
}>()

const route = useRoute()
const counts = useSidebarCounts()
const scroller = useTemplateRef<HTMLElement>('scroller')

/**
 * Every group starts closed, and nothing re-opens it on navigation: the reader chooses what to
 * expand. The group row still highlights when it holds the current route, so a deep link is never
 * invisible — just collapsed.
 */
const expandedGroups = reactive<Record<SiteGroup, boolean>>(
  Object.fromEntries(siteGroupNav.map((group) => [group.group, false])) as Record<
    SiteGroup,
    boolean
  >,
)

const section = computed<SidebarSection | undefined>(() =>
  sidebarSections.find((entry) => entry.key === props.sectionKey),
)

const groups = computed(() =>
  (section.value?.groups ?? []).map((group) => ({
    id: `sidebar-${group.group}`,
    group: group.group,
    icon: group.icon,
    name: group.name,
    route: group.route,
    count: counts.getSiteGroupCount(group.group),
    active: isActive(group.route, route.path, false),
    expanded: expandedGroups[group.group],
    items: group.items.map((item) => ({
      name: item.name,
      icon: item.icon,
      route: item.route,
      count: counts.getRouteCount(item.route),
      active: isActive(item.route, route.path),
    })),
  })),
)

const items = computed(() =>
  (section.value?.items ?? []).map((item) => ({
    name: item.name,
    icon: item.icon,
    route: item.route,
    count: counts.getRouteCount(item.route),
    active: isActive(item.route, route.path),
  })),
)

function toggleGroup(group: SiteGroup) {
  expandedGroups[group] = !expandedGroups[group]
}
</script>

<template>
  <nav
    class="absolute inset-0 flex flex-col"
    :aria-label="`${section?.name ?? 'Section'} navigation`"
  >
    <!-- Reserve the pinned promo card's height so its tail rows stay reachable (see SidebarFooter). -->
    <div
      ref="scroller"
      class="h-full overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style="padding-bottom: calc(var(--sidebar-promo-height, 0px) + 1.5rem)"
    >
      <div class="flex flex-col gap-px">
        <ul v-if="groups.length" class="flex flex-col gap-px">
          <SidebarNavGroup
            v-for="group in groups"
            :key="group.id"
            :id="group.id"
            :group="group.group"
            :icon="group.icon"
            :name="group.name"
            :route="group.route"
            :count="group.count"
            :active="group.active"
            :expanded="group.expanded"
            :items="group.items"
            @toggle="toggleGroup(group.group)"
          />
        </ul>

        <ul v-else class="flex flex-col gap-px">
          <li v-for="item in items" :key="item.route">
            <SidebarNavRow
              :icon="item.icon"
              :label="item.name"
              :to="item.route"
              :count="item.count"
              :active="item.active"
            />
          </li>
        </ul>
      </div>
    </div>

    <SidebarScrollFades :scroller="scroller" />
  </nav>
</template>
