<script setup lang="ts">
defineProps<{
  description: string
}>()
</script>

<template>
  <section>
    <h2 class="mb-4 text-2xl font-semibold text-white">Summary</h2>
    <div v-if="description" class="max-w-none leading-relaxed text-gray-400">
      <p>{{ description }}</p>
    </div>
    <p v-else class="text-gray-500">No description available.</p>
  </section>
</template>
