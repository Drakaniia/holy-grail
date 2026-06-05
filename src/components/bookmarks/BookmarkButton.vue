<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bookmark, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore, type BookmarkResource } from '@/stores/bookmarks'

const props = withDefaults(
  defineProps<{
    resource: BookmarkResource
    variant?: 'compact' | 'detail'
  }>(),
  {
    variant: 'compact',
  }
)

const auth = useAuthStore()
const bookmarks = useBookmarksStore()
const route = useRoute()
const router = useRouter()
const saving = shallowRef(false)

const isSaved = computed(() => bookmarks.isBookmarked(props.resource.type, props.resource.slug))
const buttonLabel = computed(() => {
  if (!auth.isAuthenticated) {
    return `Sign in to save ${props.resource.title}`
  }

  return isSaved.value ? `Remove ${props.resource.title} from bookmarks` : `Save ${props.resource.title}`
})

onMounted(() => {
  if (auth.isAuthenticated) {
    void bookmarks.loadBookmarks()
  }
})

async function handleClick() {
  await auth.initialize()

  if (!auth.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  saving.value = true
  try {
    await bookmarks.toggleBookmark(props.resource)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      variant === 'detail' ? 'h-9 gap-2 px-3' : 'h-9 w-9',
      isSaved
        ? 'border-accent-500/40 bg-accent-500/15 text-accent-100 hover:border-accent-400'
        : 'border-gray-800 bg-[#1f1f1f] text-gray-400 hover:border-gray-700 hover:text-white',
    ]"
    :aria-label="buttonLabel"
    :title="buttonLabel"
    :disabled="saving"
    @click.stop.prevent="handleClick"
  >
    <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
    <Bookmark
      v-else
      class="h-4 w-4"
      :class="isSaved ? 'fill-current' : ''"
    />
    <span v-if="variant === 'detail'">{{ isSaved ? 'Saved' : 'Save' }}</span>
  </button>
</template>
