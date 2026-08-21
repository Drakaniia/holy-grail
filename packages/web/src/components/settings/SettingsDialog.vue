<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import { Camera, Check, Eye, Loader2, Moon, SunMedium, Trash2, UserRound, X } from 'lucide-vue-next'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { ProfileSaveStatus } from '@/composables/useProfileEditor'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

type SettingsSection = 'profile' | 'appearance'

const props = defineProps<{
  avatarInitial: string
  avatarProcessing: boolean
  avatarUrl?: string | null
  deleteDisabled?: boolean
  displayName: string
  displayNameIsValid: boolean
  email: string
  handle: string
  providerLabel: string
  saveError?: string | null
  saveStatus: ProfileSaveStatus
}>()

const emit = defineEmits<{
  changeAvatar: [file: File]
  close: []
  deleteAccount: []
  'update:displayName': [value: string]
}>()

const avatarInput = useTemplateRef<HTMLInputElement>('avatarInput')
const activeSection = shallowRef<SettingsSection>('profile')
const { theme, setTheme } = useTheme()
const displayNameValue = computed({
  get: () => props.displayName,
  set: (value) => emit('update:displayName', value),
})
const sectionTitle = computed(() => (activeSection.value === 'profile' ? 'Account' : 'Appearance'))

function openAvatarPicker() {
  avatarInput.value?.click()
}

function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('changeAvatar', file)
  }

  input.value = ''
}

function selectSection(section: SettingsSection) {
  activeSection.value = section
}

function selectTheme(nextTheme: ThemeMode) {
  setTheme(nextTheme)
}
</script>

