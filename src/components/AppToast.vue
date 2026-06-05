<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useToastStore, type ToastTone } from '@/stores/toast'

const toast = useToastStore()

function panelClasses(tone: ToastTone) {
  return [
    'pointer-events-auto flex w-full items-start gap-3 border bg-[#1f1f1f]/95 p-3 text-white shadow-2xl shadow-[#1f1f1f]/35 backdrop-blur-xl',
    tone === 'success' ? 'border-emerald-400/35' : '',
    tone === 'info' ? 'border-accent-400/35' : '',
    tone === 'error' ? 'border-red-400/40' : '',
  ]
}

function iconClasses(tone: ToastTone) {
  return [
    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border',
    tone === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : '',
    tone === 'info' ? 'border-accent-400/30 bg-accent-400/10 text-accent-200' : '',
    tone === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : '',
  ]
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed right-3 top-3 z-[140] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:top-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      <TransitionGroup name="toast">
        <article
          v-for="item in toast.toasts"
          :key="item.id"
          :class="panelClasses(item.tone)"
          role="status"
        >
          <div :class="iconClasses(item.tone)">
            <CheckCircle2 v-if="item.tone === 'success'" class="h-4 w-4" />
            <Info v-else-if="item.tone === 'info'" class="h-4 w-4" />
            <AlertCircle v-else class="h-4 w-4" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold leading-5 text-white">{{ item.title }}</p>
            <p v-if="item.message" class="mt-0.5 text-xs leading-5 text-zinc-400">
              {{ item.message }}
            </p>
          </div>

          <button
            type="button"
            class="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center text-zinc-500 transition hover:text-white"
            aria-label="Dismiss notification"
            @click="toast.removeToast(item.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
