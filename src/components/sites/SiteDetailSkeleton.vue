<template>
  <div class="max-w-6xl mx-auto px-4 py-5 sm:px-6 sm:py-6" aria-hidden="true">
    <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div class="hg-skeleton h-5 w-28 rounded"></div>
        <div class="hg-skeleton h-4 w-44 rounded"></div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="hg-skeleton h-9 w-20 rounded-lg"></div>
        <div class="hg-skeleton h-9 w-28 rounded-lg"></div>
        <div class="hg-skeleton h-9 w-9 rounded-lg"></div>
      </div>
    </div>

    <div class="mb-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex min-w-0 items-start gap-4">
          <div class="hg-skeleton h-14 w-14 flex-shrink-0 rounded-xl"></div>

          <div class="min-w-0 flex-1">
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <div class="hg-skeleton h-7 w-56 rounded"></div>
              <div class="hg-skeleton h-5 w-5 rounded-full"></div>
              <div class="hg-skeleton h-4 w-16 rounded"></div>
            </div>

            <div class="mb-3 flex flex-wrap items-center gap-4">
              <div class="hg-skeleton h-4 w-20 rounded"></div>
              <div class="hg-skeleton h-4 w-24 rounded"></div>
              <div class="hg-skeleton h-4 w-20 rounded"></div>
              <div class="hg-skeleton h-4 w-16 rounded"></div>
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <div class="hg-skeleton h-4 w-28 rounded"></div>
              <div class="hg-skeleton h-4 w-32 rounded"></div>
              <div class="hg-skeleton h-4 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mb-6 rounded-xl border border-gray-800 p-4"
        style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
      >
        <div class="mb-3 hg-skeleton h-4 w-36 rounded"></div>
        <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <div class="flex flex-wrap items-center gap-2">
            <div class="hg-skeleton h-4 w-4 rounded"></div>
            <div class="hg-skeleton h-4 w-14 rounded"></div>
            <div class="hg-skeleton h-5 w-20 rounded"></div>
            <div class="hg-skeleton h-5 w-16 rounded"></div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="hg-skeleton h-4 w-4 rounded"></div>
            <div class="hg-skeleton h-4 w-24 rounded"></div>
            <div class="hg-skeleton h-5 w-24 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="mb-6 overflow-hidden rounded-xl border border-gray-800"
      style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
    >
      <div class="aspect-[16/10] w-full">
        <div class="hg-skeleton h-full w-full"></div>
      </div>
    </div>

    <div
      class="mb-6 rounded-lg border border-accent-900/50 p-4"
      style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
    >
      <div class="mb-2 hg-skeleton h-4 w-24 rounded"></div>
      <div class="hg-skeleton h-4 w-4/5 rounded"></div>
    </div>

    <div class="mb-6">
      <div class="mb-3 hg-skeleton h-5 w-28 rounded"></div>
      <div class="space-y-2">
        <div class="hg-skeleton h-4 w-full rounded"></div>
        <div class="hg-skeleton h-4 w-11/12 rounded"></div>
        <div class="hg-skeleton h-4 w-3/5 rounded"></div>
      </div>
    </div>

    <div class="mb-6">
      <div class="mb-4 hg-skeleton h-5 w-32 rounded"></div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          v-for="index in 4"
          :key="index"
          class="rounded-lg border border-gray-800 p-4"
          style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
        >
          <div class="flex items-start gap-3">
            <div class="hg-skeleton h-8 w-8 flex-shrink-0 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="hg-skeleton h-4 w-28 rounded"></div>
              <div class="hg-skeleton h-3 w-full rounded"></div>
              <div class="hg-skeleton h-3 w-3/4 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="mb-6 rounded-xl border border-gray-800 p-4"
      style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
    >
      <div class="mb-4 flex items-center gap-2">
        <div class="hg-skeleton h-4 w-4 rounded"></div>
        <div class="hg-skeleton h-4 w-4/5 rounded"></div>
      </div>
      <div class="flex items-center gap-3 border-t border-gray-800 pt-4">
        <div class="hg-skeleton h-3 w-12 rounded"></div>
        <div class="hg-skeleton h-8 w-8 rounded"></div>
        <div class="hg-skeleton h-8 w-8 rounded"></div>
      </div>
    </div>

    <div
      class="mb-6 rounded-xl border border-gray-800"
      style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
    >
      <div class="border-b border-gray-800 p-4">
        <div class="mb-2 hg-skeleton h-5 w-48 rounded"></div>
        <div class="hg-skeleton h-4 w-3/4 rounded"></div>
      </div>
      <div class="p-4">
        <div class="mb-3 flex flex-wrap gap-2">
          <div class="hg-skeleton h-9 w-28 rounded-lg"></div>
          <div class="hg-skeleton h-9 w-24 rounded-lg"></div>
        </div>
        <div class="mb-3 hg-skeleton h-3 w-4/5 rounded"></div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="hg-skeleton h-14 rounded-lg"></div>
          <div class="hg-skeleton h-14 rounded-lg"></div>
          <div class="hg-skeleton h-14 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <div class="mb-4 flex items-center gap-2">
        <div class="hg-skeleton h-5 w-5 rounded"></div>
        <div class="hg-skeleton h-5 w-48 rounded"></div>
        <div class="hg-skeleton h-4 w-14 rounded"></div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="index in 3"
          :key="index"
          class="block rounded-xl border border-gray-800 p-4"
          style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
        >
          <div class="mb-3 flex items-start gap-3">
            <div class="hg-skeleton h-10 w-10 flex-shrink-0 rounded-lg"></div>
            <div class="min-w-0 flex-1">
              <div class="mb-2 hg-skeleton h-4 w-28 rounded"></div>
              <div class="hg-skeleton h-4 w-4 rounded-full"></div>
            </div>
          </div>
          <div class="mb-3 space-y-2">
            <div class="hg-skeleton h-3 w-full rounded"></div>
            <div class="hg-skeleton h-3 w-3/4 rounded"></div>
          </div>
          <div class="hg-skeleton h-3 w-24 rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template>
