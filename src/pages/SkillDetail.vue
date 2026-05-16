<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Eye, Code2, User, Tag, ExternalLink, Sparkles, Copy, Check, AlertCircle } from 'lucide-vue-next'
import { useSkillsStore } from '@/stores/skills'

const route = useRoute()
const router = useRouter()
const store = useSkillsStore()

const slug = computed(() => route.params.slug as string)
const skill = computed(() => store.getSkillBySlug(slug.value))
const skillContent = computed(() => store.getSkillContent(slug.value))
const isLoading = computed(() => store.isContentLoading(slug.value))
const error = computed(() => store.getContentError(slug.value))

const contentHtml = ref('')
const copied = ref(false)

onMounted(async () => {
  if (skill.value) {
    const content = await store.getSkillContent(slug.value)
    if (content) {
      contentHtml.value = content.html
    }
  }
})

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
  <div class="min-h-screen bg-black text-white">
    <div v-if="skill" class="max-w-4xl mx-auto px-6 py-8">
      <!-- Back Button -->
      <button
        @click="router.push('/skills')"
        class="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span class="text-sm">Back to Skills</span>
      </button>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-4">
          {{ skill.title }}
        </h1>
        <p class="text-gray-400 text-base leading-relaxed">
          {{ skill.description }}
        </p>
      </div>

      <!-- Stats Bar -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="flex flex-wrap items-center gap-6">
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
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <ExternalLink class="w-4 h-4" />
            <a :href="`https://github.com/${skill.repoLink}`" target="_blank" class="hover:text-blue-400 transition-colors">
              {{ skill.repoLink }}
            </a>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="skill.tags.length" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
          <span
            v-for="tag in skill.tags"
            :key="tag"
            class="flex items-center gap-1 px-2 py-1 bg-[#111111] border border-gray-700 rounded-md text-xs text-gray-400"
          >
            <Tag class="w-3 h-3" />
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Install Command -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Install Command</p>
            <code class="text-sm text-gray-300 font-mono">{{ getInstallCommand() }}</code>
          </div>
          <button
            @click="copyInstallCommand"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all bg-[#111111] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 flex-shrink-0 ml-4"
            :class="copied ? 'text-green-400 border-green-800' : ''"
          >
            <component :is="copied ? Check : Copy" class="w-4 h-4" />
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="border border-gray-800 rounded-xl p-6 md:p-8" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-2 text-gray-500">
            <Sparkles class="w-5 h-5 animate-pulse" />
            <span>Loading skill content from GitHub...</span>
          </div>
        </div>

        <!-- Error State with Fallback -->
        <div v-else-if="error" class="text-center py-12">
          <AlertCircle class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-white mb-2">Failed to load content</h3>
          <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
          <p class="text-gray-500 text-xs">
            Showing description only. Visit the
            <a :href="`https://github.com/${skill.repoLink}`" target="_blank" class="text-blue-400 hover:underline">
              repository
            </a>
            for full documentation.
          </p>
        </div>

        <!-- Rendered Content -->
        <div v-else-if="contentHtml" class="skill-content prose prose-invert prose-sm max-w-none" v-html="contentHtml"></div>

        <!-- No Content Fallback -->
        <div v-else class="text-center py-12">
          <p class="text-gray-500">No content available for this skill.</p>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="text-2xl font-bold text-white mb-2">Skill not found</h2>
      <p class="text-gray-400 mb-6">The skill you're looking for doesn't exist.</p>
      <button
        @click="router.push('/skills')"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Skills
      </button>
    </div>
  </div>
</template>

<style scoped>
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
  @apply bg-[#111111] text-blue-400 px-1.5 py-0.5 rounded text-sm;
}

.skill-content :deep(pre) {
  @apply bg-[#111111] border border-gray-800 rounded-lg p-4 overflow-x-auto mb-4;
}

.skill-content :deep(pre code) {
  @apply bg-transparent text-gray-300 p-0;
}

.skill-content :deep(strong) {
  @apply text-white font-semibold;
}

.skill-content :deep(a) {
  @apply text-blue-400 hover:text-blue-300;
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
</style>
