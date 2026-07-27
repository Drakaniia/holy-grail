// src/composables/useSkillInstall.ts
// Composable for managing skill installation state.

import { ref, computed } from 'vue'
import {
  copyInstallCommand,
  generateInstallCommand,
  checkSkillInstalled,
  type InstallStatus,
} from '@/services/grailInstaller'

export function useSkillInstall(repoLink: string, slug: string) {
  const status = ref<InstallStatus>('idle')
  const isInstalled = ref(false)
  const errorMessage = ref('')

  const command = computed(() =>
    repoLink && slug ? generateInstallCommand(repoLink, slug) : '',
  )

  async function copyAndInstall() {
    status.value = 'copying'
    const ok = await copyInstallCommand(command.value)
    if (ok) {
      status.value = 'copied'
      setTimeout(() => {
        if (status.value === 'copied') status.value = 'idle'
      }, 3000)
    } else {
      status.value = 'error'
      errorMessage.value = 'Failed to copy command'
    }
  }

  async function checkInstalled() {
    isInstalled.value = await checkSkillInstalled(slug)
  }

  return {
    status,
    isInstalled,
    errorMessage,
    command,
    copyAndInstall,
    checkInstalled,
  }
}
