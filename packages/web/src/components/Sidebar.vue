<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'
import { scheduleIdleTask } from '@/lib/idle'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import { useMcpStore } from '@/stores/mcp'
import type { useAdminStore } from '@/stores/admin'
import SidebarHeader from './sidebar/SidebarHeader.vue'
import SidebarMenuPanel from './sidebar/SidebarMenuPanel.vue'
import SidebarSectionPanel from './sidebar/SidebarSectionPanel.vue'
import SidebarSearchPanel from './sidebar/SidebarSearchPanel.vue'
import SidebarFooter from './sidebar/SidebarFooter.vue'
import { useSidebarSearch } from './sidebar/useSidebarSearch'
import { sidebarSections, type SidebarSectionKey } from './sidebar/sidebarNav'

type AdminStore = ReturnType<typeof useAdminStore>

interface SidebarHeaderExposed {
  isFocused: boolean
  focusSearch: () => void
  blurSearch: () => void
}

/** The three views the column can show. The stack is flat on purpose: one push, one pop. */
type SidebarView = 'menu' | 'section' | 'search'

const route = useRoute()
const props = withDefaults(
  defineProps<{
    /** The shell has retracted the column: keep it mounted (scroll survives) but inert. */
    collapsed?: boolean
    /** Docked in the layout (desktop) vs. rendered inside the mobile drawer. */
    collapsible?: boolean
  }>(),
  {
    collapsed: false,
    collapsible: true,
  },
)

const emit = defineEmits<{
  collapse: []
}>()

const { isAuthenticated } = useDeferredAuthStatus()
const admin = shallowRef<AdminStore | null>(null)
const sitesStore = useSitesStore()
const skillsStore = useSkillsStore()
const extensionsStore = useExtensionsStore()
const mcpStore = useMcpStore()

const headerRef = useTemplateRef<SidebarHeaderExposed>('headerRef')

const view = shallowRef<SidebarView>('menu')
/** Which way the last transition moved, so the panels slide the way the reader expects. */
const direction = shallowRef<'forward' | 'back'>('forward')
const activeSection = shallowRef<SidebarSectionKey>('sites')
/** Where `Esc` should land: search sits on top of whichever view it interrupted. */
const viewBeforeSearch = shallowRef<'menu' | 'section'>('menu')

const {
  query,
  scope,
  sort,
  hasQuery,
  resultCount,
  resultGroups,
  scopeOptions,
  sortOptions,
  clearSearch,
} = useSidebarSearch()

const isSearchMode = computed(() => (headerRef.value?.isFocused ?? false) || hasQuery.value)

const viewTitle = computed(
  () => sidebarSections.find((section) => section.key === activeSection.value)?.name ?? 'Browse',
)

const canGoBack = computed(() => view.value !== 'menu' && view.value !== 'search')

/**
 * One rule drives every panel: 0 is the live view, and an off-stack view sits one step to the left
 * when we pushed forward into it, or to the right when we are on the way back out.
 */
function panelOffset(name: SidebarView) {
  if (view.value === name) return 0

  return direction.value === 'forward' ? -1 : 1
}

function panelClass(name: SidebarView) {
  const offset = panelOffset(name)
  if (offset === 0) return 'translate-x-0 opacity-100 blur-0'

  return `pointer-events-none ${offset < 0 ? '-translate-x-2' : 'translate-x-2'} opacity-0 blur-[2px]`
}

function panelHidden(name: SidebarView) {
  return panelOffset(name) !== 0
}

function openSection(section: SidebarSectionKey) {
  activeSection.value = section
  direction.value = 'forward'
  view.value = 'section'
}

function backToMenu() {
  direction.value = 'back'
  view.value = 'menu'
}

const isAdmin = computed(() => admin.value?.isAdmin ?? false)
const pendingAdminCount = computed(() => admin.value?.pendingCount ?? 0)

void sitesStore.loadSites()
let cancelSkillsLoad: (() => void) | undefined
let cancelAdminLoad: (() => void) | undefined

function handleShortcut(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

  const target = event.target instanceof HTMLElement ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

  event.preventDefault()
  headerRef.value?.focusSearch()
}

function handleSearchClear() {
  clearSearch()
  headerRef.value?.blurSearch()
}

function loadSkillsCounts() {
  void skillsStore.loadSkills()
}

async function loadAdminStore() {
  if (!isAuthenticated.value || admin.value) return

  const { useAdminStore } = await import('@/stores/admin')
  const adminStore = useAdminStore()
  admin.value = adminStore

  if (adminStore.isAdmin) {
    void adminStore.loadSubmissions('pending')
  }
}

