<script setup lang="ts">
import SkillSummary from './SkillSummary.vue'
import SkillMDViewer from './SkillMDViewer.vue'
import SkillRatings from './SkillRatings.vue'
import SkillReviews from './SkillReviews.vue'
import InstallationTab from './InstallationTab.vue'
import SkillMDTab from './SkillMDTab.vue'
import ResourcesTab from './ResourcesTab.vue'
import RelatedSkillsTab from './RelatedSkillsTab.vue'
import VersionHistoryTab from './VersionHistoryTab.vue'
import SkillPreviewTab from './SkillPreviewTab.vue'
import SkillUsageTab from './SkillUsageTab.vue'

interface SkillInfo {
  description: string
  repoLink: string
  parentCategory?: string
  title?: string
  tags?: string[]
}

interface RelatedSkill {
  slug: string
  title: string
  authorName: string
  description: string
  category: string
  views: number
  uses: number
  dateAdded: string
}

defineProps<{
  activeTab: string
  skill: SkillInfo | null
  contentHtml: string
  contentLoading: boolean
  contentError: string | null
  skillmdExpanded: boolean
  installCommand: string
  relatedSkills: RelatedSkill[]
}>()

const emit = defineEmits<{
  'toggle-skillmd': []
  'update:activeTab': [tabId: string]
}>()
</script>

<template>
  <div class="min-w-0 flex-1">
    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-8">
      <SkillSummary :description="skill?.description ?? ''" />

      <SkillMDViewer
        :content-html="contentHtml"
        :expanded="skillmdExpanded"
        :loading="contentLoading"
        :error="contentError"
        @toggle-expand="emit('toggle-skillmd')"
      />

      <!-- Ratings & Reviews -- TODO: show when data available -->
      <SkillRatings />
      <SkillReviews />

      <!-- Related Skills at bottom -->
      <div class="block lg:hidden">
        <div class="border-t border-gray-800 pt-8">
          <h2 class="mb-4 text-2xl font-semibold text-white">Related Skills</h2>
          <RelatedSkillsTab :skills="relatedSkills" />
        </div>
      </div>
    </div>

    <!-- Preview Tab -->
    <div v-else-if="activeTab === 'preview'">
      <SkillPreviewTab :skill="skill" />
    </div>

    <!-- Usage Tab -->
    <div v-else-if="activeTab === 'usage'">
      <SkillUsageTab :content-html="contentHtml" :loading="contentLoading" :error="contentError" />
    </div>

    <!-- Installation Tab -->
    <div v-else-if="activeTab === 'installation'">
      <InstallationTab :install-command="installCommand" />
    </div>

    <!-- SKILL.md Tab -->
    <div v-else-if="activeTab === 'skillmd'">
      <SkillMDTab :content-html="contentHtml" :loading="contentLoading" :error="contentError" />
    </div>

    <!-- Resources Tab -->
    <div v-else-if="activeTab === 'resources'">
      <ResourcesTab :repo-link="skill?.repoLink ?? ''" />
    </div>

    <!-- Related Skills Tab -->
    <div v-else-if="activeTab === 'related'">
      <RelatedSkillsTab :skills="relatedSkills" />
    </div>

    <!-- Version History Tab -->
    <div v-else-if="activeTab === 'history'">
      <VersionHistoryTab />
    </div>
  </div>
</template>
