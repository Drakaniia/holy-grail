<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Zap } from 'lucide-vue-next'
import SitesHomeFeaturedCard from '@/components/sites/home/SitesHomeFeaturedCard.vue'
import SitesHomeSectionHeader from '@/components/sites/home/SitesHomeSectionHeader.vue'
import type { SitesHomeTool } from '@/types/sitesHome'

const props = defineProps<{
  tools: SitesHomeTool[]
  isLoading: boolean
  pageSize?: number
}>()

const pageSize = computed(() => props.pageSize ?? 4)
const page = shallowRef(0)

const totalPages = computed(() => Math.max(1, Math.ceil(props.tools.length / pageSize.value)))

const visibleTools = computed(() => {
  const start = page.value * pageSize.value
  return props.tools.slice(start, start + pageSize.value)
})

watch(
  () => props.tools.length,
  () => {
    if (page.value > totalPages.value - 1) {
      page.value = Math.max(0, totalPages.value - 1)
    }
  },
)

function prevPage() {
  page.value = (page.value - 1 + totalPages.value) % totalPages.value
}

function nextPage() {
  page.value = (page.value + 1) % totalPages.value
}
</script>

<template>
  <section class="featured-tools" aria-labelledby="featured-tools-title">
    <SitesHomeSectionHeader
      title="Featured Tools"
      title-id="featured-tools-title"
      hint="Curated picks with live previews from the catalog"
    >
      <template #icon>
        <Zap aria-hidden="true" />
      </template>
      <template #actions>
        <button
          type="button"
          class="featured-tools__control"
          aria-label="Previous featured tools"
          :disabled="tools.length <= pageSize"
          @click="prevPage"
        >
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        </button>
        <RouterLink
          to="/sites/ai"
          class="featured-tools__control featured-tools__control--plus"
          aria-label="Browse all tools"
          title="Browse all"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
        <button
          type="button"
          class="featured-tools__control"
          aria-label="Next featured tools"
          :disabled="tools.length <= pageSize"
          @click="nextPage"
        >
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </template>
    </SitesHomeSectionHeader>

    <div v-if="isLoading && tools.length === 0" class="featured-tools__grid" aria-hidden="true">
      <div v-for="n in 4" :key="n" class="featured-tools__skeleton hg-skeleton"></div>
    </div>

    <div v-else-if="visibleTools.length > 0" class="featured-tools__grid">
      <SitesHomeFeaturedCard
        v-for="(tool, index) in visibleTools"
        :key="`${tool.id}-${page}`"
        :tool="tool"
        :index="index"
      />
    </div>

    <p v-else class="featured-tools__empty">No featured tools with previews yet.</p>
  </section>
</template>

<style scoped>
.featured-tools {
  width: 100%;
}

.featured-tools__control {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sh-border-soft, rgba(255, 255, 255, 0.08));
  border-radius: 9999px;
  background: var(--sh-surface, #121212);
  color: var(--sh-text-strong, #f5f5f5);
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    opacity 160ms ease,
    color 160ms ease;
}

.featured-tools__control:hover:not(:disabled) {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.16));
  background: var(--sh-surface-hover, #1b1b1b);
}

.featured-tools__control:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.featured-tools__control--plus {
  color: var(--sh-accent, #ff8c1a);
}

.featured-tools__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.featured-tools__skeleton {
  aspect-ratio: 16 / 10;
  border-radius: 20px;
}

.featured-tools__empty {
  margin: 0;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 20px;
  background: var(--sh-surface, #121212);
  padding: 2rem;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  text-align: center;
}

@media (max-width: 1200px) {
  .featured-tools__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .featured-tools__grid {
    display: flex;
    gap: 0.85rem;
    overflow-x: auto;
    padding-bottom: 0.35rem;
    scroll-snap-type: x mandatory;
  }

  .featured-tools__grid > :deep(*) {
    flex: 0 0 min(78vw, 18rem);
    scroll-snap-align: start;
  }

  .featured-tools__skeleton {
    flex: 0 0 min(78vw, 18rem);
  }
}
</style>
