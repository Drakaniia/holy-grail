<script setup lang="ts">
import SkillContentSkeleton from './SkillContentSkeleton.vue'
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-hidden="true">
    <!-- Back button -->
    <div class="mb-4 hg-skeleton h-4 w-28 rounded" />

    <!-- Breadcrumb -->
    <div class="mb-6 flex items-center gap-2">
      <div class="hg-skeleton h-3 w-12 rounded" />
      <div class="hg-skeleton h-3 w-3 rounded" />
      <div class="hg-skeleton h-3 w-20 rounded" />
    </div>

    <!-- Hero section -->
    <div class="mb-6 flex items-start gap-4">
      <div class="hg-skeleton h-16 w-16 shrink-0 rounded-xl" />
      <div class="min-w-0 flex-1 space-y-3">
        <div class="flex items-center gap-3">
          <div class="hg-skeleton h-10 w-64 max-w-full rounded" />
          <div class="hg-skeleton h-6 w-16 rounded-md" />
        </div>
        <div class="flex gap-4">
          <div class="hg-skeleton h-4 w-32 rounded" />
          <div class="hg-skeleton h-4 w-40 rounded" />
        </div>
        <div class="hg-skeleton h-5 w-24 rounded-full" />
        <div class="flex gap-4">
          <div class="hg-skeleton h-4 w-20 rounded" />
          <div class="hg-skeleton h-4 w-20 rounded" />
        </div>
      </div>
      <div class="hg-skeleton h-6 w-6 shrink-0 rounded" />
    </div>

    <!-- Navigation tabs -->
    <div class="mb-6 flex gap-6 border-b border-gray-800 pb-0">
      <div class="hg-skeleton h-10 w-20 rounded-t" />
      <div class="hg-skeleton h-10 w-32 rounded-t" />
      <div class="hg-skeleton h-10 w-24 rounded-t" />
      <div class="hg-skeleton h-10 w-20 rounded-t" />
      <div class="hg-skeleton h-10 w-28 rounded-t" />
      <div class="hg-skeleton h-10 w-28 rounded-t opacity-50" />
    </div>

    <!-- Two-column layout -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Main content column -->
      <div class="min-w-0 flex-1 space-y-6">
        <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-6">
          <SkillContentSkeleton />
        </div>
      </div>

      <!-- Sidebar column -->
      <div class="w-full space-y-4 lg:w-80 xl:w-96">
        <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
          <div class="hg-skeleton mb-3 h-10 w-full rounded-lg" />
          <div class="hg-skeleton h-8 w-full rounded-lg" />
        </div>
        <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
          <div class="mb-3 hg-skeleton h-5 w-32 rounded" />
          <div class="mb-3 hg-skeleton h-6 w-24 rounded" />
          <div class="mb-3 hg-skeleton h-3 w-40 rounded" />
          <div class="mb-3 hg-skeleton h-8 w-full rounded" />
          <div class="hg-skeleton h-8 w-full rounded" />
        </div>
        <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
          <div class="mb-3 hg-skeleton h-5 w-20 rounded" />
          <div class="space-y-2">
            <div class="hg-skeleton h-4 w-32 rounded" />
            <div class="hg-skeleton h-4 w-28 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
