<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { Menu, Moon, Search, Sparkles, Star, SunMedium, UserRound, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import UserProfilePill from '@/components/auth/UserProfilePill.vue'
import GitHubMark from '@/components/icons/GitHubMark.vue'

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

const auth = useAuthStore()
const { isLightMode, themeToggleLabel, toggleTheme } = useTheme()
const GITHUB_REPO_URL = 'https://github.com/Drakaniia/holy-grail'
const GITHUB_REPO_API_URL = 'https://api.github.com/repos/Drakaniia/holy-grail'
const starCount = shallowRef<number | null>(null)
const isStarCountLoading = shallowRef(false)
const formattedStarCount = computed(() => {
  if (starCount.value === null) return isStarCountLoading.value ? '...' : 'Stars'

  return Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(starCount.value)
})
const starLinkLabel = computed(() =>
  starCount.value === null
    ? 'Open Holy Grail GitHub repository stars'
    : `Open Holy Grail GitHub repository with ${starCount.value.toLocaleString()} stars`,
)

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const shortcutKey = isMac ? 'Cmd' : 'Ctrl'

interface GitHubRepositoryResponse {
  stargazers_count?: number
}

async function loadStarCount() {
  isStarCountLoading.value = true

  try {
    const response = await fetch(GITHUB_REPO_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    })

    if (!response.ok) return

    const data = (await response.json()) as GitHubRepositoryResponse

    if (typeof data.stargazers_count === 'number') {
      starCount.value = data.stargazers_count
    }
  } catch {
    starCount.value = null
  } finally {
    isStarCountLoading.value = false
  }
}

onMounted(() => {
  void auth.initialize()
  void loadStarCount()
})
</script>

<template>
  <nav
    class="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-800 bg-black px-3 text-white sm:px-4 md:h-12"
  >
    <div class="flex min-w-0 items-center gap-2">
      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-[#080808] text-gray-300 transition-colors hover:border-gray-700 hover:text-white md:hidden"
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
        <svg class="h-5 w-5 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
          />
        </svg>
        <span class="truncate">Holy Grail</span>
      </RouterLink>
    </div>

    <div class="flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-4">
      <button
        type="button"
        class="group relative hidden h-8 w-60 items-center rounded-lg border border-gray-700 bg-[#0f172a] py-1 pl-9 pr-14 text-left text-sm transition-all hover:border-gray-600 hover:bg-[#161b22] focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 md:flex"
        aria-label="Open smart search"
        @click="emit('openSearch')"
      >
        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search
            class="h-3.5 w-3.5 text-gray-500 transition-colors group-focus-within:text-accent-400"
          />
        </span>
        <span class="min-w-0 truncate text-gray-500 transition-colors group-hover:text-gray-300">
          Search scripts...
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <span
            class="flex items-center rounded border border-gray-700 bg-[#1e293b] px-1 font-mono text-[10px] text-gray-500"
          >
            <span class="mr-0.5">{{ shortcutKey }}</span>
            K
          </span>
        </span>
      </button>

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
        aria-label="Quick actions"
      >
        <Sparkles class="h-4 w-4" />
        <span class="tooltip-bubble">Quick actions</span>
      </button>

      <a
        :href="GITHUB_REPO_URL"
        target="_blank"
        rel="noreferrer"
        class="github-stars hidden h-8 items-center gap-2 rounded-md bg-white px-3 text-sm font-medium text-black transition-colors hover:bg-gray-100 sm:flex"
        :aria-label="starLinkLabel"
      >
        <GitHubMark class="h-4 w-4" />
        <span class="github-star-count">{{ formattedStarCount }}</span>
        <Star class="github-star-icon h-4 w-4 fill-yellow-500 text-yellow-500" />
      </a>

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

      <UserProfilePill v-if="auth.isAuthenticated" />

      <RouterLink
        v-else
        to="/login"
        class="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-700 px-2 text-sm font-semibold transition-colors hover:bg-gray-800 sm:px-3"
      >
        <UserRound class="h-4 w-4 text-gray-400" />
        <span class="hidden sm:inline">Sign In</span>
      </RouterLink>
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
  border: 1px solid #1f2937;
  background: #080808;
  color: #9ca3af;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.nav-icon-button:hover {
  border-color: #374151;
  background: #111827;
  color: #ffffff;
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
  border: 1px solid #374151;
  background: #0b0f17;
  padding: 0.35rem 0.5rem;
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.tooltip-shell:hover .tooltip-bubble,
.tooltip-shell:focus-within .tooltip-bubble {
  opacity: 1;
  transform: translate(-50%, 0);
}

.github-stars:hover .github-star-icon {
  animation: star-pop 720ms ease both;
}

.github-star-count {
  animation: count-rise 480ms ease both;
}

.github-star-icon {
  animation: star-breathe 2.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes count-rise {
  from {
    opacity: 0.62;
    transform: translateY(2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes star-breathe {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(234, 179, 8, 0));
    transform: scale(1) rotate(0deg);
  }

  50% {
    filter: drop-shadow(0 0 7px rgba(234, 179, 8, 0.55));
    transform: scale(1.12) rotate(8deg);
  }
}

@keyframes star-pop {
  0% {
    transform: scale(1) rotate(0deg);
  }

  45% {
    transform: scale(1.28) rotate(16deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
  }
}
</style>