watch(
  () => route.path,
  (path) => {
    if (!path.startsWith('/skills')) return

    cancelSkillsLoad?.()
    loadSkillsCounts()
  },
)

watch(isAuthenticated, (authenticated) => {
  cancelAdminLoad?.()

  if (!authenticated) {
    admin.value = null
    return
  }

  cancelAdminLoad = scheduleIdleTask(
    () => {
      void loadAdminStore()
    },
    {
      delay: 1500,
      timeout: 5000,
    },
  )
})

watch(
  () => props.collapsed,
  (collapsed) => {
    if (collapsed) {
      handleSearchClear()
    }
  },
)

// Search rides the same stack, so entering it slides forward and `Esc` slides back to where it was.
watch(isSearchMode, (searching) => {
  if (searching) {
    if (view.value === 'search') return

    viewBeforeSearch.value = view.value === 'section' ? 'section' : 'menu'
    direction.value = 'forward'
    view.value = 'search'
    return
  }

  if (view.value !== 'search') return

  direction.value = 'back'
  view.value = viewBeforeSearch.value
})

onMounted(() => {
  window.addEventListener('keydown', handleShortcut)

  if (route.path.startsWith('/skills')) {
    loadSkillsCounts()
  } else {
    cancelSkillsLoad = scheduleIdleTask(loadSkillsCounts, {
      delay: 5000,
      timeout: 9000,
    })
  }

  if (route.path.startsWith('/extensions')) {
    void extensionsStore.loadExtensions()
  } else {
    void scheduleIdleTask(() => extensionsStore.loadExtensions(), {
      delay: 6000,
      timeout: 10000,
    })
  }

  if (route.path.startsWith('/mcp')) {
    void mcpStore.loadServers()
  } else {
    void scheduleIdleTask(() => mcpStore.loadServers(), {
      delay: 7000,
      timeout: 11000,
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleShortcut)
  cancelAdminLoad?.()
  cancelSkillsLoad?.()
})
</script>

<template>
  <aside
    class="app-sidebar group/sidebar flex h-full w-full min-w-0 flex-col select-none bg-sidebar"
    :class="{ 'app-sidebar--docked': props.collapsible }"
    :inert="props.collapsed ? true : undefined"
    :aria-hidden="props.collapsed ? true : undefined"
    data-sidebar="content"
  >
    <SidebarHeader
      ref="headerRef"
      v-model:query="query"
      :title="viewTitle"
      :search-mode="isSearchMode"
      :collapsible="props.collapsible"
      :is-authenticated="isAuthenticated"
      :can-go-back="canGoBack"
      @back="backToMenu"
      @collapse="emit('collapse')"
      @clear="handleSearchClear"
    />

    <!--
      The view stack. Three stacked absolute panels, one transition rule: the live view sits at
      translate-x-0, an off-stack view sits one step left when we pushed into it and one step right
      when we are on the way back. Off-stack panels stay mounted but inert, so each keeps its scroll.
    -->
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div
        class="absolute inset-0 transition-[translate,opacity,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        :class="panelClass('menu')"
        :inert="panelHidden('menu') ? true : undefined"
        :aria-hidden="panelHidden('menu') ? true : undefined"
      >
        <SidebarMenuPanel @select="openSection" />
      </div>

      <div
        class="absolute inset-0 transition-[translate,opacity,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        :class="panelClass('section')"
        :inert="panelHidden('section') ? true : undefined"
        :aria-hidden="panelHidden('section') ? true : undefined"
      >
        <SidebarSectionPanel :key="activeSection" :section-key="activeSection" />
      </div>

      <div
        class="absolute inset-0 transition-[translate,opacity,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        :class="panelClass('search')"
        :inert="panelHidden('search') ? true : undefined"
        :aria-hidden="panelHidden('search') ? true : undefined"
      >
        <SidebarSearchPanel
          :query="query"
          :scope="scope"
          :sort="sort"
          :result-groups="resultGroups"
          :result-count="resultCount"
          :has-query="hasQuery"
          :scope-options="scopeOptions"
          :sort-options="sortOptions"
          @update:scope="scope = $event"
          @update:sort="sort = $event"
        />
      </div>
    </div>

    <SidebarFooter :is-admin="isAdmin" :pending-admin-count="pendingAdminCount" />
  </aside>
</template>

<style scoped>
.app-sidebar--docked {
  /* Half-pixel hairline: at 1x DPR this reads as a seam, not a divider. */
  border-right: 0.5px solid var(--color-sidebar-border);
}

@media (prefers-reduced-motion: reduce) {
  .app-sidebar :deep(*) {
    scroll-behavior: auto;
  }
}
</style>
