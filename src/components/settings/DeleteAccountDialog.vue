<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  deleting?: boolean
  email: string
  error?: string | null
  open: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [email: string]
}>()

const typedEmail = shallowRef('')
const canDelete = computed(
  () =>
    props.email.trim().length > 0 &&
    typedEmail.value.trim().toLowerCase() === props.email.toLowerCase(),
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      typedEmail.value = ''
    }
  },
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[90] flex items-center justify-center bg-[#1f1f1f]/60 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-account-title"
  >
    <section
      class="w-full max-w-sm rounded-xl border border-zinc-900 bg-[#1f1f1f] p-5 text-white shadow-2xl shadow-[#1f1f1f]/80"
    >
      <h2 id="delete-account-title" class="text-lg font-bold text-white">Delete Account</h2>
      <p class="mt-2 text-sm leading-6 text-zinc-400">
        This action cannot be undone. This will permanently delete your account and associated data.
      </p>

      <label class="mt-7 block">
        <span class="block text-sm leading-6 text-zinc-400">
          To confirm, type your email
          <strong class="rounded bg-[#1f1f1f] px-1.5 py-0.5 font-mono text-zinc-100">{{
            email
          }}</strong>
          below:
        </span>
        <input
          v-model="typedEmail"
          type="email"
          autocomplete="off"
          class="mt-3 h-10 w-full rounded-md border border-zinc-800 bg-[#1f1f1f] px-3 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          placeholder="Enter your email"
        />
      </label>

      <p v-if="error" class="mt-3 text-sm font-semibold text-red-300">{{ error }}</p>

      <div class="mt-8 flex justify-end gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-bold text-zinc-100 transition hover:border-zinc-500"
          :disabled="deleting"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/45 disabled:text-red-100/70"
          :disabled="!canDelete || deleting"
          @click="emit('confirm', typedEmail)"
        >
          <Loader2 v-if="deleting" class="h-4 w-4 animate-spin" />
          Delete Account
        </button>
      </div>
    </section>
  </div>
</template>
