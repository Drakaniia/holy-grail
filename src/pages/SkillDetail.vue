<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowLeft, Check, Code2, Copy, ExternalLink, Eye, Tag, User } from 'lucide-vue-next'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import SkillContentSkeleton from '@/components/skills/SkillContentSkeleton.vue'
import SkillDetailSkeleton from '@/components/skills/SkillDetailSkeleton.vue'
import { useSkillsStore } from '@/stores/skills'

const route = useRoute()
const router = useRouter()
const store = useSkillsStore()

const slug = computed(() => route.params.slug as string)
const skill = computed(() => store.getSkillBySlug(slug.value))
const bookmarkResource = computed(() => {
  if (!skill.value) {
    return null
  }

  return {
    type: 'skill' as const,
    slug: skill.value.slug,
    title: skill.value.title,
    url: `https://github.com/${skill.value.repoLink}`,
    category: skill.value.category,
  }
})
const isLoading = computed(() => store.isContentLoading(slug.value))
const error = computed(() => store.getContentError(slug.value))

const backRoute = computed(() => {
  if (!skill.value) return '/skills/skills'
  return `/skills/${skill.value.parentCategory}`
})

const contentHtml = ref('')
const copied = ref(false)

async function loadSkillContent() {
  const currentSlug = slug.value
  contentHtml.value = ''
  await store.loadSkills()

  if (skill.value) {
    const content = await store.getSkillContent(currentSlug)
    if (content && currentSlug === slug.value) {
      contentHtml.value = content.html
    }
  }
}

watch(slug, () => {
  void loadSkillContent()
}, { immediate: true })

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

function getInstallCommand(): string {
  if (!skill.value) return ''
  return `npx skills add ${skill.value.repoLink} --skill ${skill.value.slug}`
}

