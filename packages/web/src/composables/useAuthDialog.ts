import { shallowRef } from 'vue'
import type { AuthMode } from '@/types/auth'

type AuthDialogState = {
  isOpen: boolean
  mode: AuthMode | 'reset'
}

const state = shallowRef<AuthDialogState>({
  isOpen: false,
  mode: 'login',
})

export function useAuthDialog() {
  function openAuthDialog(mode: AuthMode | 'reset') {
    state.value = { isOpen: true, mode }
  }

  function closeAuthDialog() {
    state.value = { isOpen: false, mode: 'login' }
  }

  return {
    authDialogState: state,
    openAuthDialog,
    closeAuthDialog,
  }
}
