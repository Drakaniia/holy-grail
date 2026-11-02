<script setup lang="ts">
import { shallowRef } from 'vue'
import { BadgeCheck, TrendingUp } from 'lucide-vue-next'
import SitesHomeSectionHeader from '@/components/sites/home/SitesHomeSectionHeader.vue'
import type { SitesHomeTool } from '@/types/sitesHome'

defineProps<{
  tools: SitesHomeTool[]
  isLoading: boolean
}>()

const failedLogos = shallowRef(new Set<string>())

function markLogoFailed(slug: string) {
  const next = new Set(failedLogos.value)
  next.add(slug)
  failedLogos.value = next
}
</script>

<template>
  <section class="trending-tools" aria-labelledby="trending-tools-title">
    <SitesHomeSectionHeader title="Trending Tools" title-id="trending-tools-title">
      <template #icon>
        <TrendingUp aria-hidden="true" />
      </template>
    </SitesHomeSectionHeader>

    <div v-if="isLoading && tools.length === 0" class="trending-tools__grid" aria-hidden="true">
      <div v-for="n in 8" :key="n" class="trending-tools__item trending-tools__item--skeleton">
        <span class="trending-tools__sk-logo hg-skeleton"></span>
        <span class="trending-tools__sk-copy">
          <span class="trending-tools__sk-line hg-skeleton"></span>
          <span class="trending-tools__sk-line trending-tools__sk-line--short hg-skeleton"></span>
        </span>
      </div>
    </div>

    <div v-else-if="tools.length > 0" class="trending-tools__grid">
      <RouterLink v-for="tool in tools" :key="tool.id" :to="tool.to" class="trending-tools__item">
        <span class="trending-tools__logo">
          <img
            v-if="tool.logo && !failedLogos.has(tool.slug)"
            :src="tool.logo"
            :alt="`${tool.name} logo`"
            width="28"
            height="28"
            loading="lazy"
            @error="markLogoFailed(tool.slug)"
          />
          <span v-else aria-hidden="true">{{ tool.name.charAt(0) }}</span>
        </span>

        <span class="trending-tools__copy">
          <span class="trending-tools__name-row">
            <strong>{{ tool.name }}</strong>
            <BadgeCheck v-if="tool.verified" class="trending-tools__badge" aria-label="Verified" />
          </span>
          <span class="trending-tools__category">{{ tool.category }}</span>
        </span>
      </RouterLink>
    </div>

    <p v-else class="trending-tools__empty">No trending tools available yet.</p>
  </section>
</template>

<style scoped>
.trending-tools {
  width: 100%;
}

.trending-tools__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.trending-tools__item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  border-radius: 8px;
  padding: 0.6rem 0.65rem;
  color: inherit;
  text-decoration: none;
  transition: background-color 140ms ease;
}

.trending-tools__item:hover {
  background: var(--sh-item-hover, #2a2a2a);
}

.trending-tools__item:focus-visible {
  background: var(--sh-item-hover, #2a2a2a);
  outline: 2px solid var(--sh-accent, #ff8c1a);
  outline-offset: -2px;
}

.trending-tools__logo {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  background: transparent;
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.7));
  font-size: 0.95rem;
  font-weight: 600;
}

.trending-tools__logo img {
  width: 1.55rem;
  height: 1.55rem;
  object-fit: contain;
}

.trending-tools__copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.trending-tools__name-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.trending-tools__name-row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--sh-text-strong, #f5f5f5);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trending-tools__badge {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  color: var(--sh-verified, #4ade80);
}

.trending-tools__category {
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  font-size: 0.8rem;
}

.trending-tools__item--skeleton {
  pointer-events: none;
}

.trending-tools__sk-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.trending-tools__sk-copy {
  display: grid;
  gap: 0.4rem;
  flex: 1;
}

.trending-tools__sk-line {
  display: block;
  height: 0.75rem;
  width: 70%;
  border-radius: 9999px;
}

.trending-tools__sk-line--short {
  width: 42%;
}

.trending-tools__empty {
  margin: 0;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
}

@media (max-width: 1100px) {
  .trending-tools__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .trending-tools__grid {
    grid-template-columns: 1fr;
  }
}
</style>
