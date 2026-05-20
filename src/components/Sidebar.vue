<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  ChevronRight,
  Code2,
  Component as ComponentIcon,
  FileText,
  Globe,
  GraduationCap,
  Github,
  Hammer,
  Image,
  Lightbulb,
  MessageSquare,
  Microscope,
  Package,
  Palette,
  Plug,
  Presentation,
  ScanSearch,
  Send,
  Server,
  Shapes,
  ShieldCheck,
  Sparkles,
  Terminal,
  Type,
  Video,
  Workflow,
  Wrench,
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const admin = useAdminStore()

type SiteGroup = 'ai' | 'design' | 'development'

const expandedGroups = reactive<Record<SiteGroup, boolean>>({
  ai: true,
  design: true,
  development: true,
})

const isSiteGroupRoute = (path: string, group: SiteGroup) => {
  return path === `/sites/${group}` || path.startsWith(`/sites/${group}/`)
}

const toggleGroup = (group: SiteGroup) => {
  expandedGroups[group] = !expandedGroups[group]
}

const isActive = (path: string, exact = true) => {
  return exact ? route.path === path : route.path === path || route.path.startsWith(`${path}/`)
}

watch(
  () => route.path,
  (path) => {
    if (isSiteGroupRoute(path, 'ai')) {
      expandedGroups.ai = true
    }

    if (isSiteGroupRoute(path, 'design')) {
      expandedGroups.design = true
    }

    if (isSiteGroupRoute(path, 'development')) {
      expandedGroups.development = true
    }
  },
  { immediate: true },
)

const isAiExpanded = computed(() => expandedGroups.ai)
const isDesignExpanded = computed(() => expandedGroups.design)
const isDevelopmentExpanded = computed(() => expandedGroups.development)

const sitesNav = [{ name: 'Platforms', icon: Server, route: '/sites/platforms' }]

const aiSubcategories = [
  { name: 'Image', icon: Image, route: '/sites/ai/image' },
  { name: 'API', icon: Plug, route: '/sites/ai/api' },
  { name: 'Detector', icon: ScanSearch, route: '/sites/ai/detector' },
  { name: 'Automation', icon: Workflow, route: '/sites/ai/automation' },
  { name: 'Video', icon: Video, route: '/sites/ai/video' },
  { name: 'CHAT', icon: MessageSquare, route: '/sites/ai/chat' },
  { name: 'WB', icon: Hammer, route: '/sites/ai/wb' },
  { name: 'Research', icon: Microscope, route: '/sites/ai/research' },
  { name: 'PPT', icon: Presentation, route: '/sites/ai/ppt' },
  { name: 'Others', icon: Package, route: '/sites/ai/others' },
]

const designSubcategories = [
  { name: 'Inspiration', icon: Lightbulb, route: '/sites/design/inspiration' },
  { name: 'Fonts', icon: Type, route: '/sites/design/fonts' },
  { name: '3D', icon: Box, route: '/sites/design/3d' },
  { name: 'Prompts', icon: FileText, route: '/sites/design/prompts' },
  { name: 'ICONS/SVG', icon: Shapes, route: '/sites/design/icons-svg' },
  { name: 'MD', icon: BookOpen, route: '/sites/design/md' },
  { name: 'Design Tools', icon: Wrench, route: '/sites/design/design-tools' },
]

const developmentSubcategories = [
  { name: 'Learning', icon: GraduationCap, route: '/sites/development/learning' },
  { name: 'References', icon: BookOpen, route: '/sites/development/references' },
  { name: 'Tooling', icon: Wrench, route: '/sites/development/tooling' },
  { name: 'Repositories', icon: Github, route: '/sites/development/repositories' },
  { name: 'MCP', icon: Plug, route: '/sites/development/mcp' },
  { name: 'Monitoring', icon: Activity, route: '/sites/development/monitoring' },
]

const skillsNav = [
  { name: 'Skills', icon: Sparkles, route: '/skills/skills' },
  { name: 'Design', icon: Palette, route: '/skills/design' },
]
</script>

