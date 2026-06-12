<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const auth = useAuthStore()
</script>

<template>
  <div
    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 bg-[#1f1f1f] text-white"
    :aria-label="`Current profile: ${auth.displayName}`"
  >
    <UserAvatar
      :src="auth.avatarUrl"
      :initial="auth.avatarInitial"
      :label="auth.displayName"
      size="sm"
    />
  </div>
</template>