<template>
  <div
    class="settings-backdrop fixed inset-0 z-[80] overflow-y-auto bg-[#1f1f1f]/70 p-4 backdrop-blur-sm sm:p-6"
  >
    <div class="flex min-h-full items-center justify-center">
      <div
        class="settings-dialog grid h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-zinc-800 bg-[#1f1f1f] text-white shadow-2xl shadow-[#1f1f1f]/70 sm:h-[min(760px,calc(100vh-3rem))] md:grid-cols-[205px_minmax(0,1fr)] md:grid-rows-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <aside
          class="settings-aside border-b border-zinc-800 bg-[#1f1f1f] p-4 md:border-b-0 md:border-r"
        >
          <h1 id="settings-title" class="text-lg font-bold tracking-normal text-white">Settings</h1>

          <nav class="mt-9 space-y-5" aria-label="Settings sections">
            <div>
              <p class="px-2 text-xs font-semibold text-zinc-500">Account</p>
              <div class="mt-2 space-y-1">
                <button
                  type="button"
                  class="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm transition"
                  :class="
                    activeSection === 'profile'
                      ? 'bg-[#1f1f1f] font-bold text-white'
                      : 'font-semibold text-zinc-500 hover:bg-[#1f1f1f] hover:text-zinc-200'
                  "
                  :aria-current="activeSection === 'profile' ? 'page' : undefined"
                  @click="selectSection('profile')"
                >
                  <UserRound class="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  class="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm transition"
                  :class="
                    activeSection === 'appearance'
                      ? 'bg-[#1f1f1f] font-bold text-white'
                      : 'font-semibold text-zinc-500 hover:bg-[#1f1f1f] hover:text-zinc-200'
                  "
                  :aria-current="activeSection === 'appearance' ? 'page' : undefined"
                  @click="selectSection('appearance')"
                >
                  <Eye class="h-4 w-4" />
                  Appearance
                </button>
              </div>
            </div>
          </nav>
        </aside>

        <section class="settings-panel relative min-w-0 overflow-y-auto bg-[#1f1f1f]">
          <button
            type="button"
            class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] text-zinc-400 transition hover:bg-[#1f1f1f] hover:text-white"
            aria-label="Close settings"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>

          <div class="px-6 py-5 pr-16">
            <h2 class="text-base font-bold text-white">{{ sectionTitle }}</h2>
          </div>

          <div v-if="activeSection === 'profile'" class="space-y-0">
            <section class="border-b border-zinc-800 px-6 pb-6">
              <div class="settings-card rounded-lg border border-zinc-800 bg-[#1f1f1f] p-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex min-w-0 items-center gap-4">
                    <UserAvatar
                      :src="avatarUrl"
                      :initial="avatarInitial"
                      :label="displayName"
                      size="lg"
                      shape="circle"
                    />
                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-white">{{ displayName }}</p>
                      <p class="mt-1 truncate text-xs text-zinc-500">{{ handle }}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-[#1f1f1f] px-4 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="avatarProcessing || saveStatus === 'saving'"
                    @click="openAvatarPicker"
                  >
                    <Loader2 v-if="avatarProcessing" class="h-4 w-4 animate-spin" />
                    <Camera v-else class="h-4 w-4" />
                    Change Avatar
                  </button>

                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/*"
                    class="sr-only"
                    @change="handleAvatarChange"
                  />
                </div>
              </div>

              <label class="mt-7 block">
                <span class="mb-2 block text-sm font-medium text-zinc-500">Display Name</span>
                <input
                  v-model="displayNameValue"
                  type="text"
                  maxlength="80"
                  autocomplete="name"
                  class="settings-input h-10 w-full rounded-md border border-zinc-800 bg-[#1f1f1f] px-4 text-sm font-semibold text-white outline-none transition focus:border-accent-400"
                  :class="displayNameIsValid ? '' : 'border-red-400/70'"
                />
              </label>

              <div class="mt-3 min-h-5 text-xs font-semibold">
                <span
                  v-if="saveStatus === 'saving'"
                  class="inline-flex items-center gap-2 text-zinc-400"
                >
                  <Loader2 class="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
                <span v-else-if="saveStatus === 'saved'" class="text-emerald-300">Saved</span>
                <span v-else-if="saveStatus === 'error'" class="text-red-300">{{ saveError }}</span>
              </div>
            </section>

            <section class="border-b border-zinc-800 px-6 py-6">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-sm font-bold text-white">Connected account</h3>
                  <p class="mt-1 text-sm text-zinc-500">{{ email }}</p>
                </div>
                <span
                  class="inline-flex h-7 w-fit items-center rounded-md bg-emerald-500/10 px-2 text-xs font-bold text-emerald-300"
                >
                  {{ providerLabel }}
                </span>
              </div>
            </section>

            <section class="px-6 py-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-sm font-bold text-red-400">Danger Zone</h3>
                  <p class="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                    Permanently delete your account and remove access to saved account data.
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-md bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="deleteDisabled"
                  @click="emit('deleteAccount')"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </section>
          </div>

          <div v-else class="px-6 pb-6">
            <section class="settings-card rounded-lg border border-zinc-800 bg-[#1f1f1f] p-4">
              <div>
                <h3 class="text-sm font-bold text-white">Theme</h3>
                <p class="mt-1 text-sm leading-6 text-zinc-500">
                  Choose how Holy Grail appears on this device.
                </p>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  class="settings-theme-option flex min-h-28 items-start justify-between rounded-lg border p-4 text-left transition"
                  :class="
                    theme === 'dark'
                      ? 'border-accent-400 bg-accent-500/10 text-white'
                      : 'border-zinc-800 bg-[#1f1f1f] text-zinc-300 hover:border-zinc-600 hover:text-white'
                  "
                  :aria-pressed="theme === 'dark'"
                  @click="selectTheme('dark')"
                >
                  <span>
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 bg-[#1f1f1f]"
                    >
                      <Moon class="h-4 w-4" />
                    </span>
                    <span class="mt-4 block text-sm font-bold">Dark</span>
                    <span class="mt-1 block text-xs leading-5 text-zinc-500"
                      >Low-glare dark interface.</span
                    >
                  </span>
                  <Check v-if="theme === 'dark'" class="h-4 w-4 text-accent-300" />
                </button>

                <button
                  type="button"
                  class="settings-theme-option flex min-h-28 items-start justify-between rounded-lg border p-4 text-left transition"
                  :class="
                    theme === 'light'
                      ? 'border-accent-400 bg-accent-500/10 text-white'
                      : 'border-zinc-800 bg-[#1f1f1f] text-zinc-300 hover:border-zinc-600 hover:text-white'
                  "
                  :aria-pressed="theme === 'light'"
                  @click="selectTheme('light')"
                >
                  <span>
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 bg-white text-zinc-950"
                    >
                      <SunMedium class="h-4 w-4" />
                    </span>
                    <span class="mt-4 block text-sm font-bold">Light</span>
                    <span class="mt-1 block text-xs leading-5 text-zinc-500"
                      >Warm high-contrast interface.</span
                    >
                  </span>
                  <Check v-if="theme === 'light'" class="h-4 w-4 text-accent-300" />
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(html.light) .settings-dialog,
:global(html.light) .settings-panel {
  background: var(--mocha-surface);
}

:global(html.light) .settings-card,
:global(html.light) .settings-input,
:global(html.light) .settings-theme-option {
  background: var(--mocha-surface-strong);
}

:global(html.light) .settings-theme-option[aria-pressed='true'] {
  background: rgba(255, 140, 26, 0.12);
}
</style>
