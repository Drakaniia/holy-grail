<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Bookmark, ExternalLink, Sparkles, Trash2 } from 'lucide-vue-next'
import { useBookmarksStore, type UserBookmark } from '@/stores/bookmarks'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'

const bookmarks = useBookmarksStore()
const sites = useSitesStore()
const skills = useSkillsStore()

onMounted(() => {
  void bookmarks.loadBookmarks(true)
})

const savedItems = computed(() =>
  bookmarks.bookmarks.map(bookmark => {
    if (bookmark.resource_type === 'site') {
      const site = sites.getSiteBySlug(bookmark.resource_slug)
      return {
        bookmark,
        title: site?.name ?? bookmark.title,
        description: site?.description ?? 'Saved site from your Holy Grail library.',
        category: site?.category ?? bookmark.category ?? 'Site',
        route: `/sites/${bookmark.resource_slug}`,
        externalUrl: site?.website ?? bookmark.url,
      }
    }

    const skill = skills.getSkillBySlug(bookmark.resource_slug)
    return {
      bookmark,
      title: skill?.title ?? bookmark.title,
      description: skill?.description ?? 'Saved skill from your Holy Grail library.',
      category: skill?.category ?? bookmark.category ?? 'Skill',
      route: `/skills/${bookmark.resource_slug}`,
      externalUrl: skill ? `https://github.com/${skill.repoLink}` : bookmark.url,
    }
  })
)

async function removeBookmark(bookmark: UserBookmark) {
  await bookmarks.removeBookmark(bookmark.id)
}
</script>

<template>
  <div class="min-h-full bg-black text-white">
    <div class="mx-auto max-w-7xl px-6 py-10">
      <div class="mb-8 flex flex-col gap-5 border-b border-gray-800 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
            Saved Library
          </p>
          <h1 class="text-4xl font-bold tracking-normal text-white">Bookmarks</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Keep the sites and skills you want to revisit in one account-backed collection.
          </p>
        </div>

        <div class="border border-gray-800 bg-[#060606] px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Saved
          </p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-white">{{ bookmarks.bookmarkCount }}</span>
            <span class="text-sm text-gray-500">items</span>
          </div>
        </div>
      </div>

      <div
        v-if="bookmarks.actionError"
        class="mb-6 border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-100"
      >
        {{ bookmarks.actionError }}
      </div>

      <div v-if="bookmarks.loading && savedItems.length === 0" class="flex items-center justify-center py-20">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles class="h-5 w-5 animate-pulse text-accent-300" />
          Loading bookmarks...
        </div>
      </div>

      <div
        v-else-if="savedItems.length === 0"
        class="border border-gray-800 bg-[#060606] px-6 py-16 text-center"
      >
        <Bookmark class="mx-auto h-10 w-10 text-gray-600" />
        <h2 class="mt-5 text-2xl font-bold text-white">No bookmarks yet</h2>
        <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">
          Save useful sites and skills from cards or detail pages. They will sync to your Supabase account.
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <RouterLink
            to="/sites/platforms"
            class="inline-flex h-10 items-center justify-center border border-gray-700 px-4 text-sm font-semibold text-gray-200 transition hover:border-accent-400 hover:text-accent-100"
          >
            Browse sites
          </RouterLink>
          <RouterLink
            to="/skills/skills"
            class="inline-flex h-10 items-center justify-center border border-gray-700 px-4 text-sm font-semibold text-gray-200 transition hover:border-accent-400 hover:text-accent-100"
          >
            Browse skills
          </RouterLink>
        </div>
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="item in savedItems"
          :key="item.bookmark.id"
          class="border border-gray-800 bg-[#060606] p-5 transition hover:border-gray-700"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="border border-gray-700 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {{ item.bookmark.resource_type }}
                </span>
                <span class="text-xs text-gray-500">{{ item.category }}</span>
              </div>
              <RouterLink
                :to="item.route"
                class="block truncate text-lg font-bold text-white transition hover:text-accent-300"
              >
                {{ item.title }}
              </RouterLink>
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                {{ item.description }}
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center border border-gray-800 text-gray-500 transition hover:border-red-400 hover:text-red-200"
              aria-label="Remove bookmark"
              :disabled="bookmarks.loading"
              @click="removeBookmark(item.bookmark)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-5 flex items-center justify-between gap-3 border-t border-gray-800 pt-4">
            <RouterLink
              :to="item.route"
              class="text-sm font-semibold text-accent-300 transition hover:text-accent-100"
            >
              Open details
            </RouterLink>
            <a
              v-if="item.externalUrl"
              :href="item.externalUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-white"
            >
              Source
              <ExternalLink class="h-3.5 w-3.5" />
            </a>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
