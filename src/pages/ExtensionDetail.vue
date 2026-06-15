<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Star,
  Users,
  Shield,
  Code2,
  ExternalLink,
  Globe,
  CheckCircle2,
  Layers,
  X,
  Download,
  Puzzle,
} from 'lucide-vue-next'
import { useExtensionsStore } from '@/stores/extensions'

const route = useRoute()
const router = useRouter()
const store = useExtensionsStore()
void store.loadExtensions()

const slug = computed(() => route.params.slug as string)
const extension = computed(() => store.getExtensionBySlug(slug.value))

const backRoute = computed(() => {
  if (!extension.value) return '/extensions'
  if (extension.value.subcategory) {
    return `/extensions/${extension.value.parentCategory}/${extension.value.subcategory}`
  }
  return `/extensions/${extension.value.parentCategory}`
})

const installUrl = computed(() => {
  if (extension.value?.chromeWebStoreId) {
    return `https://chromewebstore.google.com/detail/${extension.value.chromeWebStoreId}`
  }
  return extension.value?.website || ''
})

const hasDistinctDocs = computed(() => Boolean(extension.value?.docs && extension.value.docs !== extension.value.website))

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

function formatAddedMonths(months: number): string {
  return months === 0 ? 'Added recently' : `Added ${months}mo ago`
}

function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  let stars = ''
  for (let i = 0; i < full; i++) stars += '★'
  if (half) stars += '½'
  return stars
}
</script>

