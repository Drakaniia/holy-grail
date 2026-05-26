<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Star,
  Users,
  GitCommit,
  Tag,
  BookOpen,
  Code2,
  ExternalLink,
  Globe,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Monitor,
  Package,
  Shield,
  Heart,
  Share2,
  Layers,
  X,
} from 'lucide-vue-next'
import { useSitesStore } from '@/stores/sites'
import BookmarkButton from '@/components/bookmarks/BookmarkButton.vue'
import SiteIssueReport from '@/components/sites/SiteIssueReport.vue'
import SiteFavicon from '@/components/sites/SiteFavicon.vue'
import SitePreview from '@/components/sites/SitePreview.vue'

const collectionLabels: Record<string, string> = {
  '3d': '3D',
  ai: 'AI',
  anime: 'Anime',
  api: 'API',
  automation: 'Automation',
  chat: 'Chat',
  'cli-tools': 'CLI Tools',
  'cloud-hosting': 'Cloud & Hosting',
  design: 'Design',
  'design-tools': 'Design Tools',
  detector: 'Detector',
  development: 'Development',
  downloads: 'Downloads',
  fonts: 'Fonts',
  'game-download': 'Game Download',
  icons: 'Icons',
  'icons-svg': 'Icons/SVG',
  image: 'Images',
  inspiration: 'Inspiration',
  learning: 'Learning',
  mcp: 'MCP',
  md: 'MD',
  ml: 'Machine Learning',
  monitoring: 'Monitoring',
  movies: 'Movies',
  others: 'Others',
  ppt: 'PPT',
  prompts: 'Prompts',
  references: 'References',
  repositories: 'Repositories',
  'software-download': 'Software Download',
  tooling: 'Tooling',
  torrents: 'Torrents',
  'ui-libraries': 'UI Libraries',
  video: 'Videos',
  'vfx-download': 'VFX Download',
  watch: 'Watch',
  wb: 'Website Development',
}

const route = useRoute()
const router = useRouter()
const store = useSitesStore()
void store.loadSites()

const slug = computed(() => route.params.slug as string)
const site = computed(() => store.getSiteBySlug(slug.value))
const bookmarkResource = computed(() => {
  if (!site.value) {
    return null
  }

  return {
    type: 'site' as const,
    slug: site.value.slug,
    title: site.value.name,
    url: site.value.website,
    category: site.value.category,
  }
})
const hasSourceCode = computed(() => Boolean(site.value?.sourceCode))
const hasReleaseInfo = computed(() => hasSourceCode.value && site.value?.lastRelease !== 'N/A')
const hasCommitInfo = computed(() => hasSourceCode.value && site.value?.lastCommit !== 'N/A')
const hasDistinctDocs = computed(() => Boolean(site.value?.docs && site.value.docs !== site.value.website))
const hasDeploymentInfo = computed(
  () =>
    Boolean(site.value?.deployCompose) ||
    Boolean(site.value?.installCommand) ||
    Boolean(site.value?.website) ||
    hasDistinctDocs.value ||
    hasSourceCode.value
)
const isCliToolSite = computed(() =>
  site.value?.parentCategory === 'cli-tools' || site.value?.subcategory === 'cli-tools'
)
const installCommand = computed(() => {
  if (!isCliToolSite.value) {
    return ''
  }

  return site.value.installCommand || ''
})
const hasInstallCommand = computed(() => Boolean(installCommand.value))
const hasRepoActivity = computed(
  () =>
    hasSourceCode.value &&
    Boolean(
      (site.value?.contributors || 0) > 0 ||
        (site.value?.commitsThisYear || 0) > 0 ||
        (site.value?.releases || 0) > 0
    )
)

const backRoute = computed(() => {
  if (!site.value) return '/sites/development/cloud-hosting'
  if (site.value.subcategory) {
    return `/sites/${site.value.parentCategory}/${site.value.subcategory}`
  }
  return `/sites/${site.value.parentCategory}`
})

