<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bookmark, ChevronDown, LogOut, ShieldCheck, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore } from '@/stores/bookmarks'
import { useAdminStore } from '@/stores/admin'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const auth = useAuthStore()
const bookmarks = useBookmarksStore()
const admin = useAdminStore()
const route = useRoute()
const router = useRouter()
const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const isOpen = shallowRef(false)

const email = computed(() => auth.user?.email ?? 'No email')
const bookmarkLabel = computed(() =>
  bookmarks.bookmarkCount === 1 ? '1 saved item' : `${bookmarks.bookmarkCount} saved items`
)

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('keydown', handleKeydown)

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

  if (result.ok && route.meta.requiresAuth) {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div ref="menuRoot" class="relative">
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-700 bg-[#050505] px-2 pr-3 text-left text-sm font-medium text-white transition hover:border-gray-600 hover:bg-gray-900"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      aria-label="Open account menu"
      @click="toggleMenu"
    >
      <UserAvatar
        :src="auth.avatarUrl"
        :initial="auth.avatarInitial"
        :label="auth.displayName"
        size="sm"
      />
      <span class="hidden min-w-0 lg:block">
        <span class="block max-w-[120px] truncate text-xs font-semibold text-white">
          {{ auth.displayName }}
        </span>
        <span class="block text-[10px] uppercase tracking-widest text-accent-300">
          {{ auth.providerLabel }}
        </span>
      </span>
      <ChevronDown
        class="h-4 w-4 text-gray-500 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-if="isOpen"
      role="menu"
      class="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-lg border border-gray-800 bg-[#050505] shadow-2xl shadow-black/60"
    >
      <div class="border-b border-gray-800 p-4">
        <div class="flex items-center gap-3">
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

      <div class="p-2">
        <RouterLink
          to="/account"
          role="menuitem"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-900 hover:text-white"
          @click="closeMenu"
        >
          <UserRound class="h-4 w-4 text-gray-500" />
          Profile
        </RouterLink>

        <RouterLink
          to="/bookmarks"
          role="menuitem"
          class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-900 hover:text-white"
          @click="closeMenu"
        >
          <span class="flex items-center gap-3">
            <Bookmark class="h-4 w-4 text-gray-500" />
            Bookmarks
          </span>
          <span class="text-xs text-gray-600">{{ bookmarkLabel }}</span>
        </RouterLink>

        <RouterLink
          v-if="admin.isAdmin"
          to="/admin"
          role="menuitem"
          class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-900 hover:text-white"
          @click="closeMenu"
        >
          <span class="flex items-center gap-3">
            <ShieldCheck class="h-4 w-4 text-gray-500" />
            Admin
          </span>
          <span v-if="admin.pendingCount > 0" class="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
            {{ admin.pendingCount }}
          </span>
        </RouterLink>
      </div>

      <div class="border-t border-gray-800 p-2">
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-red-950/40 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4 text-red-300" />
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
