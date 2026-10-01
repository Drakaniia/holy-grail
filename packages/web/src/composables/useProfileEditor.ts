import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type ProfileSaveStatus = 'error' | 'idle' | 'saved' | 'saving'

const AVATAR_SIZE = 320
const AUTO_SAVE_DELAY_MS = 650
const SAVED_VISIBLE_MS = 1800

async function createAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file for your avatar.')
  }

  // createImageBitmap decodes and gives us the dimensions the crop needs, without an <img> round-trip.
  const image = await createImageBitmap(file).catch(() => {
    throw new Error('Avatar image could not be loaded.')
  })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Avatar image could not be prepared.')
  }

  const side = Math.min(image.width, image.height)
  const sourceX = Math.max(0, (image.width - side) / 2)
  const sourceY = Math.max(0, (image.height - side) / 2)

  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  image.close()

  return canvas.toDataURL('image/webp', 0.86)
}

export function useProfileEditor() {
  const auth = useAuthStore()
  const displayName = shallowRef('')
  const bio = shallowRef('')
  const avatarUrl = shallowRef<string | null>(null)
  const saveStatus = shallowRef<ProfileSaveStatus>('idle')
  const saveError = shallowRef<string | null>(null)
  const avatarProcessing = shallowRef(false)
  const lastSavedDisplayName = shallowRef('')
  const lastSavedBio = shallowRef('')
  const lastSavedAvatarUrl = shallowRef<string | null>(null)

  let hydrationInProgress = false
  let saveTimer: ReturnType<typeof window.setTimeout> | null = null
  let savedTimer: ReturnType<typeof window.setTimeout> | null = null
  let saveRequestId = 0

  const displayNameIsValid = computed(() => displayName.value.trim().length > 0)
  const hasChanges = computed(
    () =>
      displayName.value.trim() !== lastSavedDisplayName.value ||
      bio.value.trim() !== lastSavedBio.value ||
      avatarUrl.value !== lastSavedAvatarUrl.value,
  )

  function clearSaveTimer() {
    if (!saveTimer) return

    window.clearTimeout(saveTimer)
    saveTimer = null
  }

  function clearSavedTimer() {
    if (!savedTimer) return

    window.clearTimeout(savedTimer)
    savedTimer = null
  }

  function setDraftFromAuth() {
    hydrationInProgress = true
    displayName.value = auth.displayName
    bio.value = auth.bio ?? ''
    avatarUrl.value = auth.avatarUrl
    lastSavedDisplayName.value = displayName.value.trim()
    lastSavedBio.value = bio.value.trim()
    lastSavedAvatarUrl.value = avatarUrl.value
    saveStatus.value = 'idle'
    saveError.value = null
    clearSaveTimer()
    clearSavedTimer()

    window.queueMicrotask(() => {
      hydrationInProgress = false
    })
  }

  async function saveNow() {
    clearSaveTimer()

    if (!auth.user || !hasChanges.value) {
      return
    }

    if (!displayNameIsValid.value) {
      saveStatus.value = 'error'
      saveError.value = 'Display name is required.'
      return
    }

    const requestId = saveRequestId + 1
    saveRequestId = requestId
    saveStatus.value = 'saving'
    saveError.value = null
    clearSavedTimer()

    const nextDisplayName = displayName.value.trim()
    const nextBio = bio.value.trim()
    const nextAvatarUrl = avatarUrl.value
    const result = await auth.updateProfile({
      avatarUrl: nextAvatarUrl,
      bio: nextBio,
      displayName: nextDisplayName,
    })

    if (requestId !== saveRequestId) {
      return
    }

    if (!result.ok) {
      saveStatus.value = 'error'
      saveError.value = result.message ?? 'Profile could not be saved.'
      return
    }

    lastSavedDisplayName.value = nextDisplayName
    lastSavedBio.value = nextBio
    lastSavedAvatarUrl.value = nextAvatarUrl
    saveStatus.value = 'saved'

    savedTimer = window.setTimeout(() => {
      if (saveStatus.value === 'saved') {
        saveStatus.value = 'idle'
      }
    }, SAVED_VISIBLE_MS)
  }

  function scheduleSave() {
    if (hydrationInProgress || !auth.user || !hasChanges.value) {
      return
    }

    clearSaveTimer()
    saveTimer = window.setTimeout(() => {
      void saveNow()
    }, AUTO_SAVE_DELAY_MS)
  }

  async function changeAvatar(file: File) {
    avatarProcessing.value = true
    saveError.value = null

    try {
      avatarUrl.value = await createAvatarDataUrl(file)
    } catch (error) {
      saveStatus.value = 'error'
      saveError.value =
        error instanceof Error ? error.message : 'Avatar image could not be changed.'
    } finally {
      avatarProcessing.value = false
    }
  }

  watch(() => auth.user?.id, setDraftFromAuth, { immediate: true })
  watch([displayName, bio, avatarUrl], scheduleSave)

  onBeforeUnmount(() => {
    clearSaveTimer()
    clearSavedTimer()
  })

  return {
    avatarProcessing,
    avatarUrl,
    bio,
    changeAvatar,
    displayName,
    displayNameIsValid,
    hasChanges,
    saveError,
    saveNow,
    saveStatus,
  }
}
