<script setup lang="ts">
import { ref, onMounted } from 'vue'

const searchQuery = ref('')
const starCount = ref(0)

// Helper for keyboard shortcut display
const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const shortcutKey = isMac ? '⌘' : 'Ctrl'

onMounted(async () => {
  try {
    const res = await fetch('https://api.github.com/repos/Drakaniia/holy-grail')
    const data = await res.json()
    starCount.value = data.stargazers_count ?? 0
  } catch {
    starCount.value = 0
  }
})
</script>

<template>
  <nav
    class="bg-black text-white border-b border-gray-800 px-4 h-12 flex items-center justify-between sticky top-0 z-50"
  >
    <!-- Left: Spacer or Breadcrumbs (since logo is in sidebar) -->
    <div class="flex items-center space-x-2"></div>

    <!-- Right: Search and Actions -->
    <div class="flex items-center space-x-4">
      <!-- Search Bar -->
      <div class="relative hidden md:block group">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg
            class="w-4 h-4 text-gray-500 group-focus-within:text-accent-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search scripts..."
          class="bg-[#0f172a] border border-gray-700 rounded-lg py-1.5 pl-10 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 w-64 transition-all"
        />
        <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span
            class="text-[10px] font-mono text-gray-500 border border-gray-700 px-1 rounded bg-[#1e293b] flex items-center"
          >
            <span class="mr-0.5">{{ shortcutKey }}</span
            >K
          </span>
        </div>
      </div>

      <!-- Spark Icon -->
      <button
        class="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </button>

      <!-- GitHub Stars -->
      <a
        href="https://github.com/Drakaniia/holy-grail"
        target="_blank"
        class="flex items-center bg-white text-black px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
        <span>{{ starCount }}</span>
        <svg class="w-4 h-4 ml-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      </a>

      <!-- GitHub Link -->
      <a
        href="https://github.com/Drakaniia/holy-grail"
        target="_blank"
        class="text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
      </a>

      <!-- Theme Toggle -->
      <button class="text-gray-400 hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      <!-- Sign In Button -->
      <button
        class="flex items-center space-x-2 border border-gray-700 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span>Sign In</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* Any additional specific styles */
</style>
