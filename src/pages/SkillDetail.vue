<script setup lang="ts">
import { computed, ref, watch, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Tag,
  User,
} from 'lucide-vue-next'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import SkillContentSkeleton from '@/components/skills/SkillContentSkeleton.vue'
import SkillDetailSkeleton from '@/components/skills/SkillDetailSkeleton.vue'
import { useSkillsStore } from '@/stores/skills'

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

watch(
  slug,
  () => {
    void loadSkillContent()
  },
  { immediate: true },
)

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
    <div v-if="skill" class="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <!-- Back Button -->
      <button
        @click="router.push(backRoute)"
        class="mb-8 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft class="h-4 w-4" />
        <span class="text-sm">Back to Skills</span>
      </button>

      <!-- Header -->
      <div class="mb-8">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 class="min-w-0 break-words text-3xl font-bold text-white md:text-4xl">
            {{ skill.title }}
          </h1>
          <BookmarkButton v-if="bookmarkResource" :resource="bookmarkResource" variant="detail" />
        </div>
        <p class="text-base leading-relaxed text-gray-400">
          {{ skill.description }}
        </p>
      </div>

      <!-- Simplified Stats Bar -->
      <div class="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
        <div class="flex items-center gap-1.5">
          <Eye class="h-4 w-4" />
          <span>{{ formatNumber(skill.views) }} views</span>
        </div>
        <span class="text-gray-600">·</span>
        <div class="flex items-center gap-1.5">
          <Code2 class="h-4 w-4" />
          <span>{{ formatNumber(skill.uses) }} uses</span>
        </div>
        <span class="text-gray-600">·</span>
        <div class="flex items-center gap-1.5">
          <User class="h-4 w-4" />
          <span>By {{ skill.authorName }}</span>
        </div>
        <span class="text-gray-600">·</span>
        <div class="flex min-w-0 items-center gap-1.5">
          <ExternalLink class="h-4 w-4 shrink-0" />
          <a
            :href="`https://github.com/${skill.repoLink}`"
            target="_blank"
            class="break-all transition-colors hover:text-accent-400"
          >
            {{ skill.repoLink }}
          </a>
        </div>
      </div>

      <!-- Tag badges -->
      <div v-if="skill.tags.length" class="mb-6 flex flex-wrap gap-2">
        <span
          v-for="tag in skill.tags"
          :key="tag"
          class="flex items-center gap-1 rounded-md border border-gray-700 bg-[#1f1f1f] px-2 py-1 text-xs text-gray-400"
        >
          <Tag class="h-3 w-3" />
          {{ tag }}
        </span>
      </div>

      <!-- Install Command (simplified) -->
      <div class="mb-6 rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <code class="block break-all font-mono text-sm text-gray-300">{{
              getInstallCommand()
            }}</code>
          </div>
          <button
            @click="copyInstallCommand"
            class="flex w-fit flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-700 bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:border-gray-600 hover:text-white"
            :class="copied ? 'border-green-800 text-green-400' : ''"
          >
            <component :is="copied ? Check : Copy" class="h-4 w-4" />
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div
        class="min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-[#1f1f1f] p-4 sm:p-6 md:p-8"
        :aria-busy="isLoading"
      >
        <!-- Loading State -->
        <SkillContentSkeleton v-if="isLoading" />

        <!-- Error State with Fallback -->
        <div v-else-if="error" class="py-12 text-center">
          <AlertCircle class="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h3 class="mb-2 text-lg font-semibold text-white">Failed to load content</h3>
          <p class="mb-4 text-sm text-gray-400">{{ error }}</p>
          <p class="text-xs text-gray-500">
            Showing description only. Visit the
            <a
              :href="`https://github.com/${skill.repoLink}`"
              target="_blank"
              class="text-accent-400 hover:underline"
            >
              repository
            </a>
            for full documentation.
          </p>
        </div>

        <!-- Rendered Content -->
        <div
          v-else-if="contentHtml"
          class="skill-content prose prose-invert prose-sm max-w-none overflow-x-auto break-words"
          v-html="contentHtml"
        ></div>

        <!-- No Content Fallback -->
        <div v-else class="py-12 text-center">
          <p class="text-gray-500">No content available for this skill.</p>
        </div>
      </div>
    </div>

    <SkillDetailSkeleton v-else-if="store.loading" />

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

    <!-- Not Found -->
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
@reference "tailwindcss";

.skill-content :deep(h1) {
  @apply mb-4 mt-0 text-2xl font-bold text-white;
}

.skill-content :deep(h2) {
  @apply mb-3 mt-6 text-xl font-semibold text-white;
}

.skill-content :deep(h3) {
  @apply mb-2 mt-4 text-lg font-medium text-white;
}

.skill-content :deep(h4) {
  @apply mb-2 mt-4 text-base font-medium text-white;
}

.skill-content :deep(h5) {
  @apply mb-2 mt-4 text-sm font-medium text-white;
}

.skill-content :deep(h6) {
  @apply mb-2 mt-4 text-xs font-semibold uppercase text-white;
}

.skill-content :deep(p) {
  @apply mb-4 leading-relaxed text-gray-400;
}

.skill-content :deep(ul) {
  @apply mb-4 list-inside list-disc space-y-1 text-gray-400;
}

.skill-content :deep(ol) {
  @apply mb-4 list-inside list-decimal space-y-1 text-gray-400;
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
  @apply mb-4 overflow-x-auto rounded-lg border border-gray-800 bg-[#1f1f1f] p-4;
}

.skill-content :deep(pre code) {
  @apply bg-transparent p-0 text-gray-300;
}

.skill-content :deep(strong) {
  @apply font-semibold text-white;
}

.skill-content :deep(a) {
  color: #ffa54d;
}

.skill-content :deep(a:hover) {
  color: #ffc080;
}

.skill-content :deep(blockquote) {
  @apply my-4 border-l-4 border-gray-700 pl-4 italic text-gray-500;
}

.skill-content :deep(hr) {
  @apply my-6 border-gray-800;
}

.skill-content :deep(table) {
  @apply mb-4 w-full border-collapse;
}

.skill-content :deep(th) {
  @apply border-b border-gray-700 px-3 py-2 text-left text-sm font-semibold text-white;
}

.skill-content :deep(td) {
  @apply border-b border-gray-800 px-3 py-2 text-sm text-gray-400;
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
