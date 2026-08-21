<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { AlertCircle, Bookmark, Code2, Globe2 } from 'lucide-vue-next'
import ProfileBookmarkCardSkeleton from '@/components/profile/ProfileBookmarkCardSkeleton.vue'
import ProfileBookmarkCard from '@/components/profile/ProfileBookmarkCard.vue'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore, type UserBookmark } from '@/stores/bookmarks'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import type { ProfileBookmarkItem, ProfileTab, ProfileTabKey } from '@/types/profile'

const auth = useAuthStore()
const bookmarks = useBookmarksStore()
const sites = useSitesStore()
const skills = useSkillsStore()
const activeTab = shallowRef<ProfileTabKey>('sites')

const publishedSiteCount = shallowRef(0)
const publishedSkillCount = shallowRef(0)

onMounted(() => {
  void Promise.all([
    auth.initialize(),
    bookmarks.loadBookmarks(true),
    sites.loadSites(),
    skills.loadSkills(),
  ])
})

const tabs = computed<ProfileTab[]>(() => [
  {
    caption: 'Published sites',
    count: publishedSiteCount.value,
    key: 'sites',
    label: 'Sites',
  },
  {
    caption: 'Saved resources',
    count: bookmarks.bookmarkCount,
    key: 'bookmarks',
    label: 'Bookmarks',
  },
  {
    caption: 'Published skills',
    count: publishedSkillCount.value,
    key: 'skills',
    label: 'Skills',
  },
])

const bookmarkItems = computed<ProfileBookmarkItem[]>(() =>
  bookmarks.bookmarks.map((bookmark) => {
    if (bookmark.resource_type === 'site') {
      const site = sites.getSiteBySlug(bookmark.resource_slug)

      return {
        category: site?.category ?? bookmark.category ?? 'Site',
        description: site?.description ?? 'Saved site from your Holy Grail library.',
        externalUrl: site?.website ?? bookmark.url,
        id: bookmark.id,
        route: `/sites/${bookmark.resource_slug}`,
        title: site?.name ?? bookmark.title,
        type: bookmark.resource_type,
      }
    }

    const skill = skills.getSkillBySlug(bookmark.resource_slug)

    return {
      category: skill?.category ?? bookmark.category ?? 'Skill',
      description: skill?.description ?? 'Saved skill from your Holy Grail library.',
      externalUrl: skill ? `https://github.com/${skill.repoLink}` : bookmark.url,
      id: bookmark.id,
      route: `/skills/${bookmark.resource_slug}`,
      title: skill?.title ?? bookmark.title,
      type: bookmark.resource_type,
    }
  }),
)

async function removeBookmark(id: string) {
  const bookmark = bookmarks.bookmarks.find((item: UserBookmark) => item.id === id)
  if (!bookmark) return

  await bookmarks.removeBookmark(bookmark.id)
}
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <ProfileHeader
      :avatar-url="auth.avatarUrl"
      :avatar-initial="auth.avatarInitial"
      :bio="auth.bio"
      :bookmark-count="bookmarks.bookmarkCount"
      :display-name="auth.displayName"
      :handle="auth.profileHandle"
      :site-count="publishedSiteCount"
      :skill-count="publishedSkillCount"
    />

    <div class="border-b border-zinc-900 bg-[#1f1f1f] px-4 py-4 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <ProfileTabs :tabs="tabs" :active-tab="activeTab" @select="activeTab = $event" />
      </div>
    </div>

    <main class="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileEmptyState
        v-if="activeTab === 'sites'"
        title="No published sites yet"
        description="Approved site submissions will appear here."
      >
        <template #icon>
          <Globe2 class="h-6 w-6" />
        </template>
      </ProfileEmptyState>

      <section v-else-if="activeTab === 'bookmarks'">
        <div
          v-if="bookmarks.actionError"
          class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ bookmarks.actionError }}</span>
        </div>

        <div
          v-if="bookmarks.loading && bookmarkItems.length === 0"
          class="grid gap-4 lg:grid-cols-2"
          aria-busy="true"
          aria-label="Loading bookmarks"
        >
          <ProfileBookmarkCardSkeleton v-for="index in 4" :key="index" />
        </div>

        <ProfileEmptyState
          v-else-if="bookmarkItems.length === 0"
          title="No bookmarks yet"
          description="Saved sites and skills will appear here."
        >
          <template #icon>
            <Bookmark class="h-6 w-6" />
          </template>
        </ProfileEmptyState>

        <div v-else class="grid gap-4 lg:grid-cols-2">
          <ProfileBookmarkCard
            v-for="item in bookmarkItems"
            :key="item.id"
            :item="item"
            :disabled="bookmarks.loading"
            @remove="removeBookmark"
          />
        </div>
      </section>

      <ProfileEmptyState
        v-else
        title="No published skills yet"
        description="Published skill entries will appear here."
      >
        <template #icon>
          <Code2 class="h-6 w-6" />
        </template>
      </ProfileEmptyState>
    </main>
  </div>
</template>
