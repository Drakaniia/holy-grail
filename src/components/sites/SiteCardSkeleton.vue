<template>
  <article
    class="relative overflow-hidden rounded-xl border border-gray-800"
    style="
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%),
        #1f1f1f;
    "
    aria-hidden="true"
  >
    <div class="absolute right-4 top-4 z-10 h-9 w-9 rounded-lg border border-gray-800 bg-[#1f1f1f] p-2">
      <div class="hg-skeleton h-full w-full rounded-sm"></div>
    </div>

    <div class="block p-5 pr-16">
      <div class="mb-3 flex min-w-0 items-start gap-4">
        <div class="hg-skeleton h-11 w-11 flex-shrink-0 rounded-lg"></div>

        <div class="min-w-0 flex-1">
          <div class="mb-2 flex min-w-0 items-center gap-2">
            <div class="hg-skeleton h-4 w-32 rounded"></div>
            <div class="hg-skeleton h-4 w-4 flex-shrink-0 rounded-full"></div>
          </div>
          <div class="hg-skeleton h-5 w-20 rounded-full"></div>
        </div>
      </div>

      <div class="mb-4 space-y-2">
        <div class="hg-skeleton h-3 w-full rounded"></div>
        <div class="hg-skeleton h-3 w-3/4 rounded"></div>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <div class="hg-skeleton h-3 w-12 rounded"></div>
        <div class="hg-skeleton h-3 w-14 rounded"></div>
        <div class="hg-skeleton h-3 w-24 rounded"></div>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <div class="hg-skeleton h-5 w-14 rounded"></div>
        <div class="hg-skeleton h-5 w-20 rounded"></div>
        <div class="hg-skeleton h-5 w-12 rounded"></div>
      </div>
    </div>
  </article>
</template>
