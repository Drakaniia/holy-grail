<script setup lang="ts">
import { onMounted } from 'vue'
import { useSkillInstall } from '@/composables/useSkillInstall'
import InstallButton from './InstallButton.vue'

const props = defineProps<{
  installCommand: string
}>()

const emit = defineEmits<{
  'view-details': []
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
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium text-white">Installation Method</h3>
      <button
        @click="emit('view-details')"
        class="text-xs text-accent-500 transition-colors hover:text-accent-400"
      >
        View Details →
      </button>
    </div>

    <InstallButton
      :status="status"
      :is-installed="isInstalled"
      :command="command"
      @install="copyAndInstall"
    />

    <p class="mt-2 text-xs text-gray-500">
      <template v-if="status === 'copied' && !isInstalled">
        Command copied! Paste it in your terminal.
      </template>
      <template v-else-if="isInstalled"> Already installed locally. </template>
      <template v-else> Click to copy the grail install command. </template>
    </p>
  </div>
</template>