async function copyInstallCommand() {
  const command = getInstallCommand()
  try {
    await navigator.clipboard.writeText(command)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = command
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <div v-if="skill" class="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <!-- Back Button -->
      <button
        @click="router.push(backRoute)"
        class="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span class="text-sm">Back to Skills</span>
      </button>

      <!-- Header -->
      <div class="mb-8">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 class="min-w-0 break-words text-3xl font-bold text-white md:text-4xl">
            {{ skill.title }}
          </h1>
          <BookmarkButton
            v-if="bookmarkResource"
            :resource="bookmarkResource"
            variant="detail"
          />
        </div>
        <p class="text-gray-400 text-base leading-relaxed">
          {{ skill.description }}
        </p>
      </div>

      <!-- Stats Bar -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)">
        <div class="flex flex-wrap items-center gap-4 sm:gap-6">
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <Eye class="w-4 h-4" />
            <span>{{ formatNumber(skill.views) }} views</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <Code2 class="w-4 h-4" />
            <span>{{ formatNumber(skill.uses) }} uses</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <User class="w-4 h-4" />
            <span>By {{ skill.authorName }}</span>
          </div>
          <div class="flex min-w-0 items-center gap-2 text-sm text-gray-400">
            <ExternalLink class="w-4 h-4" />
            <a :href="`https://github.com/${skill.repoLink}`" target="_blank" class="break-all transition-colors hover:text-accent-400">
              {{ skill.repoLink }}
            </a>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="skill.tags.length" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
          <span
            v-for="tag in skill.tags"
            :key="tag"
            class="flex items-center gap-1 px-2 py-1 bg-[#1f1f1f] border border-gray-700 rounded-md text-xs text-gray-400"
          >
            <Tag class="w-3 h-3" />
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Install Command -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Install Command</p>
            <code class="block break-all font-mono text-sm text-gray-300">{{ getInstallCommand() }}</code>
          </div>
          <button
            @click="copyInstallCommand"
            class="flex w-fit flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-700 bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:border-gray-600 hover:text-white"
            :class="copied ? 'text-green-400 border-green-800' : ''"
          >
            <component :is="copied ? Check : Copy" class="w-4 h-4" />
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div
        class="min-w-0 overflow-hidden border border-gray-800 rounded-xl p-4 sm:p-6 md:p-8"
        style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
        :aria-busy="isLoading"
      >
        <!-- Loading State -->
        <SkillContentSkeleton v-if="isLoading" />

        <!-- Error State with Fallback -->
        <div v-else-if="error" class="text-center py-12">
          <AlertCircle class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-white mb-2">Failed to load content</h3>
          <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
          <p class="text-gray-500 text-xs">
            Showing description only. Visit the
            <a :href="`https://github.com/${skill.repoLink}`" target="_blank" class="text-accent-400 hover:underline">
              repository
            </a>
            for full documentation.
          </p>
        </div>

        <!-- Rendered Content -->
        <div v-else-if="contentHtml" class="skill-content prose prose-invert prose-sm max-w-none overflow-x-auto break-words" v-html="contentHtml"></div>

        <!-- No Content Fallback -->
        <div v-else class="text-center py-12">
          <p class="text-gray-500">No content available for this skill.</p>
        </div>
      </div>
    </div>

    <SkillDetailSkeleton v-else-if="store.loading" />

    <div v-else-if="store.loadError" class="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 class="text-2xl font-bold text-white mb-2">Could not load skills</h2>
      <p class="text-gray-400 mb-6">{{ store.loadError }}</p>
      <button
        @click="router.push(backRoute)"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Skills
      </button>
    </div>

    <!-- Not Found -->
    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="text-2xl font-bold text-white mb-2">Skill not found</h2>
      <p class="text-gray-400 mb-6">The skill you're looking for doesn't exist.</p>
      <button
        @click="router.push(backRoute)"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Skills
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.skill-content :deep(h1) {
  @apply text-2xl font-bold text-white mb-4 mt-0;
}

.skill-content :deep(h2) {
  @apply text-xl font-semibold text-white mb-3 mt-6;
}

.skill-content :deep(h3) {
  @apply text-lg font-medium text-white mb-2 mt-4;
}

.skill-content :deep(h4) {
  @apply text-base font-medium text-white mb-2 mt-4;
}

.skill-content :deep(h5) {
  @apply text-sm font-medium text-white mb-2 mt-4;
}

.skill-content :deep(h6) {
  @apply text-xs font-semibold uppercase text-white mb-2 mt-4;
}

.skill-content :deep(p) {
  @apply text-gray-400 mb-4 leading-relaxed;
}

.skill-content :deep(ul) {
  @apply list-disc list-inside text-gray-400 mb-4 space-y-1;
}

.skill-content :deep(ol) {
  @apply list-decimal list-inside text-gray-400 mb-4 space-y-1;
}

.skill-content :deep(li) {
  @apply text-gray-400;
}

.skill-content :deep(code) {
  background: #1f1f1f;
  color: #ffa54d;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.skill-content :deep(pre) {
  @apply bg-[#1f1f1f] border border-gray-800 rounded-lg p-4 overflow-x-auto mb-4;
}

.skill-content :deep(pre code) {
  @apply bg-transparent text-gray-300 p-0;
}

.skill-content :deep(strong) {
  @apply text-white font-semibold;
}

.skill-content :deep(a) {
  color: #ffa54d;
}

.skill-content :deep(a:hover) {
  color: #ffc080;
}

.skill-content :deep(blockquote) {
  @apply border-l-4 border-gray-700 pl-4 text-gray-500 italic my-4;
}

.skill-content :deep(hr) {
  @apply border-gray-800 my-6;
}

.skill-content :deep(table) {
  @apply w-full border-collapse mb-4;
}

.skill-content :deep(th) {
  @apply text-left text-sm font-semibold text-white border-b border-gray-700 px-3 py-2;
}

.skill-content :deep(td) {
  @apply text-sm text-gray-400 border-b border-gray-800 px-3 py-2;
}

:global(html.light .skill-content h1),
:global(html.light .skill-content h2),
:global(html.light .skill-content h3),
:global(html.light .skill-content h4),
:global(html.light .skill-content h5),
:global(html.light .skill-content h6),
:global(html.light .skill-content strong),
:global(html.light .skill-content th) {
  color: var(--mocha-text) !important;
}

:global(html.light .skill-content p),
:global(html.light .skill-content ul),
:global(html.light .skill-content ol),
:global(html.light .skill-content li),
:global(html.light .skill-content td) {
  color: var(--mocha-text-soft) !important;
}

:global(html.light .skill-content blockquote) {
  border-left-color: var(--mocha-border-strong) !important;
  color: var(--mocha-muted) !important;
}

:global(html.light .skill-content hr),
:global(html.light .skill-content th),
:global(html.light .skill-content td) {
  border-color: var(--mocha-border) !important;
}

:global(html.light .skill-content pre),
:global(html.light .skill-content code) {
  background-color: #1f1f1f !important;
}

:global(html.light .skill-content pre code) {
  color: #f4e7d8 !important;
}
</style>
