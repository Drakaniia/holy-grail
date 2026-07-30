<script setup lang="ts">
import { onMounted } from 'vue'
import { Share2 } from 'lucide-vue-next'
import { useSkillInstall } from '@/composables/useSkillInstall'
import InstallButton from './InstallButton.vue'

const props = defineProps<{
  installCommand: string
}>()

const repoLink = props.installCommand.split(' ')[3] || ''
const slug = props.installCommand.split('--skill ')[1] || ''
const { status, isInstalled, command, copyAndInstall, checkInstalled } = useSkillInstall(
  repoLink,
  slug,
)

onMounted(() => {
  void checkInstalled()
})
</script>

<template>
  <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
    <InstallButton
      :status="status"
      :is-installed="isInstalled"
      :command="command"
      @install="copyAndInstall"
    />

    <p class="mt-2 text-xs text-gray-500">
      <template v-if="status === 'copied' && !isInstalled">
        Command copied! Run it in your terminal to install.
      </template>
      <template v-else-if="isInstalled"> This skill is already installed locally. </template>
      <template v-else> Copies the install command to your clipboard. </template>
    </p>

    <button
      class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 py-2 text-sm text-gray-500 transition-colors hover:text-white"
      title="Share"
    >
      <Share2 class="h-4 w-4" />
      Share
    </button>
  </div>
</template>
