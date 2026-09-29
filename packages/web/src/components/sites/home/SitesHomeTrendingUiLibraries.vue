<script setup lang="ts">
import { ArrowUpRight, Code2 } from 'lucide-vue-next'
import SitesHomeFeaturedCard from '@/components/sites/home/SitesHomeFeaturedCard.vue'
import SitesHomeSectionHeader from '@/components/sites/home/SitesHomeSectionHeader.vue'
import type { SitesHomeTool } from '@/types/sitesHome'

defineProps<{
  tools: SitesHomeTool[]
  isLoading: boolean
}>()
</script>

<template>
  <section class="trending-ui-libraries" aria-labelledby="trending-ui-libraries-title">
    <SitesHomeSectionHeader
      title="Trending UI Libraries"
      title-id="trending-ui-libraries-title"
      hint="Ranked from catalog activity signals"
    >
      <template #icon>
        <Code2 aria-hidden="true" />
      </template>
      <template #actions>
        <RouterLink
          to="/sites/development/ui-libraries"
          class="trending-ui-libraries__view-all"
          aria-label="View all UI libraries"
        >
          View all
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </RouterLink>
      </template>
    </SitesHomeSectionHeader>

    <div
      v-if="isLoading && tools.length === 0"
      class="trending-ui-libraries__grid"
      aria-hidden="true"
    >
      <div v-for="n in 4" :key="n" class="trending-ui-libraries__skeleton hg-skeleton"></div>
    </div>

    <div v-else-if="tools.length > 0" class="trending-ui-libraries__grid">
      <SitesHomeFeaturedCard
        v-for="(tool, index) in tools"
        :key="tool.id"
        :tool="tool"
        :index="index"
      />
    </div>

    <p v-else class="trending-ui-libraries__empty">No trending UI libraries available yet.</p>
  </section>
</template>

<style scoped>
.trending-ui-libraries {
  width: 100%;
}

.trending-ui-libraries__view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid var(--sh-border-soft, rgba(255, 255, 255, 0.08));
  border-radius: 9999px;
  padding: 0.55rem 0.7rem;
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.7));
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.trending-ui-libraries__view-all:hover,
.trending-ui-libraries__view-all:focus-visible {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.14));
  background: var(--sh-surface-hover, #1b1b1b);
  color: var(--sh-text-strong, #f5f5f5);
}

.trending-ui-libraries__view-all:focus-visible {
  outline: 2px solid var(--sh-accent, #ff8c1a);
  outline-offset: 3px;
}

.trending-ui-libraries__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.trending-ui-libraries__skeleton {
  aspect-ratio: 16 / 10;
  border-radius: 20px;
}

.trending-ui-libraries__empty {
  margin: 0;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 20px;
  background: var(--sh-surface, #121212);
  padding: 2rem;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  text-align: center;
}

@media (max-width: 1200px) {
  .trending-ui-libraries__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .trending-ui-libraries__grid {
    display: flex;
    gap: 0.85rem;
    overflow-x: auto;
    padding-bottom: 0.35rem;
    scroll-snap-type: x mandatory;
  }

  .trending-ui-libraries__grid > :deep(*) {
    flex: 0 0 min(78vw, 18rem);
    scroll-snap-align: start;
  }

  .trending-ui-libraries__skeleton {
    flex: 0 0 min(78vw, 18rem);
  }
}
</style>
