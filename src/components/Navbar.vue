<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Github, LogOut, Moon, Search, Star, UserRound, Zap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const searchQuery = shallowRef('')
const starCount = shallowRef(0)

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const shortcutKey = isMac ? 'Cmd' : 'Ctrl'
const userLabel = computed(() => auth.displayName || auth.user?.email || 'Account')

onMounted(() => {
  void auth.initialize()
})

async function handleSignOut() {
  const result = await auth.signOut()

  if (result.ok && router.currentRoute.value.meta.requiresAuth) {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <nav
    class="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-gray-800 bg-black px-4 text-white"
  >
    <div class="flex items-center space-x-2"></div>

    <div class="flex items-center space-x-4">
      <div class="group relative hidden md:block">
        <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search class="h-4 w-4 text-gray-500 transition-colors group-focus-within:text-accent-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search scripts..."
          class="w-64 rounded-lg border border-gray-700 bg-[#0f172a] py-1.5 pl-10 pr-16 text-sm transition-all focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <span
            class="flex items-center rounded border border-gray-700 bg-[#1e293b] px-1 font-mono text-[10px] text-gray-500"
          >
            <span class="mr-0.5">{{ shortcutKey }}</span>
            K
          </span>
        </div>
      </div>

      <button
        type="button"
        class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        aria-label="Quick actions"
      >
        <Zap class="h-5 w-5" />
      </button>

      <a
        href="https://github.com/Drakaniia/holy-grail"
        target="_blank"
        class="flex items-center rounded-md bg-white px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-gray-100"
      >
        <Github class="mr-2 h-4 w-4" />
        <span>{{ starCount }}</span>
        <Star class="ml-1 h-4 w-4 fill-yellow-500 text-yellow-500" />
      </a>

      <a
        href="https://github.com/Drakaniia/holy-grail"
        target="_blank"
        class="text-gray-400 transition-colors hover:text-white"
        aria-label="Open GitHub repository"
      >
        <Github class="h-6 w-6" />
      </a>

      <button
        type="button"
        class="text-gray-400 transition-colors hover:text-white"
        aria-label="Toggle theme"
      >
        <Moon class="h-6 w-6" />
      </button>

      <div v-if="auth.isAuthenticated" class="flex items-center gap-2">
        <RouterLink
          to="/account"
          class="flex min-w-0 items-center gap-2 rounded-lg border border-gray-700 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-gray-800"
        >
          <span
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent-500/20 text-xs font-bold text-accent-200"
          >
            {{ auth.avatarInitial }}
          </span>
          <span class="hidden max-w-[120px] truncate lg:inline">{{ userLabel }}</span>
        </RouterLink>

        <button
          type="button"
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
          :disabled="auth.loading"
          aria-label="Sign out"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>

      <RouterLink
        v-else
        to="/login"
        class="flex items-center space-x-2 rounded-lg border border-gray-700 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-800"
      >
        <UserRound class="h-5 w-5 text-gray-400" />
        <span>Sign In</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped></style>
