<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Moon, Search, Sparkles, SunMedium, UserRound, X } from 'lucide-vue-next'
import { useSitesStore, type Site } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import { useTheme } from '@/composables/useTheme'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'
import { useAuthDialog } from '@/composables/useAuthDialog'
import GitHubMark from '@/components/icons/GitHubMark.vue'
import holyGrailLogo from '@/assets/holy-grail.png'

const props = withDefaults(
  defineProps<{
    mobileMenuOpen?: boolean
  }>(),
  {
    mobileMenuOpen: false,
  },
)

const emit = defineEmits<{
  toggleMobileMenu: []
  openSearch: []
}>()

const UserProfilePill = defineAsyncComponent(() => import('@/components/auth/UserProfilePill.vue'))
const { isAuthenticated } = useDeferredAuthStatus()
const { openAuthDialog } = useAuthDialog()
const sites = useSitesStore()
const skills = useSkillsStore()
const extensions = useExtensionsStore()
const route = useRoute()
const router = useRouter()
const { isLightMode, themeToggleLabel, toggleTheme } = useTheme()
const GITHUB_REPO_URL = 'https://github.com/Drakaniia/holy-grail'
const TOOLTIP_WARM_DELAY_MS = 400
const isTooltipWarm = shallowRef(false)
let tooltipWarmTimer: number | undefined

function clearTooltipWarmTimer() {
  if (typeof window !== 'undefined' && tooltipWarmTimer !== undefined) {
    window.clearTimeout(tooltipWarmTimer)
    tooltipWarmTimer = undefined
  }
}

function scheduleTooltipWarm() {
  clearTooltipWarmTimer()

  if (typeof window === 'undefined') return

  tooltipWarmTimer = window.setTimeout(() => {
    tooltipWarmTimer = undefined
    isTooltipWarm.value = true
  }, TOOLTIP_WARM_DELAY_MS)
}

function resetTooltipWarm() {
  clearTooltipWarmTimer()
  isTooltipWarm.value = false
}

const collectionLabels: Record<string, string> = {
  '3d': '3D',
  ai: 'AI',
  anime: 'Anime',
  api: 'API',
  automation: 'Automation',
  chat: 'Chat',
  'cli-tools': 'CLI Tools',
  'cloud-hosting': 'Cloud & Hosting',
  design: 'Design',
  'design-tools': 'Design Tools',
  detector: 'Detector',
  development: 'Development',
  downloads: 'Downloads',
  fonts: 'Fonts',
  'game-download': 'Game Download',
  icons: 'Icons',
  'icons-svg': 'Icons/SVG',
  image: 'Images',
  inspiration: 'Inspiration',
  learning: 'Learning',
  mcp: 'MCP',
  md: 'MD',
  ml: 'Machine Learning',
  monitoring: 'Monitoring',
  movies: 'Movies',
  others: 'Others',
  ppt: 'PPT',
  prompts: 'Prompts',
  references: 'References',
  repositories: 'Repositories',
  'software-download': 'Software Download',
  tooling: 'Tooling',
  torrents: 'Torrents',
  'ui-libraries': 'UI Libraries',
  video: 'Videos',
  'vfx-download': 'VFX Download',
  watch: 'Watch',
  wb: 'Website Development',
}
const currentSite = computed(() => {
  if (route.name !== 'site-detail' || typeof route.params.slug !== 'string') {
    return null
  }

  return sites.getSiteBySlug(route.params.slug) ?? null
})
const currentSkill = computed(() => {
  if (route.name !== 'skill-detail' || typeof route.params.slug !== 'string') {
    return null
  }

  return skills.getSkillBySlug(route.params.slug) ?? null
})
const currentExtension = computed(() => {
  if (route.name !== 'extension-detail' || typeof route.params.slug !== 'string') {
    return null
  }

  return extensions.getExtensionBySlug(route.params.slug) ?? null
})
const currentSiteCollectionTrail = computed(() => {
  if (!currentSite.value) return []

  const segments = currentSite.value.subcategory
    ? [currentSite.value.parentCategory, currentSite.value.subcategory]
    : [currentSite.value.parentCategory || currentSite.value.category]
  const seenLabels = new Set<string>()

  return segments.map(formatCollectionLabel).filter((label) => {
    const key = label.toLowerCase()
    if (!key || seenLabels.has(key)) return false

    seenLabels.add(key)
    return true
  })
})

const isHomePage = computed(() => route.path === '/')

const shortcutKey = '⌘'
const shortcutAriaKey = 'Control+K Meta+K'

