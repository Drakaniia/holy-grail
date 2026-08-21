<script setup lang="ts">
import SkillCTACard from './SkillCTACard.vue'
import SkillInstallCard from './SkillInstallCard.vue'
import SkillFileTreeCard from './SkillFileTreeCard.vue'

defineProps<{
  installCommand: string
  contentHtml: string | null
  contentLoaded: boolean
}>()

const emit = defineEmits<{
  'view-details': []
  'scroll-to-heading': [text: string]
}>()
</script>

<template>
  <aside class="w-full space-y-4 lg:w-80 xl:w-96">
    <div class="lg:sticky lg:top-24 lg:space-y-4">
      <SkillCTACard :install-command="installCommand" />

      <SkillInstallCard :install-command="installCommand" @view-details="emit('view-details')" />

      <SkillFileTreeCard
        :content-html="contentHtml"
        :content-loaded="contentLoaded"
        @scroll-to-heading="emit('scroll-to-heading', $event)"
      />
    </div>
  </aside>
</template>
