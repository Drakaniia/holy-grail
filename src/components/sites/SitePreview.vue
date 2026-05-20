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
    style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
  >
    <div class="bg-[#161b22] rounded-lg overflow-hidden">
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
        class="relative block group cursor-pointer"
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
          class="absolute inset-0 flex items-end justify-end bg-black/0 p-4 transition-colors group-hover:bg-black/20"
        >
          <span
            class="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-xs font-semibold text-white opacity-90 shadow-lg transition-all group-hover:border-white/40 group-hover:bg-white group-hover:text-black"
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
        class="aspect-[16/10] p-12 text-center text-gray-500 grid place-items-center transition-colors hover:text-gray-300"
        :aria-label="`Visit ${site.name}`"
      >
        <div>
          <ImageOff class="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p class="text-sm">Preview will appear after running the screenshot generator.</p>
          <span
            class="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Visit site
          </span>
        </div>
      </a>
    </div>
  </div>
</template>