function getRandomIndex(length: number) {
  return Math.floor(Math.random() * length)
}

function getRandomSite(candidates: Site[]) {
  if (candidates.length === 0) return null
  return candidates[getRandomIndex(candidates.length)]
}

function getRandomSiteCandidates() {
  const currentSlug = typeof route.params.slug === 'string' ? route.params.slug : ''
  const otherSites = sites.allSites.filter((site) => site.slug !== currentSlug)

  if (otherSites.length > 0) {
    return otherSites
  }

  return sites.allSites
}

function formatCollectionLabel(value: string): string {
  return (
    collectionLabels[value] ??
    value
      .split(/[-_]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}

async function openRandomSite() {
  if (!sites.loaded) {
    await sites.loadSites()
  }

  const randomSite = getRandomSite(getRandomSiteCandidates())

  if (!randomSite) return

  await router.push({ name: 'site-detail', params: { slug: randomSite.slug } })
}

</script>

<template>
  <nav
    class="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-800 bg-[#1f1f1f] px-3 text-white sm:px-4 md:h-12"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-[#1f1f1f] text-gray-300 transition-[color,background-color,border-color,transform] duration-150 ease-out-quint hover:border-gray-700 hover:text-white active:scale-[0.96] md:hidden"
        :aria-expanded="props.mobileMenuOpen"
        aria-controls="mobile-sidebar"
        :aria-label="props.mobileMenuOpen ? 'Close navigation' : 'Open navigation'"
        @click="emit('toggleMobileMenu')"
      >
        <component :is="props.mobileMenuOpen ? X : Menu" class="h-5 w-5" />
      </button>

      <RouterLink
        to="/"
        class="flex min-w-0 items-center gap-2 text-sm font-bold uppercase tracking-tight text-white md:hidden"
      >
        <img :src="holyGrailLogo" alt="" class="h-6 w-6 shrink-0 rounded" />
        <span class="truncate">
          {{
            currentSite
              ? currentSite.name
              : currentSkill
                ? currentSkill.title
                : currentExtension
                  ? currentExtension.name
                  : 'Holy Grail'
          }}
        </span>
      </RouterLink>

      <nav
        v-if="currentSiteCollectionTrail.length"
        class="hidden min-w-0 max-w-[18rem] items-center gap-1.5 rounded-md bg-[#1f1f1f] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500 sm:flex lg:max-w-none"
        aria-label="Current site collection"
      >
        <template v-for="(label, index) in currentSiteCollectionTrail" :key="`${label}-${index}`">
          <span
            class="min-w-0 truncate"
            :class="
              index === currentSiteCollectionTrail.length - 1 ? 'text-gray-300' : 'text-gray-500'
            "
          >
            {{ label }}
          </span>
          <span v-if="index < currentSiteCollectionTrail.length - 1" class="shrink-0 text-gray-700">
            /
          </span>
        </template>
      </nav>

      <span
        v-else-if="isHomePage"
        class="hidden min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:flex"
      >
        Browse
      </span>
    </div>

    <div
      class="navbar-actions flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4"
      :data-tooltip-warm="isTooltipWarm"
      @pointerenter="scheduleTooltipWarm"
      @pointerleave="resetTooltipWarm"
    >
      <div class="navbar-search hidden md:flex" role="search">
        <Search class="navbar-search__icon" />
        <input
          type="search"
          readonly
          class="navbar-search__input"
          placeholder="Search sites, skills, docs..."
          aria-label="Open smart search"
          :aria-keyshortcuts="shortcutAriaKey"
          @click="emit('openSearch')"
          @focus="emit('openSearch')"
          @keydown.enter.prevent="emit('openSearch')"
        />
        <span class="navbar-search__shortcut" aria-hidden="true">
          <kbd>{{ shortcutKey }}<span class="font-bold">K</span></kbd>
        </span>
      </div>

      <button
        type="button"
        class="nav-icon-button tooltip-shell inline-flex md:hidden"
        aria-label="Open smart search"
        @click="emit('openSearch')"
      >
        <Search class="h-4 w-4" />
        <span class="tooltip-bubble">Search</span>
      </button>

      <button
        type="button"
        class="nav-icon-button nav-icon-button--light-white tooltip-shell hidden sm:inline-flex"
        aria-label="Open random Grail"
        @click="openRandomSite"
      >
        <Sparkles class="h-4 w-4" />
        <span class="tooltip-bubble">Open random Grail</span>
      </button>

      <span class="tooltip-shell hidden sm:inline-flex">
        <a
          :href="GITHUB_REPO_URL"
          target="_blank"
          rel="noreferrer"
          class="nav-icon-button nav-icon-button--light-white inline-flex"
          aria-label="Open GitHub repository"
        >
          <GitHubMark class="h-4 w-4" />
        </a>
        <span class="tooltip-bubble">GitHub</span>
      </span>

      <button
        type="button"
        class="theme-toggle nav-icon-button tooltip-shell inline-flex"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="toggleTheme"
      >
        <component
          :is="isLightMode ? SunMedium : Moon"
          class="h-4 w-4 transition-transform duration-200"
          :class="isLightMode ? 'rotate-0 text-accent-600' : '-rotate-12 text-gray-300'"
        />
        <span class="tooltip-bubble">{{ themeToggleLabel }}</span>
      </button>

      <template v-if="isAuthenticated">
        <UserProfilePill />
      </template>
      <template v-else>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-700 px-2 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 ease-out-quint hover:bg-[#1f1f1f] active:scale-[0.96] sm:px-3"
          @click="openAuthDialog('login')"
        >
          <UserRound class="h-4 w-4 text-gray-400" />
          <span>Login</span>
        </button>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-2 rounded-lg border border-accent-500/40 bg-accent-500/10 px-2 text-sm font-semibold text-accent-200 transition-[color,background-color,border-color,transform] duration-150 ease-out-quint hover:bg-accent-500/20 active:scale-[0.96] sm:px-3"
          @click="openAuthDialog('signup')"
        >
          <UserRound class="h-4 w-4 text-accent-300" />
          <span>Sign Up</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.nav-icon-button {
  position: relative;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #3a3a3a;
  background: #272727;
  color: #b7bcc4;
  transition:
    border-color 160ms var(--ease-out-quint),
    background-color 160ms var(--ease-out-quint),
    color 160ms var(--ease-out-quint),
    transform 160ms var(--ease-out-quint);
}

.nav-icon-button:hover {
  border-color: #4b5563;
  background: #303030;
  color: #ffffff;
}

.nav-icon-button:active {
  transform: scale(0.96);
}

.navbar-search {
  position: relative;
  height: 2.25rem;
  width: min(22rem, 34vw);
  align-items: center;
}

.navbar-search__icon {
  pointer-events: none;
  position: absolute;
  left: 0.875rem;
  top: 50%;
  height: 0.875rem;
  width: 0.875rem;
  transform: translateY(-50%);
  color: #8b929d;
  transition: color 160ms ease;
}

.navbar-search__input {
  height: 100%;
  width: 100%;
  cursor: text;
  border-radius: 0.5rem;
  border: 1px solid #3a3a3a;
  background: #272727;
  padding: 0 4.7rem 0 2.35rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.navbar-search__input::placeholder {
  color: #8b929d;
}

.navbar-search:hover .navbar-search__input,
.navbar-search__input:focus-visible {
  border-color: #4b5563;
  background: #303030;
}

.navbar-search:hover .navbar-search__icon,
.navbar-search:focus-within .navbar-search__icon {
  color: #ff8c1a;
}

.navbar-search__shortcut {
  pointer-events: none;
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #9ca3af;
}

.navbar-search__shortcut kbd {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  background: #303030;
  padding: 0.125rem 0.375rem;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  color: #c0c5cc;
}

.tooltip-shell {
  position: relative;
  align-items: center;
  justify-content: center;
}

.tooltip-bubble {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: calc(100% + 0.5rem);
  z-index: 80;
  transform: translate(-50%, -0.25rem);
  white-space: nowrap;
  border-radius: 0.375rem;
  border: 1px solid #3f3f46;
  background: #27272a;
  padding: 0.35rem 0.5rem;
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
  transition:
    opacity 140ms var(--ease-out-quint),
    transform 140ms var(--ease-out-quint);
}

.tooltip-shell:hover .tooltip-bubble,
.tooltip-shell:has(:focus-visible) .tooltip-bubble {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* Hold the first tooltip back so it can't fire by accident on the way to something else. */
.tooltip-shell:hover .tooltip-bubble {
  transition-delay: 400ms, 400ms;
}/* Once one tooltip has been open, the rest are instant while the pointer stays in the toolbar. */
.navbar-actions[data-tooltip-warm] .tooltip-shell:hover .tooltip-bubble {
  transition-delay: 0ms, 0ms;
  transition-duration: 0ms, 0ms;
}

@media (prefers-reduced-motion: reduce) {
  /* Tooltips fade in place rather than sliding down from the button. */
  .tooltip-bubble {
    transform: translate(-50%, 0);
    transition: opacity 140ms ease;
  }
}
</style>
