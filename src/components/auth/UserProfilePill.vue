<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const auth = useAuthStore()
const email = computed(() => auth.user?.email ?? auth.profileHandle)
</script>

<template>
  <div
    class="inline-flex h-10 max-w-[12rem] items-center gap-2 rounded-lg border border-gray-700 bg-[#050505] px-2 text-left text-white"
    aria-label="Current profile"
  >
    <UserAvatar
      :src="auth.avatarUrl"
      :initial="auth.avatarInitial"
      :label="auth.displayName"
      size="sm"
    />
    <span class="hidden min-w-0 lg:block">
      <span class="block truncate text-xs font-semibold text-white">
        {{ auth.displayName }}
      </span>
      <span class="block truncate text-[10px] font-medium text-gray-500">
        {{ email }}
      </span>
    </span>
  </div>
</template>
