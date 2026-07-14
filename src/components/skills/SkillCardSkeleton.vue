<template>
  <div
    class="relative rounded-xl border border-gray-800 bg-[#1f1f1f]"
    aria-hidden="true"
  >
    <div class="p-4">
      <!-- Header row: avatar skeleton + title skeleton -->
      <div class="flex items-center gap-3 pr-8 mb-3">
        <div class="hg-skeleton h-8 w-8 shrink-0 rounded-full"></div>
        <div class="space-y-2 min-w-0 flex-1">
          <div class="hg-skeleton h-3.5 w-3/4 rounded"></div>
        </div>
      </div>

      <!-- Description skeleton -->
      <div class="mb-3">
        <div class="hg-skeleton h-3 w-full rounded"></div>
      </div>

      <!-- Stats row skeleton -->
      <div class="flex items-center gap-3 mb-3">
        <div class="hg-skeleton h-3 w-14 rounded"></div>
        <div class="hg-skeleton h-3 w-14 rounded"></div>
      </div>

      <!-- Tag badges skeleton -->
      <div class="flex items-center gap-1.5">
        <div class="hg-skeleton h-5 w-16 rounded-md"></div>
        <div class="hg-skeleton h-5 w-20 rounded-md"></div>
      </div>
    </div>
  </div>
</template>
