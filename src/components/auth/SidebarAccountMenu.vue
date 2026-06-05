<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  Lightbulb,
  LogOut,
  Mail,
  MessageCircle,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore } from '@/stores/bookmarks'
import { useAdminStore } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const GITHUB_REPO_URL = 'https://github.com/Drakaniia/holy-grail'

const auth = useAuthStore()
const bookmarks = useBookmarksStore()
const admin = useAdminStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const isOpen = shallowRef(false)

const email = computed(() => auth.user?.email ?? 'No email')
const bookmarkLabel = computed(() =>
  bookmarks.bookmarkCount === 1 ? '1 saved item' : `${bookmarks.bookmarkCount} saved items`,
)

const helpLinks = [
  {
    label: 'Documentation',
    href: `${GITHUB_REPO_URL}#readme`,
    icon: FileText,
  },
  {
    label: 'Community',
    href: `${GITHUB_REPO_URL}/discussions`,
    icon: MessageCircle,
  },
  {
    label: 'Contact Support',
    href: `${GITHUB_REPO_URL}/issues/new`,
    icon: Mail,
  },
  {
    label: 'Share Feedback',
    href: `${GITHUB_REPO_URL}/issues/new`,
    icon: Lightbulb,
  },
]

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('keydown', handleKeydown)

  void auth.initialize()

  if (auth.isAuthenticated) {
    void bookmarks.loadBookmarks()
    if (admin.isAdmin) {
      void admin.loadSubmissions('pending')
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleKeydown)
})

function closeMenu() {
  isOpen.value = false
}

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function handlePointerDown(event: PointerEvent) {
  if (!isOpen.value || !menuRoot.value) {
    return
  }

  if (!menuRoot.value.contains(event.target as Node)) {
    closeMenu()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

async function handleSignOut() {
  closeMenu()
  const result = await auth.signOut()
  bookmarks.clear()

  if (!result.ok) {
    return
  }

  toast.info('Signed out', 'Your Holy Grail session has ended.')

  if (route.meta.requiresAuth) {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div ref="menuRoot" class="relative z-[90] w-full">
    <button
      type="button"
      class="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-white transition hover:bg-accent-500/10"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      aria-label="Open Holy Grail account menu"
      @click="toggleMenu"
    >
      <span
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-800 bg-[#1f1f1f] text-white"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
          />
        </svg>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-bold uppercase tracking-tight text-white">
          Holy Grail
        </span>
      </span>
      <ChevronDown
        class="h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-if="isOpen"
      role="menu"
      class="absolute left-1 top-12 z-[95] w-[15.25rem] overflow-visible rounded-lg border border-gray-800 bg-[#1f1f1f] py-2 shadow-2xl shadow-[#1f1f1f]/60"
    >
      <div class="border-b border-gray-800 px-3 pb-3">
        <div class="flex min-w-0 items-center gap-3">
          <UserAvatar
            :src="auth.avatarUrl"
            :initial="auth.avatarInitial"
            :label="auth.displayName"
            size="md"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ auth.displayName }}</p>
            <p class="truncate text-xs text-gray-500">{{ email }}</p>
            <p class="mt-1 text-[10px] font-semibold uppercase tracking-widest text-accent-300">
              {{ auth.providerLabel }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-2 py-2">
        <RouterLink
          to="/account"
          role="menuitem"
          class="account-menu-item text-gray-300 hover:text-white"
          @click="closeMenu"
        >
          <UserRound class="h-4 w-4 text-gray-500" />
          <span>My profile</span>
        </RouterLink>

        <RouterLink
          to="/bookmarks"
          role="menuitem"
          class="account-menu-item text-gray-300 hover:text-white"
          @click="closeMenu"
        >
          <Bookmark class="h-4 w-4 text-gray-500" />
          <span>Bookmarks</span>
          <span class="ml-auto max-w-[6rem] truncate text-xs text-gray-600">{{ bookmarkLabel }}</span>
        </RouterLink>

        <div class="account-help-menu relative" role="none">
          <button
            type="button"
            role="menuitem"
            class="account-menu-item w-full text-gray-300 hover:text-white"
          >
            <CircleHelp class="h-4 w-4 text-gray-500" />
            <span>Help</span>
            <ChevronRight class="ml-auto h-4 w-4 text-gray-600" />
          </button>

          <div
            class="account-help-submenu absolute left-[calc(100%-0.125rem)] top-0 z-[100] w-56 rounded-lg border border-gray-800 bg-[#1f1f1f] p-2 shadow-2xl shadow-[#1f1f1f]/60"
            role="menu"
            aria-label="Help"
          >
            <a
              v-for="item in helpLinks"
              :key="item.label"
              :href="item.href"
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              class="account-menu-item text-gray-300 hover:text-white"
              @click="closeMenu"
            >
              <component :is="item.icon" class="h-4 w-4 text-gray-500" />
              <span>{{ item.label }}</span>
              <ExternalLink class="ml-auto h-3.5 w-3.5 text-gray-600" />
            </a>
          </div>
        </div>

        <RouterLink
          to="/settings"
          role="menuitem"
          class="account-menu-item text-gray-300 hover:text-white"
          @click="closeMenu"
        >
          <Settings class="h-4 w-4 text-gray-500" />
          <span>Settings</span>
        </RouterLink>

        <RouterLink
          v-if="admin.isAdmin"
          to="/admin"
          role="menuitem"
          class="account-menu-item text-gray-300 hover:text-white"
          @click="closeMenu"
        >
          <ShieldCheck class="h-4 w-4 text-gray-500" />
          <span>Admin</span>
          <span
            v-if="admin.pendingCount > 0"
            class="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
          >
            {{ admin.pendingCount }}
          </span>
        </RouterLink>
      </div>

      <div class="border-t border-gray-800 px-2 pt-2">
        <button
          type="button"
          role="menuitem"
          class="account-menu-item w-full text-left text-gray-300 hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4 text-red-300" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.25rem;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.account-menu-item:hover,
.account-menu-item:focus-visible {
  background: rgba(255, 140, 26, 0.1);
  outline: none;
}

.account-help-submenu {
  display: none;
}

.account-help-menu:hover .account-help-submenu,
.account-help-menu:focus-within .account-help-submenu {
  display: block;
}
</style>
