<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, FileText } from 'lucide-vue-next'

interface Heading {
  level: number
  text: string
}

const props = defineProps<{
  contentHtml: string | null
  contentLoaded: boolean
}>()

const emit = defineEmits<{
  'scroll-to-heading': [text: string]
}>()

// Parse headings from contentHtml by extracting text between <h1>,<h2>,<h3> tags
const headings = computed<Heading[]>(() => {
  if (!props.contentHtml) return []
  const result: Heading[] = []
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(props.contentHtml)) !== null) {
    const level = parseInt(match[1])
    // Strip any inner HTML tags from heading text
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) {
      result.push({ level, text })
    }
  }
  return result
})
</script>

<template>
  <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
    <h3 class="mb-3 text-base font-medium text-white">File Tree</h3>

    <div v-if="headings.length > 0" class="space-y-1">
      <!-- Root SKILL.md -->
      <div class="flex items-center gap-1.5 py-1 text-xs text-gray-400">
        <FileText class="h-3.5 w-3.5 shrink-0" />
        <span class="font-medium text-gray-300">SKILL.md</span>
      </div>

      <!-- Heading tree -->
      <div class="ml-3 border-l border-gray-800 pl-3">
        <button
          v-for="(h, i) in headings"
          :key="i"
          @click="emit('scroll-to-heading', h.text)"
          class="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-gray-800 hover:text-white"
          :class="
            h.level === 1 ? 'text-gray-300' : h.level === 2 ? 'text-gray-400' : 'text-gray-500'
          "
          :style="{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }"
        >
          <ChevronRight class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ h.text }}</span>
        </button>
      </div>
    </div>

    <!-- Placeholder when not loaded -->
    <div v-else class="space-y-1.5 text-xs text-gray-500">
      <div class="flex items-center gap-1.5 py-0.5">
        <FileText class="h-3.5 w-3.5 shrink-0" />
        <span>_meta.json</span>
      </div>
      <div class="flex items-center gap-1.5 py-0.5">
        <FileText class="h-3.5 w-3.5 shrink-0" />
        <span>SKILL.md</span>
      </div>
    </div>
  </div>
</template>
