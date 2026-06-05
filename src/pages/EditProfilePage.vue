<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { ArrowLeft, Camera, Loader2 } from 'lucide-vue-next'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useProfileEditor } from '@/composables/useProfileEditor'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const avatarInput = useTemplateRef<HTMLInputElement>('avatarInput')
const {
  avatarProcessing,
  avatarUrl,
  bio,
  changeAvatar,
  displayName,
  displayNameIsValid,
  saveError,
  saveStatus,
} = useProfileEditor()

const bioCharactersRemaining = computed(() => Math.max(0, 180 - bio.value.length))

onMounted(() => {
  void auth.initialize()
})

function openAvatarPicker() {
  avatarInput.value?.click()
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    await changeAvatar(file)
  }

  input.value = ''
}
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <RouterLink
        to="/account"
        class="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-white"
      >
        <ArrowLeft class="h-4 w-4" />
        Profile
      </RouterLink>

      <div class="mb-6 flex flex-col gap-3 border-b border-zinc-900 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-normal text-white">Edit Profile</h1>
          <p class="mt-2 text-sm text-zinc-500">Basic information</p>
        </div>

        <div class="min-h-6 text-sm font-semibold">
          <span v-if="saveStatus === 'saving'" class="inline-flex items-center gap-2 text-zinc-400">
            <Loader2 class="h-4 w-4 animate-spin" />
            Saving...
          </span>
          <span v-else-if="saveStatus === 'saved'" class="text-emerald-300">&#x2705; Saved</span>
          <span v-else-if="saveStatus === 'error'" class="text-red-300">{{ saveError }}</span>
        </div>
      </div>

      <div class="space-y-8">
        <section class="rounded-lg border border-zinc-800 bg-[#1f1f1f] p-5">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <UserAvatar
                :src="avatarUrl"
                :initial="auth.avatarInitial"
                :label="displayName || auth.displayName"
                size="xl"
                shape="circle"
              />
              <div class="min-w-0">
                <p class="truncate text-base font-bold text-white">{{ displayName || auth.displayName }}</p>
                <p class="mt-1 truncate text-sm text-zinc-500">{{ auth.profileHandle }}</p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-[#1f1f1f] px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="avatarProcessing || saveStatus === 'saving'"
              @click="openAvatarPicker"
            >
              <Loader2 v-if="avatarProcessing" class="h-4 w-4 animate-spin" />
              <Camera v-else class="h-4 w-4" />
              Change an Avatar
            </button>

            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="sr-only"
              @change="handleAvatarChange"
            />
          </div>
        </section>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-400">Display Name</span>
          <input
            v-model="displayName"
            type="text"
            maxlength="80"
            class="h-12 w-full rounded-md border border-zinc-800 bg-[#1f1f1f] px-4 text-sm font-semibold text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            :class="displayNameIsValid ? '' : 'border-red-400/70'"
            autocomplete="name"
          />
          <span v-if="!displayNameIsValid" class="mt-2 block text-xs text-red-300">
            Display name is required.
          </span>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-400">Bio</span>
          <textarea
            v-model="bio"
            maxlength="180"
            rows="4"
            class="w-full resize-none rounded-md border border-zinc-800 bg-[#1f1f1f] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-accent-400"
          ></textarea>
          <span class="mt-2 block text-xs text-zinc-600">
            {{ bioCharactersRemaining }} characters remaining
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
