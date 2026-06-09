<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ExternalLink, ImageOff } from 'lucide-vue-next'
import previewsIndex from '@/content/site-previews.json'
import type { Site } from '@/stores/sites'

interface SitePreviewEntry {
  image: string
  small: string
  sourceUrl: string
  capturedAt: string
  width: number
  height: number
  bytes: number
}

const props = defineProps<{
  site: Site
}>()

const previewError = shallowRef(false)
const previews = previewsIndex as Record<string, SitePreviewEntry>

const preview = computed(() => previews[props.site.slug])
const previewUrl = computed(() => (preview.value && !previewError.value ? preview.value.image : ''))

watch(
  () => props.site.slug,
  () => {
    previewError.value = false
  }
)
</script>

<template>
  <div
    class="border border-gray-800 rounded-xl p-4 mb-6"
    style="background: linear-gradient(to right, #1f1f1f 0%, #1f1f1f 100%)"
  >
    <div class="bg-[#1f1f1f] rounded-lg overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span class="text-xs text-gray-500 ml-2 truncate">{{ site.website }}</span>
      </div>

      <a
        v-if="previewUrl"
        :href="site.website"
        target="_blank"
        rel="noopener noreferrer"
        class="relative block group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1f1f]"
        :aria-label="`Visit ${site.name}`"
      >
        <picture>
          <source v-if="preview?.small" :srcset="preview.small" media="(max-width: 720px)" />
          <img
            :src="previewUrl"
            :alt="`${site.name} screenshot`"
            class="w-full aspect-[16/10] object-cover transition-opacity group-hover:opacity-90"
            loading="lazy"
            decoding="async"
            @error="previewError = true"
          />
        </picture>
        <div
          class="site-preview-overlay absolute inset-0 flex items-end justify-end p-4 transition-colors"
        >
          <span
            class="site-preview-visit-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg transition-all"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Visit site
          </span>
        </div>
      </a>

      <a
        v-else
        :href="site.website"
        target="_blank"
        rel="noopener noreferrer"
        class="aspect-[16/10] p-12 text-center text-gray-500 grid place-items-center transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1f1f]"
        :aria-label="`Visit ${site.name}`"
      >
        <div>
          <ImageOff class="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p class="text-sm">Preview will appear after running the screenshot generator.</p>
          <span
            class="site-preview-visit-button mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Visit site
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.site-preview-overlay {
  background-color: transparent;
}

.group:hover .site-preview-overlay {
  background-color: rgba(31, 31, 31, 0.2);
}

.site-preview-visit-button {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background-color: rgba(0, 0, 0, 0.82);
  color: #ffffff;
  opacity: 0.92;
}

.group:hover .site-preview-visit-button {
  border-color: rgba(255, 255, 255, 0.45);
  background-color: #ffffff;
  color: #1f1f1f;
  opacity: 1;
}

:global(html.light .site-preview-visit-button) {
  border-color: var(--mocha-border-strong) !important;
  background-color: rgba(255, 250, 243, 0.96) !important;
  color: var(--mocha-text) !important;
  opacity: 1 !important;
  box-shadow: 0 14px 30px rgba(45, 33, 25, 0.18) !important;
}

:global(html.light .site-preview-overlay) {
  background-color: transparent !important;
}

:global(html.light .group:hover .site-preview-overlay) {
  background-color: rgba(45, 33, 25, 0.08) !important;
}

:global(html.light .group:hover .site-preview-visit-button) {
  border-color: var(--mocha-border-strong) !important;
  background-color: #ffffff !important;
  color: var(--mocha-text) !important;
  transform: translateY(-1px);
}
</style>