const collectionTrail = computed(() => {
  if (!site.value) return []

  const segments = site.value.subcategory
    ? [site.value.parentCategory, site.value.subcategory]
    : [site.value.parentCategory || site.value.category]
  const seenLabels = new Set<string>()

  return segments
    .map(formatCollectionLabel)
    .filter(label => {
      const key = label.toLowerCase()
      if (!key || seenLabels.has(key)) return false

      seenLabels.add(key)
      return true
    })
})

const copied = ref(false)
const copiedInstallCommand = ref(false)

function formatCollectionLabel(value: string): string {
  return collectionLabels[value] ?? value
    .split(/[-_]/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

function formatCommits(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

function formatAddedMonths(months: number): string {
  return months === 0 ? 'Added recently' : `Added ${months}mo ago`
}

async function copyCompose() {
  if (!site.value?.deployCompose) return
  try {
    await navigator.clipboard.writeText(site.value.deployCompose)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = site.value.deployCompose || ''
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

async function copyInstallCommand() {
  if (!installCommand.value) return
  try {
    await navigator.clipboard.writeText(installCommand.value)
    copiedInstallCommand.value = true
    setTimeout(() => {
      copiedInstallCommand.value = false
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = installCommand.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedInstallCommand.value = true
    setTimeout(() => {
      copiedInstallCommand.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="bg-black text-white">
    <div v-if="site" class="max-w-6xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            class="inline-flex w-fit items-center gap-2 text-gray-400 transition-colors hover:text-white"
            @click="router.push(backRoute)"
          >
            <ArrowLeft class="w-4 h-4" />
            <span class="text-sm">Back to list</span>
          </button>

          <nav
            v-if="collectionTrail.length"
            class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-600"
            aria-label="Site collection"
          >
            <template
              v-for="(label, index) in collectionTrail"
              :key="`${label}-${index}`"
            >
              <span :class="index === collectionTrail.length - 1 ? 'text-gray-300' : 'text-gray-500'">
                {{ label }}
              </span>
              <span
                v-if="index < collectionTrail.length - 1"
                class="text-gray-700"
              >
                /
              </span>
            </template>
          </nav>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <BookmarkButton
            v-if="bookmarkResource"
            :resource="bookmarkResource"
            variant="detail"
          />
          <SiteIssueReport :site="site" />
          <a
            :href="site.website"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
          >
            <ExternalLink class="w-4 h-4" />
            Visit Site
          </a>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-[#080808] text-gray-400 transition-colors hover:border-gray-700 hover:text-white"
            aria-label="Close site detail"
            @click="router.push(backRoute)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Header Section -->
      <div class="mb-8">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <!-- Icon -->
            <SiteFavicon :website="site.website" :name="site.name" size="lg" />

            <!-- Title and Meta -->
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="min-w-0 break-words text-2xl font-bold text-white">{{ site.name }}</h1>
                <CheckCircle2 v-if="site.verified" class="w-5 h-5 text-green-500" />
                <RefreshCw v-else class="w-4 h-4 text-gray-600" />
                <span v-if="site.version" class="text-sm text-gray-400">{{ site.version }}</span>
              </div>

              <!-- Meta Row -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                <span class="flex items-center gap-1">
                  <Shield class="w-4 h-4" />
                  {{ site.license }}
                </span>
                <span v-if="hasReleaseInfo" class="flex items-center gap-1">
                  <Tag class="w-4 h-4" />
                  {{ site.lastRelease }}
                </span>
                <span v-if="hasCommitInfo" class="flex items-center gap-1">
                  <GitCommit class="w-4 h-4" />
                  {{ site.lastCommit }}
                </span>
                <a :href="site.website" target="_blank" class="flex items-center gap-1 hover:text-accent-400 transition-colors">
                  <Globe class="w-4 h-4" />
                  Website
                </a>
                <a v-if="site.docs" :href="site.docs" target="_blank" class="flex items-center gap-1 hover:text-accent-400 transition-colors">
                  <BookOpen class="w-4 h-4" />
                  Docs
                </a>
                <a v-if="site.sourceCode" :href="site.sourceCode" target="_blank" class="flex items-center gap-1 hover:text-accent-400 transition-colors">
                  <Code2 class="w-4 h-4" />
                  Source code
                </a>
                <span v-if="hasSourceCode && site.stars > 0" class="flex items-center gap-1">
                  <Star class="w-4 h-4" />
                  {{ formatNumber(site.stars) }}
                </span>
              </div>

              <!-- Contributors Row -->
              <div v-if="hasRepoActivity" class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span v-if="site.contributors > 0" class="flex items-center gap-1">
                  <Users class="w-4 h-4" />
                  {{ site.contributors }} contributors
                </span>
                <span v-if="site.commitsThisYear > 0" class="flex items-center gap-1">
                  <GitCommit class="w-4 h-4" />
                  {{ formatCommits(site.commitsThisYear) }} commits this year
                </span>
                <span v-if="site.releases > 0" class="flex items-center gap-1">
                  <Package class="w-4 h-4" />
                  {{ site.releases }} releases
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Access & Deployment -->
        <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
          <h3 class="text-sm font-medium text-gray-400 mb-3">Access & Deployment</h3>
          <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div class="flex flex-wrap items-center gap-2">
              <Monitor class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-400">Access</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="platform in site.platforms"
                  :key="platform"
                  class="px-2 py-0.5 bg-[#161b22] border border-gray-700 rounded text-xs text-gray-300"
                >
                  {{ platform }}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Package class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-400">Deployment</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="deploy in site.deployment"
                  :key="deploy"
                  class="px-2 py-0.5 bg-[#161b22] border border-gray-700 rounded text-xs text-gray-300"
                >
                  {{ deploy }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SitePreview :site="site" />

      <!-- At a Glance -->
      <div v-if="site.atGlance" class="border border-accent-900/50 rounded-lg p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <h3 class="text-sm font-medium text-accent-400 mb-1">At a Glance</h3>
        <p class="text-sm text-accent-300 italic">{{ site.atGlance }}</p>
      </div>

      <!-- Description -->
      <div v-if="site.fullDescription" class="mb-6">
        <h3 class="text-base font-semibold text-white mb-3">Description</h3>
        <p class="text-sm text-gray-400 leading-relaxed">{{ site.fullDescription }}</p>
      </div>

      <!-- Core Features -->
      <div v-if="site.coreFeatures && site.coreFeatures.length" class="mb-6">
        <h3 class="text-base font-semibold text-white mb-4">Core Features</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="feature in site.coreFeatures"
            :key="feature.name"
            class="border border-gray-800 rounded-lg p-4"
            style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#161b22] border border-gray-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 class="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-white mb-1">{{ feature.name }}</h4>
                <p class="text-xs text-gray-500">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Features -->
      <div v-if="site.additionalFeatures && site.additionalFeatures.length" class="mb-6">
        <h3 class="text-base font-semibold text-gray-400 mb-4">Additional Features</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="feature in site.additionalFeatures"
            :key="feature.name"
            class="border border-gray-800 rounded-lg p-4"
            style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#161b22] border border-gray-700 flex items-center justify-center flex-shrink-0">
                <Layers class="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-300 mb-1">{{ feature.name }}</h4>
                <p class="text-xs text-gray-500">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Community Feedback -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="flex items-center gap-2 mb-4">
          <Heart class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-400">
            Be the first to support this tool — early community support helps surface high-quality tools to others
          </span>
        </div>
        <div class="flex items-center gap-3 pt-4 border-t border-gray-800">
          <span class="text-xs text-gray-500">Share:</span>
          <div class="flex gap-2">
            <button class="w-8 h-8 rounded bg-[#161b22] border border-gray-700 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <Share2 class="w-4 h-4" />
            </button>
            <button class="w-8 h-8 rounded bg-[#161b22] border border-gray-700 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <Globe class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Installation & Deployment -->
      <div v-if="hasDeploymentInfo" class="border border-gray-800 rounded-xl mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="p-4 border-b border-gray-800">
          <h3 class="text-base font-semibold text-white mb-1">Installation & Deployment</h3>
          <p class="text-sm text-gray-500">Choose a deployment method based on your environment and preferences</p>
        </div>

        <div class="p-4">
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="deploy in site.deployment"
              :key="deploy"
              class="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-gray-700 rounded-lg text-sm text-white"
            >
              <Package class="w-4 h-4" />
              {{ deploy }}
            </span>
          </div>

          <p class="text-xs text-gray-500 mb-3">
            {{
              site.deployCompose
                ? 'Container-based deployment with docker-compose.yml'
                : hasInstallCommand
                  ? 'Install the CLI locally, then authenticate through the official provider flow'
                : 'Cloud-first access through the official website and available project links'
            }}
          </p>

          <div v-if="hasInstallCommand" class="mb-4 overflow-hidden rounded-lg border border-gray-800 bg-[#161b22]">
            <div class="flex flex-col gap-2 border-b border-gray-800 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <Code2 class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-400">CLI setup command</span>
              </div>
              <button
                type="button"
                class="flex w-fit items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:text-white"
                @click="copyInstallCommand"
              >
                <component :is="copiedInstallCommand ? Check : Copy" class="h-3.5 w-3.5" />
                {{ copiedInstallCommand ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <pre class="overflow-x-auto p-4 text-xs text-gray-300"><code>{{ installCommand }}</code></pre>
          </div>

          <!-- Compose File -->
          <div v-if="site.deployCompose" class="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div class="flex flex-col gap-2 border-b border-gray-800 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <Code2 class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-400">compose.yml</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="break-all text-xs text-gray-600">Path: /manifests/{{ site.name }}/compose.yml</span>
                <button
                  @click="copyCompose"
                  class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
            <div class="relative">
              <pre class="p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-64 overflow-y-auto"><code>{{ site.deployCompose }}</code></pre>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              :href="site.website"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#161b22] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
            >
              <Globe class="w-4 h-4 text-gray-500" />
              Open Website
            </a>
            <a
              v-if="hasDistinctDocs"
              :href="site.docs"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#161b22] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
            >
              <BookOpen class="w-4 h-4 text-gray-500" />
              Read Docs
            </a>
            <a
              v-if="site.sourceCode"
              :href="site.sourceCode"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#161b22] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
            >
              <Code2 class="w-4 h-4 text-gray-500" />
              Source Code
            </a>
          </div>
        </div>
      </div>

      <!-- Similar Tools -->
      <div v-if="site.similarTools && site.similarTools.length" class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Layers class="w-5 h-5 text-gray-400" />
          <h3 class="text-base font-semibold text-white">Similar Tools in {{ site.category }}</h3>
          <span class="text-sm text-gray-500">{{ site.similarTools.length }} tools</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RouterLink
            v-for="tool in site.similarTools"
            :key="tool.slug"
            :to="`/sites/${tool.slug}`"
            class="border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group block"
            style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
          >
            <div class="flex items-start gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-[#161b22] border border-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <SiteFavicon :website="tool.website" :name="tool.name" size="sm" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">{{ tool.name }}</h4>
                  <CheckCircle2 v-if="tool.verified" class="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{{ tool.description }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <div v-if="tool.stars > 0" class="flex items-center gap-1">
                <Star class="w-3.5 h-3.5" />
                <span>{{ formatNumber(tool.stars) }}</span>
              </div>
              <span>{{ formatAddedMonths(tool.addedDaysAgo) }}</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-else-if="store.loading" class="flex items-center justify-center py-24">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw class="h-5 w-5 animate-spin" />
        Loading site...
      </div>
    </div>

    <div v-else-if="store.loadError" class="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 class="text-2xl font-bold text-white mb-2">Could not load sites</h2>
      <p class="text-gray-400 mb-6">{{ store.loadError }}</p>
      <button
        @click="router.push(backRoute)"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Sites
      </button>
    </div>

    <!-- Not Found -->
    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="text-2xl font-bold text-white mb-2">Site not found</h2>
      <p class="text-gray-400 mb-6">The site you're looking for doesn't exist.</p>
      <button
        @click="router.push(backRoute)"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Sites
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
