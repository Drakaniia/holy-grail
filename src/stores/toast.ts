import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

export type ToastTone = 'success' | 'info' | 'error'

interface ToastMessage {
  id: number
  message?: string
  title: string
  tone: ToastTone
}

interface ToastOptions {
  duration?: number
  message?: string
  title: string
  tone: ToastTone
}

const DEFAULT_TOAST_DURATION_MS = 3600
const MAX_TOASTS = 3

export const useToastStore = defineStore('toast', () => {
  const activeToasts = shallowRef<ToastMessage[]>([])
  const timers = new Map<number, ReturnType<typeof window.setTimeout>>()
  let nextToastId = 1

  const toasts = computed(() => activeToasts.value)

  function removeToast(id: number) {
    const timer = timers.get(id)

    if (timer) {
      window.clearTimeout(timer)
      timers.delete(id)
    }

    activeToasts.value = activeToasts.value.filter((toast) => toast.id !== id)
  }

  function showToast(options: ToastOptions) {
    const id = nextToastId
    nextToastId += 1

    const toast: ToastMessage = {
      id,
      message: options.message,
      title: options.title,
      tone: options.tone,
    }

    activeToasts.value = [...activeToasts.value, toast].slice(-MAX_TOASTS)

    if (typeof window !== 'undefined') {
      const timer = window.setTimeout(() => removeToast(id), options.duration ?? DEFAULT_TOAST_DURATION_MS)
      timers.set(id, timer)
    }

    return id
  }

  function success(title: string, message?: string) {
    return showToast({ title, message, tone: 'success' })
  }

  function info(title: string, message?: string) {
    return showToast({ title, message, tone: 'info' })
  }

  function error(title: string, message?: string) {
    return showToast({ title, message, tone: 'error', duration: 5200 })
  }

  return {
    error,
    info,
    removeToast,
    showToast,
    success,
    toasts,
  }
})
