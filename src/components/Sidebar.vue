<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  shallowRef,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import {
  Bot,
  ChevronRight,
  Code2,
  Download,
  Film,
  Palette,
  Puzzle,
  Search,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'
import { scheduleIdleTask } from '@/lib/idle'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import type { useAdminStore } from '@/stores/admin'
import {
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
  SidebarExpandedGroup,
  useSidebarSearch,
  isSiteGroupRoute,
  type SiteGroup,
} from '@/components/sidebar'

type AdminStore = ReturnType<typeof useAdminStore>

const route = useRoute()
const props = withDefaults(
  defineProps<{
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)
const emit = defineEmits<{
  toggleCollapsed: []
  openSearch: []
}>()

const { isAuthenticated } = useDeferredAuthStatus()
const admin = shallowRef<AdminStore | null>(null)
const sitesStore = useSitesStore()
const skillsStore = useSkillsStore()
const extensionsStore = useExtensionsStore()

void sitesStore.loadSites()
let cancelSkillsLoad: (() => void) | undefined
let cancelAdminLoad: (() => void) | undefined

const isCollapsed = computed(() => props.collapsed)

const expandedGroups = reactive<Record<SiteGroup, boolean>>({
  ai: true,
  design: true,
  development: true,
  watch: true,
  downloads: true,
})

const isExtensionsExpanded = shallowRef(true)

const {
  sidebarSearch,
  hasSidebarSearch,
  clearSidebarSearch,
  visibleAiSubcategories,
  visibleDesignSubcategories,
  visibleDevelopmentSubcategories,
  visibleWatchSubcategories,
  visibleDownloadsSubcategories,
  showAiGroup,
  showDesignGroup,
  showDevelopmentGroup,
  showWatchGroup,
  showDownloadsGroup,
  showSitesSection,
  showSkillsSection,
  showExtensionsSection,
  visibleSkillsNav,
  visibleExtensionCategories,
  visibleCompactSiteGroups,
  totalSkillCount,
  getSiteGroupCount,
  getSiteRouteCount,
  getSkillRouteCount,
  getExtensionRouteCount,
  hasVisibleSidebarTabs,
} = useSidebarSearch()

const toggleGroup = (group: SiteGroup) => {
  expandedGroups[group] = !expandedGroups[group]
}

function toggleExtensions() {
  isExtensionsExpanded.value = !isExtensionsExpanded.value
}

const isActive = (path: string, exact = true) => {
  return exact ? route.path === path : route.path === path || route.path.startsWith(`${path}/`)
}

watch(
  () => route.path,
  (path) => {
    const groups: SiteGroup[] = ['ai', 'design', 'development', 'watch', 'downloads']
    for (const group of groups) {
      if (isSiteGroupRoute(path, group)) {
        expandedGroups[group] = true
      }
    }
  },
  { immediate: true },
)

const isAiExpanded = computed(() => expandedGroups.ai)
const isDesignExpanded = computed(() => expandedGroups.design)
const isDevelopmentExpanded = computed(() => expandedGroups.development)
const isWatchExpanded = computed(() => expandedGroups.watch)
const isDownloadsExpanded = computed(() => expandedGroups.downloads)

const isAiVisibleExpanded = computed(
  () => showAiGroup.value && (isAiExpanded.value || hasSidebarSearch.value),
)
const isDesignVisibleExpanded = computed(
  () => showDesignGroup.value && (isDesignExpanded.value || hasSidebarSearch.value),
)
const isDevelopmentVisibleExpanded = computed(
  () => showDevelopmentGroup.value && (isDevelopmentExpanded.value || hasSidebarSearch.value),
)
const isWatchVisibleExpanded = computed(
  () => showWatchGroup.value && (isWatchExpanded.value || hasSidebarSearch.value),
)
const isDownloadsVisibleExpanded = computed(
  () => showDownloadsGroup.value && (isDownloadsExpanded.value || hasSidebarSearch.value),
)

const isAdmin = computed(() => admin.value?.isAdmin ?? false)
const pendingAdminCount = computed(() => admin.value?.pendingCount ?? 0)

function toggleSidebarCollapsed() {
  emit('toggleCollapsed')
}

function openSearchFromRail() {
  emit('openSearch')
}

watch(
  () => props.collapsed,
  (collapsed) => {
    if (collapsed) {
      clearSidebarSearch()
    }
  },
)

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

onMounted(() => {
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
})

onUnmounted(() => {
  cancelAdminLoad?.()
  cancelSkillsLoad?.()
})
</script>

<template>
  <aside
    class="app-sidebar flex h-full w-full select-none flex-col overflow-visible border-r border-gray-800 bg-[#1f1f1f]"
    :class="{ 'app-sidebar--collapsed': isCollapsed }"
  >
    <!-- Header -->
    <SidebarHeader :collapsed="isCollapsed" :is-authenticated="isAuthenticated" @toggle-collapsed="toggleSidebarCollapsed" />

    <!-- Search bar (expanded only) -->
    <div v-if="!isCollapsed" class="shrink-0 border-b border-gray-800 px-3 py-3">
      <label class="sr-only" for="sidebar-tab-search">Search sidebar tabs</label>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
        />
        <input
          id="sidebar-tab-search"
          v-model="sidebarSearch"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Search tabs"
          class="h-8 w-full rounded-md border border-gray-800 bg-[#1f1f1f] px-8 text-xs font-medium text-white outline-none transition-colors placeholder:text-gray-600 focus:border-gray-600 focus:bg-[#1f1f1f]"
          @keydown.esc="clearSidebarSearch"
        />
        <button
          v-if="hasSidebarSearch"
          type="button"
          class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-500 transition-colors hover:bg-[#1f1f1f] hover:text-white"
          aria-label="Clear sidebar search"
          @click="clearSidebarSearch"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Collapsed rail view -->
    <SidebarRail
      v-if="isCollapsed"
      :groups="visibleCompactSiteGroups"
      :is-active="isActive"
      :get-group-count="getSiteGroupCount"
      :get-item-count="getSiteRouteCount"
      :show-extensions-section="showExtensionsSection"
      :show-skills-section="showSkillsSection"
      :extension-categories="visibleExtensionCategories"
      :skills-nav="visibleSkillsNav"
      :total-skill-count="totalSkillCount"
      @open-search="openSearchFromRail"
    />

    <!-- Expanded tree view -->
    <nav v-else class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
      <ul class="space-y-0.5 px-4">
        <template v-if="showSitesSection">
          <SidebarExpandedGroup
            :icon="Bot"
            name="AI"
            route="/sites/ai"
            group="ai"
            :is-expanded="isAiVisibleExpanded"
            :is-group-active="isActive('/sites/ai', false)"
            :visible-items="visibleAiSubcategories"
            :show-group="showAiGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('ai')"
          />

          <SidebarExpandedGroup
            :icon="Palette"
            name="Design"
            route="/sites/design"
            group="design"
            :is-expanded="isDesignVisibleExpanded"
            :is-group-active="isActive('/sites/design', false)"
            :visible-items="visibleDesignSubcategories"
            :show-group="showDesignGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('design')"
          />

          <SidebarExpandedGroup
            :icon="Code2"
            name="Development"
            route="/sites/development"
            group="development"
            :is-expanded="isDevelopmentVisibleExpanded"
            :is-group-active="isActive('/sites/development', false)"
            :visible-items="visibleDevelopmentSubcategories"
            :show-group="showDevelopmentGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('development')"
          />

          <SidebarExpandedGroup
            :icon="Film"
            name="Watch"
            route="/sites/watch"
            group="watch"
            :is-expanded="isWatchVisibleExpanded"
            :is-group-active="isActive('/sites/watch', false)"
            :visible-items="visibleWatchSubcategories"
            :show-group="showWatchGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('watch')"
          />

          <SidebarExpandedGroup
            :icon="Download"
            name="Downloads"
            route="/sites/downloads"
            group="downloads"
            :is-expanded="isDownloadsVisibleExpanded"
            :is-group-active="isActive('/sites/downloads', false)"
            :visible-items="visibleDownloadsSubcategories"
            :show-group="showDownloadsGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('downloads')"
          />
        </template>

        <!-- Extensions section -->
        <li v-if="showExtensionsSection" :class="{ 'mt-6': showSitesSection }">
          <button
            type="button"
            class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
            :class="
              isActive('/extensions', false)
                ? 'bg-[#1f1f1f] text-white'
                : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
            "
            :aria-expanded="isExtensionsExpanded"
            aria-controls="sidebar-extensions-branch"
            aria-label="Toggle extensions"
            @click="toggleExtensions"
          >
            <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
              <Puzzle class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="min-w-0 flex-1 truncate font-semibold uppercase tracking-wider"
                >Extensions</span
              >
            </span>
            <ChevronRight
              class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
              :class="{ 'rotate-90': isExtensionsExpanded }"
            />
          </button>

          <Transition name="sidebar-group">
            <li
              v-if="isExtensionsExpanded && visibleExtensionCategories.length > 0"
              id="sidebar-extensions-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleExtensionCategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-[#1f1f1f] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                    "
                  >
                    <div
                      v-if="isActive(item.route)"
                      class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                    ></div>
                    <component :is="item.icon" class="w-3.5 h-3.5" />
                    <span class="min-w-0 flex-1 truncate font-medium">{{ item.name }}</span>
                    <span
                      class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                      :class="
                        isActive(item.route)
                          ? 'text-zinc-300'
                          : 'text-gray-600 group-hover:text-gray-300'
                      "
                    >
                      {{ getExtensionRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>
        </li>

        <!-- Skills section -->
        <li v-if="showSkillsSection" :class="{ 'mt-6': showSitesSection || showExtensionsSection }">
          <div class="w-full flex items-center gap-3 text-gray-500 py-2">
            <Sparkles class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider">Skills</span>
          </div>

          <ul class="ml-4 space-y-0.5">
            <li v-for="item in visibleSkillsNav" :key="item.name">
              <RouterLink
                :to="item.route"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive(item.route)
                    ? 'bg-[#1f1f1f] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive(item.route)"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <component :is="item.icon" class="w-3.5 h-3.5" />
                <span class="min-w-0 flex-1 truncate font-medium">{{ item.name }}</span>
                <span
                  class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive(item.route)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSkillRouteCount(item.route) }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <!-- Empty state -->
        <li v-if="!hasVisibleSidebarTabs" class="px-2 py-6 text-center">
          <p class="text-xs font-medium text-gray-500">No tabs match "{{ sidebarSearch }}".</p>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <SidebarFooter
      :collapsed="isCollapsed"
      :is-active="isActive"
      :is-admin="isAdmin"
      :pending-admin-count="pendingAdminCount"
    />
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f1f1f;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

.sidebar-group-shell {
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
}

.sidebar-group-inner {
  min-height: 0;
  overflow: hidden;
}

.sidebar-group-enter-active,
.sidebar-group-leave-active {
  transition:
    grid-template-rows 180ms ease,
    opacity 160ms ease,
    transform 180ms ease;
}

.sidebar-group-enter-from,
.sidebar-group-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-4px);
}

.sidebar-group-enter-to,
.sidebar-group-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-group-enter-active,
  .sidebar-group-leave-active {
    transition: none;
  }
}
</style>
