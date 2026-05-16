<template>
  <footer class="bg-gray-900 text-white border-t border-gray-800">
    <div class="container mx-auto px-4 py-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <!-- Left: Logo & Copyright -->
        <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71L16.29 21L21 21V13H17.71L18.71 14.29L17.29 15.71L16.29 14.71L13 18V21H11V13L3 3ZM5 5L11 11V5H5Z" />
            </svg>
            <span class="font-semibold text-sm">Holy Grail</span>
          </div>
          <span class="text-gray-500 text-xs">© 2026 Holy Grail. Built by the community.</span>
        </div>

        <!-- Right: Links -->
        <div class="flex items-center gap-4 text-sm">
          <a href="#" class="text-gray-400 hover:text-white transition-colors">Docs</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors">Changelog</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors">Blog</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors">GitHub</a>
          <span class="text-gray-700">|</span>
          <a href="#" class="text-gray-400 hover:text-white transition-colors">@lexnlin</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors">@blueemi99</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Minimal footer component for Holy Grail
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
