<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps<{
  skill: {
    title: string
    parentCategory?: string
  } | null
}>()

function handleNavigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav v-if="skill" class="mb-6 flex items-center gap-2 text-xs text-gray-500">
    <button @click="handleNavigate('/skills/skills')" class="transition-colors hover:text-white">
      Skills
    </button>
    <template v-if="skill.parentCategory">
      <span class="text-gray-600">/</span>
      <button
        @click="handleNavigate(`/skills/${skill.parentCategory}`)"
        class="transition-colors hover:text-white"
      >
        {{ skill.parentCategory }}
      </button>
    </template>
    <span class="text-gray-600">/</span>
    <span class="text-gray-400">{{ skill.title }}</span>
  </nav>
</template>
