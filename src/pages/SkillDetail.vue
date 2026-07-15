<script setup lang="ts">
import { computed, ref, watch, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useSkillsStore } from '@/stores/skills'
import type { SkillContent } from '@/lib/github'

import SkillBreadcrumb from '@/components/skills/SkillBreadcrumb.vue'
import SkillHero from '@/components/skills/SkillHero.vue'
import SkillNavigationTabs from '@/components/skills/SkillNavigationTabs.vue'
import SkillContentArea from '@/components/skills/SkillContentArea.vue'
import SkillSidebar from '@/components/skills/SkillSidebar.vue'
import SkillDetailSkeleton from '@/components/skills/SkillDetailSkeleton.vue'

const route = useRoute()
const router = useRouter()
const store = useSkillsStore()

const slug = computed(() => route.params.slug as string)
const skill = computed(() => store.getSkillBySlug(slug.value))

watchEffect(() => {
  if (skill.value) {
    document.title = `${skill.value.title} | Holy Grail`
  } else {
    document.title = 'Holy Grail'
  }
})

onUnmounted(() => {
  document.title = 'Holy Grail'
})

// -- State --
const activeTab = ref('overview')
const skillmdExpanded = ref(false)
const contentHtml = ref('')
const contentCache = ref<Record<string, SkillContent | null>>({})

// -- Computed --
const isLoading = computed(() => store.isContentLoading(slug.value))
const error = computed(() => store.getContentError(slug.value))

const backRoute = computed(() => {
  if (!skill.value) return '/skills/skills'
  return `/skills/${skill.value.parentCategory}`
})

const installCommand = computed(() => {
  if (!skill.value) return ''
  return `npx skills add ${skill.value.repoLink} --skill ${skill.value.slug}`
})

// Related skills: same category, excluding current, sorted by views
const relatedSkills = computed(() => {
  if (!skill.value) return []
  return store.allSkills
    .filter((s) => s.category === skill.value!.category && s.slug !== skill.value!.slug)
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map((s) => ({
      slug: s.slug,
      title: s.title,
      authorName: s.authorName,
      description: s.description,
      category: s.category,
      views: s.views,
      uses: s.uses,
      dateAdded: s.dateAdded,
    }))
})

// -- Methods --
async function loadSkillContent() {
  const currentSlug = slug.value
  contentHtml.value = ''

  if (contentCache.value[currentSlug]) {
    const cached = contentCache.value[currentSlug]
    if (cached && currentSlug === slug.value) {
      contentHtml.value = cached.html
    }
    return
  }

  await store.loadSkills()
  if (skill.value) {
    const content = await store.getSkillContent(currentSlug)
    if (content && currentSlug === slug.value) {
      contentHtml.value = content.html
      contentCache.value[currentSlug] = content
    }
  }
}

watch(
  slug,
  () => {
    activeTab.value = 'overview'
    skillmdExpanded.value = false
    void loadSkillContent()
  },
  { immediate: true },
)

function onViewDetails() {
  activeTab.value = 'installation'
}

function onScrollToHeading(headingText: string) {
  const element = document.querySelector('.skill-content')
  if (!element) return

  // Find the heading in the rendered markdown
  const allHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  for (const h of allHeadings) {
    if (h.textContent?.trim() === headingText) {
      h.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    }
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <!-- === LOADED STATE === -->
    <div v-if="skill" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Back Button -->
      <button
        @click="router.push(backRoute)"
        class="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to Skills
      </button>

      <!-- Breadcrumb -->
      <SkillBreadcrumb :skill="skill" />

      <!-- Hero Section -->
      <div class="mb-6">
        <SkillHero :skill="skill" />
      </div>

      <!-- Navigation Tabs -->
      <SkillNavigationTabs
        :active-tab="activeTab"
        @update:active-tab="activeTab = $event"
      />

      <!-- Main Content + Sidebar (two-column) -->
      <div class="mt-6 flex flex-col gap-6 lg:flex-row">
        <!-- Main Content Area -->
        <SkillContentArea
          :active-tab="activeTab"
          :skill="skill"
          :content-html="contentHtml"
          :content-loading="isLoading"
          :content-error="error"
          :skillmd-expanded="skillmdExpanded"
          :install-command="installCommand"
          :related-skills="relatedSkills"
          @toggle-skillmd="skillmdExpanded = !skillmdExpanded"
          @update:active-tab="activeTab = $event"
        />

        <!-- Sidebar (sticky on desktop) -->
        <SkillSidebar
          :install-command="installCommand"
          :content-html="contentHtml"
          :content-loaded="!!contentHtml"
          @view-details="onViewDetails"
          @scroll-to-heading="onScrollToHeading"
        />
      </div>

      <!-- Bottom Related Skills (desktop: shown only inside overview tab already; mobile: above) -->
      <div
        v-if="activeTab !== 'overview' && activeTab !== 'related' && relatedSkills.length > 0"
        class="mt-8 hidden lg:block"
      >
        <div class="border-t border-gray-800 pt-8">
          <h2 class="mb-4 text-2xl font-semibold text-white">Related Skills</h2>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <router-link
              v-for="s in relatedSkills"
              :key="s.slug"
              :to="`/skills/${s.slug}`"
              class="group rounded-xl border border-gray-800 bg-[#1f1f1f] p-4 transition-colors hover:border-gray-700"
            >
              <div class="mb-2 flex items-center gap-2">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400"
                >
                  {{ s.title.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm font-semibold text-white transition-colors group-hover:text-accent-400"
                  >
                    {{ s.title }}
                  </p>
                  <p class="text-xs text-gray-500">by {{ s.authorName }}</p>
                </div>
              </div>
              <p class="mb-3 line-clamp-2 text-xs text-gray-400">{{ s.description }}</p>
              <span
                class="inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
              >
                {{ s.category }}
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- === LOADING STATE === -->
    <SkillDetailSkeleton v-else-if="store.loading" />

    <!-- === ERROR STATE === -->
    <div v-else-if="store.loadError" class="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 class="mb-2 text-2xl font-bold text-white">Could not load skills</h2>
      <p class="mb-6 text-gray-400">{{ store.loadError }}</p>
      <button
        @click="router.push(backRoute)"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Browse Skills
      </button>
    </div>

    <!-- === NOT FOUND === -->
    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="mb-2 text-2xl font-bold text-white">Skill not found</h2>
      <p class="mb-6 text-gray-400">The skill you're looking for doesn't exist.</p>
      <button
        @click="router.push(backRoute)"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Browse Skills
      </button>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
