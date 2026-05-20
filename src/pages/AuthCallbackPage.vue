<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const statusMessage = shallowRef('Completing sign in...')

const safeNextPath = computed(() => {
  const next = route.query.next

  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return '/account'
})

onMounted(async () => {
  const result = await auth.completeOAuthRedirect()

  if (result.ok) {
    statusMessage.value = 'Opening your account...'
    await router.replace(safeNextPath.value)
    return
  }

  statusMessage.value = result.message ?? 'Sign in could not be completed.'
  await router.replace({ name: 'login', query: { authError: statusMessage.value } })
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-black px-4 text-white">
    <div
      class="flex items-center gap-3 border border-zinc-800 bg-[#060606] px-5 py-4 text-sm text-zinc-300"
    >
      <Loader2 class="h-4 w-4 animate-spin text-accent-300" />
      <span>{{ statusMessage }}</span>
    </div>
  </div>
</template>
