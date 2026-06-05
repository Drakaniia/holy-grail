<template>
  <div aria-hidden="true">
    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="index in 8"
        :key="index"
        class="border border-gray-800 bg-[#1f1f1f] p-4"
      >
        <div class="mb-5 flex items-center justify-between gap-3">
          <div class="hg-skeleton h-3 w-28 rounded"></div>
          <div class="hg-skeleton h-4 w-4 shrink-0 rounded"></div>
        </div>
        <div class="hg-skeleton h-9 w-20 rounded"></div>
      </article>
    </div>

    <div class="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section class="border border-gray-800 bg-[#1f1f1f] p-5">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="hg-skeleton h-3 w-20 rounded"></div>
            <div class="mt-2 hg-skeleton h-5 w-32 rounded"></div>
          </div>
          <div class="flex flex-wrap gap-3">
            <div class="hg-skeleton h-3 w-12 rounded"></div>
            <div class="hg-skeleton h-3 w-16 rounded"></div>
            <div class="hg-skeleton h-3 w-12 rounded"></div>
          </div>
        </div>

        <div class="flex h-52 items-end gap-1 border border-gray-900 bg-[#1f1f1f]/60 px-3 py-4">
          <div
            v-for="height in ['22%', '48%', '34%', '76%', '58%', '92%', '66%', '38%', '54%', '82%', '44%', '70%']"
            :key="height"
            class="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
          >
            <div class="flex flex-1 items-end">
              <div class="hg-skeleton w-full min-w-[3px]" :style="{ height }"></div>
            </div>
            <div class="hidden h-3 sm:block">
              <div class="hg-skeleton mx-auto h-2 w-6 rounded"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="border border-gray-800 bg-[#1f1f1f] p-5">
        <div class="hg-skeleton h-3 w-24 rounded"></div>
        <div class="mt-2 hg-skeleton h-5 w-44 rounded"></div>

        <div class="mt-6 space-y-4">
          <div v-for="index in 2" :key="index">
            <div class="mb-2 flex items-center justify-between">
              <div class="hg-skeleton h-3 w-20 rounded"></div>
              <div class="hg-skeleton h-3 w-10 rounded"></div>
            </div>
            <div class="h-2 bg-[#1f1f1f]">
              <div class="hg-skeleton h-full" :class="index === 1 ? 'w-2/5' : 'w-3/4'"></div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <div v-for="index in 2" :key="index" class="border border-gray-800 bg-[#1f1f1f] px-3 py-3">
            <div class="hg-skeleton h-4 w-12 rounded"></div>
            <div class="mt-2 hg-skeleton h-3 w-20 rounded"></div>
          </div>
        </div>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <section
        v-for="section in 6"
        :key="section"
        class="border border-gray-800 bg-[#1f1f1f] p-5"
      >
        <div class="mb-4 hg-skeleton h-4 w-32 rounded"></div>
        <ol class="space-y-3">
          <li
            v-for="index in 4"
            :key="index"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
          >
            <div class="hg-skeleton h-4 rounded" :class="index === 4 ? 'w-2/3' : 'w-full'"></div>
            <div class="hg-skeleton h-4 w-8 rounded"></div>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
