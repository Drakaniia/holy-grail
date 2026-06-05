<script setup lang="ts">
defineProps<{
  description: string
  title: string
}>()
</script>

<template>
  <div class="flex min-h-[48vh] items-center justify-center text-center">
    <div class="max-w-md px-4">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1f1f1f] text-zinc-500">
        <slot name="icon" />
      </div>
      <h2 class="mt-6 text-xl font-bold text-white">{{ title }}</h2>
      <p class="mt-3 text-sm leading-6 text-zinc-500">{{ description }}</p>
    </div>
  </div>
</template>
