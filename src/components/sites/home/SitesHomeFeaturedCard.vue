<script setup lang="ts">
import { shallowRef } from 'vue'
import { BadgeCheck } from 'lucide-vue-next'
import type { SitesHomeTool } from '@/types/sitesHome'

defineProps<{
  tool: SitesHomeTool
  index?: number
}>()

const imageFailed = shallowRef(false)
</script>

<template>
  <RouterLink
    :to="tool.to"
    class="featured-card"
    :style="{ '--stagger': `${(index ?? 0) * 45}ms`, '--accent': tool.accentColor }"
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
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 20px;
  background: var(--sh-surface, #121212);
  color: inherit;
  aspect-ratio: 16 / 10;
  text-decoration: none;
  box-shadow: var(--sh-shadow, 0 8px 24px rgba(0, 0, 0, 0.22));
  animation: featured-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--stagger, 0ms);
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease,
    background-color 200ms ease;
}

.featured-card:hover,
.featured-card:focus-visible {
  z-index: 1;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--sh-border, rgba(255, 255, 255, 0.08)));
  box-shadow: var(--sh-shadow-strong, 0 18px 40px rgba(0, 0, 0, 0.38));
  transform: translateY(-4px) scale(1.02);
  outline: none;
}

.featured-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.featured-card__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 20% 0%,
      color-mix(in srgb, var(--accent) 28%, transparent),
      transparent 48%
    ),
    var(--sh-surface-deep, #0d0d0d);
}

.featured-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1);
  transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.featured-card:hover .featured-card__image,
.featured-card:focus-visible .featured-card__image {
  transform: scale(1.06);
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
  color: #4ade80;
}

.featured-card__category {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
}

@keyframes featured-card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .featured-card,
  .featured-card__image {
    animation: none;
    transition: none;
  }

  .featured-card:hover,
  .featured-card:focus-visible {
    transform: none;
  }
}
</style>
