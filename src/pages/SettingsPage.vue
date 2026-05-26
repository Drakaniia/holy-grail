<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import { useProfileEditor } from '@/composables/useProfileEditor'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore } from '@/stores/bookmarks'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const auth = useAuthStore()
const bookmarks = useBookmarksStore()
const toast = useToastStore()
const {
  avatarProcessing,
  avatarUrl,
  changeAvatar,
  displayName,
  displayNameIsValid,
  saveError,
  saveStatus,
} = useProfileEditor()

const deleteDialogOpen = shallowRef(false)
const deleteError = shallowRef<string | null>(null)

onMounted(() => {
  void auth.initialize()
})

async function closeSettings() {
  await router.push({ name: 'account' })
}

function openDeleteDialog() {
  deleteError.value = null
  deleteDialogOpen.value = true
}

function closeDeleteDialog() {
  if (auth.accountDeleting) return

  deleteDialogOpen.value = false
  deleteError.value = null
}

async function handleDeleteAccount(email: string) {
  deleteError.value = null
  const result = await auth.deleteAccount(email)

  if (!result.ok) {
    deleteError.value = result.message ?? 'Account could not be deleted.'
    return
  }

  bookmarks.clear()
  toast.info('Account deleted', 'Your Holy Grail account has been removed.')
  await router.push({ name: 'login' })
}
</script>

<template>
  <SettingsDialog
    v-model:display-name="displayName"
    :avatar-initial="auth.avatarInitial"
    :avatar-processing="avatarProcessing"
    :avatar-url="avatarUrl"
    :delete-disabled="auth.accountDeleting"
    :display-name-is-valid="displayNameIsValid"
    :email="auth.user?.email ?? 'No email'"
    :handle="auth.profileHandle"
    :provider-label="auth.providerLabel"
    :save-error="saveError"
    :save-status="saveStatus"
    @change-avatar="changeAvatar"
    @close="closeSettings"
    @delete-account="openDeleteDialog"
  />

  <DeleteAccountDialog
    :deleting="auth.accountDeleting"
    :email="auth.user?.email ?? ''"
    :error="deleteError"
    :open="deleteDialogOpen"
    @cancel="closeDeleteDialog"
    @confirm="handleDeleteAccount"
  />
</template>
