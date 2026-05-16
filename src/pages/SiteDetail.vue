<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Star,
  Eye,
  Users,
  GitCommit,
  Tag,
  ExternalLink,
  BookOpen,
  Code2,
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
  ChevronDown,
  Layers,
  ImageOff,
} from 'lucide-vue-next'
import { useSitesStore } from '@/stores/sites'
import SiteFavicon from '@/components/sites/SiteFavicon.vue'

const route = useRoute()
const router = useRouter()
const store = useSitesStore()

const slug = computed(() => route.params.slug as string)
const site = computed(() => store.getSiteBySlug(slug.value))

const copied = ref(false)
const composeExpanded = ref(true)
const screenshotError = ref(false)

function getScreenshotUrl(website: string): string {
  return `https://image.thum.io/get/width/800/crop/600/noanimate/${website}`
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
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <div v-if="site" class="max-w-6xl mx-auto px-6 py-6">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <SiteFavicon :website="site.website" :name="site.name" size="lg" />

            <!-- Title and Meta -->
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-white">{{ site.name }}</h1>
                <CheckCircle2 v-if="site.verified" class="w-5 h-5 text-green-500" />
                <RefreshCw v-else class="w-4 h-4 text-gray-600" />
                <span class="text-sm text-gray-400">{{ site.version }}</span>
              </div>

              <!-- Meta Row -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                <span class="flex items-center gap-1">
                  <Shield class="w-4 h-4" />
                  {{ site.license }}
                </span>
                <span class="flex items-center gap-1">
                  <Tag class="w-4 h-4" />
                  {{ site.lastRelease }}
                </span>
                <span class="flex items-center gap-1">
                  <GitCommit class="w-4 h-4" />
                  {{ site.lastCommit }}
                </span>
                <a :href="site.website" target="_blank" class="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <Globe class="w-4 h-4" />
                  Website
                </a>
                <a :href="site.docs" target="_blank" class="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <BookOpen class="w-4 h-4" />
                  Docs
                </a>
                <a :href="site.sourceCode" target="_blank" class="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <Code2 class="w-4 h-4" />
                  Source code
                </a>
                <span class="flex items-center gap-1">
                  <Star class="w-4 h-4" />
                  {{ formatNumber(site.stars) }}
                </span>
              </div>

              <!-- Contributors Row -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <Users class="w-4 h-4" />
                  {{ site.contributors }} contributors
                </span>
                <span class="flex items-center gap-1">
                  <GitCommit class="w-4 h-4" />
                  {{ formatCommits(site.commitsThisYear) }} commits this year
                </span>
                <span class="flex items-center gap-1">
                  <Package class="w-4 h-4" />
                  {{ site.releases }} releases
                </span>
              </div>
            </div>
          </div>

          <!-- Report Button -->
          <button class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <Share2 class="w-4 h-4" />
            Report
          </button>
        </div>

        <!-- Platform & Deployment -->
        <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
          <h3 class="text-sm font-medium text-gray-400 mb-3">Platform & Deployment</h3>
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center gap-2">
              <Monitor class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-400">Platforms</span>
              <div class="flex gap-1.5">
                <span
                  v-for="platform in site.platforms"
                  :key="platform"
                  class="px-2 py-0.5 bg-[#161b22] border border-gray-700 rounded text-xs text-gray-300"
                >
                  {{ platform }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Package class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-400">Deployment</span>
              <div class="flex gap-1.5">
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

      <!-- Screenshot Preview -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="bg-[#161b22] rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <div class="flex gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span class="text-xs text-gray-500 ml-2">{{ site.website }}</span>
          </div>
          <div class="relative">
            <a
              v-if="!screenshotError"
              :href="site.website"
              target="_blank"
              rel="noopener noreferrer"
              class="block group"
            >
              <img
                :src="getScreenshotUrl(site.website)"
                :alt="`${site.name} screenshot`"
                class="w-full h-auto transition-opacity group-hover:opacity-90"
                loading="lazy"
                @error="screenshotError = true"
              />
            </a>
            <div v-else class="p-12 text-center text-gray-500">
              <ImageOff class="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p class="text-sm">Screenshot unavailable for {{ site.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- At a Glance -->
      <div v-if="site.atGlance" class="border border-blue-900/50 rounded-lg p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <h3 class="text-sm font-medium text-blue-400 mb-1">At a Glance</h3>
        <p class="text-sm text-blue-300 italic">{{ site.atGlance }}</p>
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
      <div v-if="site.deployCompose" class="border border-gray-800 rounded-xl mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="p-4 border-b border-gray-800">
          <h3 class="text-base font-semibold text-white mb-1">Installation & Deployment</h3>
          <p class="text-sm text-gray-500">Choose a deployment method based on your environment and preferences</p>
        </div>

        <div class="p-4">
          <!-- Docker Compose Button -->
          <button class="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-gray-700 rounded-lg text-sm text-white mb-3">
            <Package class="w-4 h-4" />
            Docker Compose
          </button>

          <p class="text-xs text-gray-500 mb-3">Container-based deployment with docker-compose.yml</p>

          <!-- Compose File -->
          <div class="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <div class="flex items-center gap-2">
                <Code2 class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-400">compose.yml</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-600">Path: /manifests/{{ site.name }}/compose.yml</span>
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
                  <h4 class="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">{{ tool.name }}</h4>
                  <CheckCircle2 v-if="tool.verified" class="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{{ tool.description }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <Star class="w-3.5 h-3.5" />
                <span>{{ formatNumber(tool.stars) }}</span>
              </div>
              <span>Added {{ tool.addedDaysAgo }}mo ago</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="text-2xl font-bold text-white mb-2">Site not found</h2>
      <p class="text-gray-400 mb-6">The site you're looking for doesn't exist.</p>
      <button
        @click="router.push('/sites')"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
