<script setup lang="ts">
import { shallowRef } from 'vue'
import { BadgeCheck } from 'lucide-vue-next'
import type { SitesHomeTool } from '@/types/sitesHome'

defineProps<{
  tool: SitesHomeTool
}>()

const imageFailed = shallowRef(false)
</script>

<template>
  <RouterLink
    :to="tool.to"
    class="featured-card"
    :style="{ '--accent': tool.accentColor }"
    :aria-label="`Open ${tool.name}`"
  >
    <span class="featured-card__media">
      <img
        v-if="!imageFailed"
        :src="tool.coverImage"
        :srcset="`${tool.coverImageSmall} 720w, ${tool.coverImage} 1440w`"
        sizes="(max-width: 900px) 80vw, 22vw"
        :alt="`${tool.name} preview`"
        loading="lazy"
        decoding="async"
        class="featured-card__image"
        @error="imageFailed = true"
      />
      <span v-else class="featured-card__fallback" aria-hidden="true">{{
        tool.name.charAt(0)
      }}</span>
    </span>

    <span class="featured-card__meta">
      <span class="featured-card__name-row">
        <strong class="featured-card__name">{{ tool.name }}</strong>
        <BadgeCheck v-if="tool.verified" class="featured-card__badge" aria-label="Verified" />
      </span>
      <span class="featured-card__category">{{ tool.category }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.featured-card {
  --accent: var(--sh-accent, #ff8c1a);
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  background: transparent;
  color: inherit;
  aspect-ratio: 16 / 10;
  text-decoration: none;
  transition: border-color 180ms ease;
}

.featured-card:hover {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.2));
}

.featured-card:focus-visible {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.2));
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.featured-card__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--sh-surface-deep, #0d0d0d);
}

.featured-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.featured-card__fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.45));
  font-size: 2.5rem;
  font-weight: 700;
}

.featured-card__meta {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: grid;
  gap: 0.2rem;
  padding: 2.4rem 1rem 0.95rem;
  background: var(--sh-meta-scrim, linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.88) 62%));
}

.featured-card__name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.featured-card__name {
  min-width: 0;
  overflow: hidden;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-card__badge {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--sh-verified, #4ade80);
}

.featured-card__category {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
}

@media (prefers-reduced-motion: reduce) {
  .featured-card {
    transition: none;
  }
}
</style>
