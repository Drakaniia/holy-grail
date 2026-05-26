<script setup lang="ts">
import { Bookmark, Code2, Globe2, Pencil } from 'lucide-vue-next'
import UserAvatar from '@/components/auth/UserAvatar.vue'

defineProps<{
  avatarInitial: string
  avatarUrl?: string | null
  bio?: string | null
  bookmarkCount: number
  displayName: string
  handle: string
  siteCount: number
  skillCount: number
}>()
</script>

<template>
  <section class="border-b border-zinc-900 bg-[#050505] px-4 py-7 text-white sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div class="flex min-w-0 items-start gap-4 sm:gap-5">
        <UserAvatar
          :src="avatarUrl"
          :initial="avatarInitial"
          :label="displayName"
          size="xl"
          shape="circle"
        />

        <div class="min-w-0 pt-1">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="min-w-0 break-words text-2xl font-bold tracking-normal text-white sm:text-3xl">
              {{ displayName }}
            </h1>

            <RouterLink
              to="/account/edit"
              class="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-zinc-800 bg-black px-3 text-xs font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-950"
            >
              <Pencil class="h-3.5 w-3.5" />
              Edit Profile
            </RouterLink>
          </div>

          <p class="mt-1 truncate text-sm text-zinc-500">{{ handle }}</p>
          <p v-if="bio" class="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{{ bio }}</p>

          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500">
            <span class="inline-flex items-center gap-1.5">
              <Globe2 class="h-4 w-4 text-zinc-600" />
              <strong class="font-bold text-white">{{ siteCount }}</strong>
              <span>sites</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Bookmark class="h-4 w-4 text-zinc-600" />
              <strong class="font-bold text-white">{{ bookmarkCount }}</strong>
              <span>bookmarks</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Code2 class="h-4 w-4 text-zinc-600" />
              <strong class="font-bold text-white">{{ skillCount }}</strong>
              <span>skills</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
