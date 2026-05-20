<template>
  <footer class="min-h-16 shrink-0 border-t border-gray-800 bg-black text-white">
    <div
      class="mx-auto flex min-h-16 max-w-7xl flex-col justify-center gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0"
    >
      <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <RouterLink to="/sites/platforms" class="flex min-w-0 items-center gap-2">
          <svg class="h-4 w-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
            />
          </svg>
          <span class="truncate text-sm font-semibold">Holy Grail</span>
        </RouterLink>
        <p class="text-xs text-gray-500">
          &copy; 2026 Holy Grail. Made with
          <span class="text-accent-500" aria-label="orange heart">🧡</span>
          by
          <a
            href="https://github.com/Drakaniia"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-gray-400 transition-colors hover:text-white"
          >
            Drakaniia
          </a>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <a href="#" class="text-gray-400 transition-colors hover:text-white">Docs</a>
        <a href="#" class="text-gray-400 transition-colors hover:text-white">Changelog</a>
        <a href="#" class="text-gray-400 transition-colors hover:text-white">Blog</a>
        <a
          href="https://github.com/Drakaniia/holy-grail"
          target="_blank"
          rel="noreferrer"
          class="text-gray-400 transition-colors hover:text-white"
        >
          Drakaniia/holy-grail
        </a>
        <span class="hidden text-gray-700 sm:inline">|</span>
        <a
          href="https://github.com/Drakaniia"
          target="_blank"
          rel="noreferrer"
          class="text-gray-400 transition-colors hover:text-white"
        >
          @Drakaniia
        </a>
      </div>
    </div>
  </footer>
</template>