<template>
  <div class="bg-[#1f1f1f] text-white">
    <div v-if="extension" class="max-w-6xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center">
          <button
            type="button"
            class="inline-flex w-fit items-center gap-2 text-gray-400 transition-colors hover:text-white"
            @click="router.push(backRoute)"
          >
            <ArrowLeft class="w-4 h-4" />
            <span class="text-sm">Back to list</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <a
            :href="installUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-gray-200"
          >
            <Download class="w-4 h-4" />
            Add to Chrome
          </a>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-[#1f1f1f] text-gray-400 transition-colors hover:border-gray-700 hover:text-white"
            aria-label="Close extension detail"
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
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="min-w-0 break-words text-2xl font-bold text-white">{{ extension.name }}</h1>
                <CheckCircle2 v-if="extension.verified" class="w-5 h-5 text-green-500" />
                <span v-if="extension.version" class="text-sm text-gray-400">v{{ extension.version }}</span>
              </div>

              <!-- Rating and Users -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                <span v-if="extension.chromeWebStoreRating > 0" class="flex items-center gap-1 text-amber-400">
                  <Star class="w-4 h-4 fill-amber-400" />
                  {{ extension.chromeWebStoreRating.toFixed(1) }}
                  <span class="text-amber-400/70">{{ renderStars(extension.chromeWebStoreRating) }}</span>
                </span>
                <span v-if="extension.userCount > 0" class="flex items-center gap-1">
                  <Users class="w-4 h-4" />
                  {{ formatNumber(extension.userCount) }} users
                </span>
                <span class="flex items-center gap-1">
                  <Puzzle class="w-4 h-4" />
                  Manifest v{{ extension.manifestVersion }}
                </span>
                <span class="flex items-center gap-1">
                  <Shield class="w-4 h-4" />
                  {{ extension.license }}
                </span>
                <a v-if="extension.sourceCode" :href="extension.sourceCode" target="_blank" class="flex items-center gap-1 hover:text-accent-400 transition-colors">
                  <Code2 class="w-4 h-4" />
                  Source code
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div v-if="extension.permissions.length" class="border border-gray-800 rounded-xl p-4 mb-6">
          <h3 class="text-sm font-medium text-gray-400 mb-3">Permissions</h3>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="permission in extension.permissions"
              :key="permission"
              class="px-2 py-0.5 bg-[#1f1f1f] border border-gray-700 rounded text-xs text-gray-300"
            >
              {{ permission }}
            </span>
          </div>
        </div>
      </div>

      <!-- At a Glance -->
      <div v-if="extension.atGlance" class="border border-accent-900/50 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-medium text-accent-400 mb-1">At a Glance</h3>
        <p class="text-sm text-accent-300 italic">{{ extension.atGlance }}</p>
      </div>

      <!-- Description -->
      <div v-if="extension.fullDescription" class="mb-6">
        <h3 class="text-base font-semibold text-white mb-3">Description</h3>
        <p class="text-sm text-gray-400 leading-relaxed">{{ extension.fullDescription }}</p>
      </div>

      <!-- Core Features -->
      <div v-if="extension.coreFeatures && extension.coreFeatures.length" class="mb-6">
        <h3 class="text-base font-semibold text-white mb-4">Core Features</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="feature in extension.coreFeatures"
            :key="feature.name"
            class="border border-gray-800 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-gray-700 flex items-center justify-center flex-shrink-0">
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
      <div v-if="extension.additionalFeatures && extension.additionalFeatures.length" class="mb-6">
        <h3 class="text-base font-semibold text-gray-400 mb-4">Additional Features</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="feature in extension.additionalFeatures"
            :key="feature.name"
            class="border border-gray-800 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-gray-700 flex items-center justify-center flex-shrink-0">
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

      <!-- Links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <a
          :href="extension.website"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
        >
          <Globe class="w-4 h-4 text-gray-500" />
          Chrome Web Store
        </a>
        <a
          v-if="hasDistinctDocs"
          :href="extension.docs"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
        >
          <ExternalLink class="w-4 h-4 text-gray-500" />
          View Docs
        </a>
        <a
          v-if="extension.sourceCode"
          :href="extension.sourceCode"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#1f1f1f] p-4 text-sm text-gray-300 hover:border-gray-700 hover:text-white transition-colors"
        >
          <Code2 class="w-4 h-4 text-gray-500" />
          Source Code
        </a>
      </div>

      <!-- Similar Tools -->
      <div v-if="extension.similarTools && extension.similarTools.length" class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Layers class="w-5 h-5 text-gray-400" />
          <h3 class="text-base font-semibold text-white">Similar Extensions</h3>
          <span class="text-sm text-gray-500">{{ extension.similarTools.length }} extensions</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RouterLink
            v-for="tool in extension.similarTools"
            :key="tool.slug"
            :to="`/extensions/${tool.slug}`"
            class="ext-detail-card border rounded-xl p-4 hover:border-gray-700 transition-all group block"
          >
            <div class="flex items-start gap-3 mb-3">
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

    <div v-else-if="store.loading" class="max-w-6xl mx-auto px-4 py-24">
      <div class="ext-detail-skeleton border rounded-xl h-96 animate-pulse" />
    </div>

    <div v-else-if="store.loadError" class="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 class="text-2xl font-bold text-white mb-2">Could not load extensions</h2>
      <p class="text-gray-400 mb-6">{{ store.loadError }}</p>
      <button
        @click="router.push('/extensions')"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Extensions
      </button>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-24">
      <h2 class="text-2xl font-bold text-white mb-2">Extension not found</h2>
      <p class="text-gray-400 mb-6">The extension you're looking for doesn't exist.</p>
      <button
        @click="router.push('/extensions')"
        class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Browse Extensions
      </button>
    </div>
  </div>
</template>

<style scoped>
.ext-detail-card {
  border-color: #1f2937;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%),
    #1f1f1f;
}

.ext-detail-card:hover {
  border-color: #374151;
}

.ext-detail-skeleton {
  border-color: #1f2937;
  background: #1f1f1f;
}

:global(html.light .ext-detail-card) {
  border-color: var(--mocha-border);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.09), rgba(255, 140, 26, 0) 58%),
    var(--mocha-surface);
  box-shadow: 0 1px 0 rgba(45, 33, 25, 0.04);
}

:global(html.light .ext-detail-card:hover) {
  border-color: var(--mocha-border-strong);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.13), rgba(255, 140, 26, 0) 60%),
    var(--mocha-surface-strong);
}

:global(html.light .ext-detail-skeleton) {
  border-color: var(--mocha-border);
  background: var(--mocha-surface-muted);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
