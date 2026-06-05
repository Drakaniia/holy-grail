<template>
  <article
    class="relative overflow-hidden rounded-xl border border-gray-800"
    style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
    aria-hidden="true"
  >
    <div class="absolute right-4 top-4 z-10 h-9 w-9 rounded-lg border border-gray-800 bg-[#1f1f1f] p-2">
      <div class="hg-skeleton h-full w-full rounded-sm"></div>
    </div>

    <div class="block p-5 pr-16">
      <div class="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div class="space-y-2">
          <div class="hg-skeleton h-4 w-40 rounded"></div>
          <div class="hg-skeleton h-4 w-28 rounded"></div>
        </div>
        <div class="hg-skeleton h-4 w-4 flex-shrink-0 rounded"></div>
      </div>

      <div class="mb-4 space-y-2">
        <div class="hg-skeleton h-3 w-full rounded"></div>
        <div class="hg-skeleton h-3 w-full rounded"></div>
        <div class="hg-skeleton h-3 w-2/3 rounded"></div>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <div class="hg-skeleton h-3 w-20 rounded"></div>
        <div class="hg-skeleton h-3 w-16 rounded"></div>
      </div>

      <div class="border-t border-gray-800 pt-3">
        <div class="flex min-w-0 items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <div class="hg-skeleton h-5 w-5 rounded-full"></div>
            <div class="hg-skeleton h-3 w-24 rounded"></div>
          </div>
          <div class="hg-skeleton h-3 w-28 rounded"></div>
        </div>

        <div class="mt-2 flex items-center gap-1.5">
          <div class="hg-skeleton h-3 w-3 rounded"></div>
          <div class="hg-skeleton h-3 w-24 rounded"></div>
        </div>
      </div>
    </div>
  </article>
</template>