<template>
  <aside class="flex h-full w-64 select-none flex-col overflow-hidden border-r border-gray-800 bg-black">
    <div class="flex h-12 shrink-0 items-center gap-2 border-b border-gray-800 px-4">
      <RouterLink to="/sites/platforms" class="flex items-center gap-2">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
          />
        </svg>
        <span class="font-bold text-sm tracking-tight text-white uppercase">Holy Grail</span>
      </RouterLink>
    </div>

    <nav class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
      <ul class="space-y-0.5 px-4">
        <li>
          <div class="w-full flex items-center gap-3 text-gray-500 py-2">
            <Globe class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider">Sites</span>
          </div>

          <ul class="ml-4 space-y-0.5">
            <li v-for="item in sitesNav" :key="item.name">
              <RouterLink
                :to="item.route"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive(item.route)
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive(item.route)"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <component :is="item.icon" class="w-3.5 h-3.5" />
                <span class="font-medium">{{ item.name }}</span>
              </RouterLink>
            </li>

            <li>
              <button
                type="button"
                class="w-full flex items-center rounded-md transition-colors group text-xs"
                :class="
                  isActive('/sites/ai', false)
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
                :aria-expanded="isAiExpanded"
                aria-controls="sidebar-ai-branch"
                aria-label="Toggle AI sites"
                @click="toggleGroup('ai')"
              >
                <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                  <Bot class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="font-medium">AI</span>
                </span>
                <ChevronRight
                  class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                  :class="{ 'rotate-90': isAiExpanded }"
                />
              </button>
            </li>

            <Transition name="sidebar-group">
              <li v-if="isAiExpanded" id="sidebar-ai-branch" class="sidebar-group-shell">
                <ul class="sidebar-group-inner ml-4 space-y-0.5">
                  <li v-for="item in aiSubcategories" :key="item.name">
                    <RouterLink
                      :to="item.route"
                      class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                      :class="
                        isActive(item.route)
                          ? 'bg-zinc-900 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                      "
                    >
                      <div
                        v-if="isActive(item.route)"
                        class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                      ></div>
                      <component :is="item.icon" class="w-3.5 h-3.5" />
                      <span class="font-medium">{{ item.name }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </li>
            </Transition>

            <li>
              <button
                type="button"
                class="w-full flex items-center rounded-md transition-colors group text-xs"
                :class="
                  isActive('/sites/design', false)
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
                :aria-expanded="isDesignExpanded"
                aria-controls="sidebar-design-branch"
                aria-label="Toggle design sites"
                @click="toggleGroup('design')"
              >
                <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                  <Palette class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="font-medium">Design</span>
                </span>
                <ChevronRight
                  class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                  :class="{ 'rotate-90': isDesignExpanded }"
                />
              </button>
            </li>

            <Transition name="sidebar-group">
              <li v-if="isDesignExpanded" id="sidebar-design-branch" class="sidebar-group-shell">
                <ul class="sidebar-group-inner ml-4 space-y-0.5">
                  <li v-for="item in designSubcategories" :key="item.name">
                    <RouterLink
                      :to="item.route"
                      class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                      :class="
                        isActive(item.route)
                          ? 'bg-zinc-900 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                      "
                    >
                      <div
                        v-if="isActive(item.route)"
                        class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                      ></div>
                      <component :is="item.icon" class="w-3.5 h-3.5" />
                      <span class="font-medium">{{ item.name }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </li>
            </Transition>

            <li>
              <button
                type="button"
                class="w-full flex items-center rounded-md transition-colors group text-xs"
                :class="
                  isActive('/sites/development', false)
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
                :aria-expanded="isDevelopmentExpanded"
                aria-controls="sidebar-development-branch"
                aria-label="Toggle development sites"
                @click="toggleGroup('development')"
              >
                <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                  <Code2 class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="font-medium">Development</span>
                </span>
                <ChevronRight
                  class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                  :class="{ 'rotate-90': isDevelopmentExpanded }"
                />
              </button>
            </li>

            <Transition name="sidebar-group">
              <li
                v-if="isDevelopmentExpanded"
                id="sidebar-development-branch"
                class="sidebar-group-shell"
              >
                <ul class="sidebar-group-inner ml-4 space-y-0.5">
                  <li v-for="item in developmentSubcategories" :key="item.name">
                    <RouterLink
                      :to="item.route"
                      class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                      :class="
                        isActive(item.route)
                          ? 'bg-zinc-900 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                      "
                    >
                      <div
                        v-if="isActive(item.route)"
                        class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                      ></div>
                      <component :is="item.icon" class="w-3.5 h-3.5" />
                      <span class="font-medium">{{ item.name }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </li>
            </Transition>

            <li>
              <RouterLink
                to="/sites/cli-tools"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive('/sites/cli-tools')
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive('/sites/cli-tools')"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <Terminal class="w-3.5 h-3.5" />
                <span class="font-medium">CLI Tools</span>
              </RouterLink>
            </li>

            <li>
              <RouterLink
                to="/sites/ui-libraries"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive('/sites/ui-libraries')
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive('/sites/ui-libraries')"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <ComponentIcon class="w-3.5 h-3.5" />
                <span class="font-medium">UI Libraries</span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <li class="mt-6">
          <div class="w-full flex items-center gap-3 text-gray-500 py-2">
            <Sparkles class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider">Skills</span>
          </div>

          <ul class="ml-4 space-y-0.5">
            <li v-for="item in skillsNav" :key="item.name">
              <RouterLink
                :to="item.route"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive(item.route)
                    ? 'bg-zinc-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive(item.route)"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <component :is="item.icon" class="w-3.5 h-3.5" />
                <span class="font-medium">{{ item.name }}</span>
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <div class="shrink-0 space-y-1 border-t border-gray-800 p-4">
      <RouterLink
        to="/submit"
        class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
        :class="isActive('/submit') ? 'bg-zinc-900 text-white' : ''"
      >
        <Send
          class="h-4 w-4 transition-colors"
          :class="
            isActive('/submit') ? 'text-accent-400' : 'text-accent-500 group-hover:text-accent-400'
          "
        />
        <span class="text-xs font-medium">Submit a Tool</span>
      </RouterLink>

      <RouterLink
        v-if="admin.isAdmin"
        to="/admin"
        class="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors group rounded-md hover:bg-accent-500/10"
        :class="isActive('/admin') ? 'bg-zinc-900 text-white' : ''"
      >
        <ShieldCheck class="w-4 h-4" />
        <span class="font-medium text-xs">Admin</span>
        <span
          v-if="admin.pendingCount > 0"
          class="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black"
        >
          {{ admin.pendingCount }}
        </span>
      </RouterLink>
    </div>
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
  background: #1f2937;
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
</style>
