<script setup lang="ts">
import SkillContentSkeleton from './SkillContentSkeleton.vue'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8" aria-hidden="true">
    <div class="mb-8 hg-skeleton h-5 w-28 rounded"></div>

    <div class="mb-8">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-3">
          <div class="hg-skeleton h-9 w-72 max-w-full rounded"></div>
          <div class="hg-skeleton h-8 w-48 max-w-full rounded"></div>
        </div>
        <div class="hg-skeleton h-9 w-20 rounded-lg"></div>
      </div>
      <div class="space-y-2">
        <div class="hg-skeleton h-4 w-full rounded"></div>
        <div class="hg-skeleton h-4 w-4/5 rounded"></div>
      </div>
    </div>

    <div
      class="mb-6 rounded-xl border border-gray-800 p-4"
      style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
    >
      <div class="flex flex-wrap items-center gap-4 sm:gap-6">
        <div class="hg-skeleton h-4 w-24 rounded"></div>
        <div class="hg-skeleton h-4 w-20 rounded"></div>
        <div class="hg-skeleton h-4 w-28 rounded"></div>
        <div class="hg-skeleton h-4 w-56 max-w-full rounded"></div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
        <div class="hg-skeleton h-6 w-16 rounded-md"></div>
        <div class="hg-skeleton h-6 w-24 rounded-md"></div>
        <div class="hg-skeleton h-6 w-20 rounded-md"></div>
      </div>
    </div>

    <div
      class="mb-6 rounded-xl border border-gray-800 p-4"
      style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0 flex-1">
          <div class="mb-2 hg-skeleton h-3 w-28 rounded"></div>
          <div class="hg-skeleton h-5 w-full max-w-xl rounded"></div>
        </div>
        <div class="hg-skeleton h-10 w-20 flex-shrink-0 rounded-lg"></div>
      </div>
    </div>

    <div
      class="min-w-0 overflow-hidden rounded-xl border border-gray-800 p-4 sm:p-6 md:p-8"
      style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
    >
      <SkillContentSkeleton />
    </div>
  </div>
</template>
