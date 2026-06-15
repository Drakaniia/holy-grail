<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ImageOff } from 'lucide-vue-next'
import { useRandomPreviewTiles } from '@/composables/useRandomPreviewTiles'
import type { HomePreviewItem } from '@/types/home'

const props = defineProps<{
  items: HomePreviewItem[]
  isLoading: boolean
  error: string | null
}>()

const previewItems = computed(() => props.items)
const { markImageFailed, tiles: visibleTiles } = useRandomPreviewTiles({
  items: previewItems,
  tileCount: 6,
})
</script>

<template>
  <section class="home-ledger" aria-labelledby="home-ledger-title">
    <div class="home-ledger__intro">
      <p>HG-03 / Preview ledger</p>
      <h2 id="home-ledger-title">The catalog is visual before it is searchable.</h2>
      <RouterLink to="/sites/design/inspiration" class="home-ledger__link">
        Open inspiration
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="error" class="home-ledger__state" role="alert">
      {{ error }}
    </div>

    <div v-else-if="isLoading && visibleTiles.length === 0" class="home-ledger__grid">
      <div
        v-for="index in 6"
        :key="index"
        class="home-ledger__item home-ledger__item--skeleton"
        aria-hidden="true"
      >
        <span class="home-ledger__media">
          <span class="home-ledger__skeleton-media hg-skeleton"></span>
        </span>
        <span class="home-ledger__item-meta">
          <span
            class="home-ledger__meta-skeleton home-ledger__meta-skeleton--small hg-skeleton"
          ></span>
          <strong
            class="home-ledger__meta-skeleton home-ledger__meta-skeleton--title hg-skeleton"
          ></strong>
        </span>
      </div>
    </div>

    <div v-else-if="visibleTiles.length > 0" class="home-ledger__grid">
      <RouterLink
        v-for="tile in visibleTiles"
        :key="tile.key"
        :to="tile.item.to"
        class="home-ledger__item"
        :aria-label="`Open ${tile.item.name} overview`"
      >
        <span class="home-ledger__media">
          <span class="home-ledger__stage">
            <picture
              v-if="tile.previousItem"
              class="home-ledger__image home-ledger__image--previous"
              aria-hidden="true"
            >
              <source :srcset="tile.previousItem.small" media="(max-width: 720px)" />
              <img :src="tile.previousItem.image" alt="" loading="lazy" decoding="async" />
            </picture>

            <picture
              :key="`${tile.key}-${tile.item.slug}-${tile.animationNonce}`"
              class="home-ledger__image home-ledger__image--current"
              :class="{ 'home-ledger__image--incoming': tile.previousItem }"
            >
              <source :srcset="tile.item.small" media="(max-width: 720px)" />
              <img
                :src="tile.item.image"
                :alt="`${tile.item.name} preview`"
                loading="lazy"
                decoding="async"
                @error="markImageFailed(tile.item.slug)"
              />
            </picture>
          </span>
        </span>
        <span class="home-ledger__item-meta">
          <span>{{ tile.item.rank }} / {{ tile.item.category }}</span>
          <strong>{{ tile.item.name }}</strong>
        </span>
      </RouterLink>
    </div>

    <div v-else class="home-ledger__state">
      <ImageOff class="h-5 w-5" aria-hidden="true" />
      <span>No preview images are available yet.</span>
    </div>
  </section>
</template>

<style scoped>
.home-ledger {
  display: grid;
  gap: 2rem;
  padding: clamp(2.5rem, 5vw, 5.5rem) clamp(1.25rem, 4vw, 4.5rem);
  background: #1f1f1f;
}

.home-ledger__intro {
  display: grid;
  grid-template-columns: minmax(10rem, 0.32fr) minmax(0, 1fr) auto;
  gap: clamp(1rem, 4vw, 4rem);
  align-items: end;
  width: min(100%, 112rem);
  margin-inline: auto;
}

.home-ledger__intro p {
  color: #8b8b8b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-ledger__intro h2 {
  max-width: 17ch;
  color: #ffffff;
  font-size: clamp(2.2rem, 5vw, 4.6rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.98;
}

.home-ledger__link {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-bottom: 1px solid #ff8c1a;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition: color 160ms ease;
}

.home-ledger__link:hover {
  color: #ffb15d;
}

.home-ledger__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  width: min(100%, 112rem);
  margin-inline: auto;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.home-ledger__item {
  position: relative;
  min-height: 16rem;
  overflow: hidden;
  background: #1f1f1f;
}

.home-ledger__item:nth-child(1),
.home-ledger__item:nth-child(6) {
  grid-column: span 3;
}

.home-ledger__item:nth-child(2),
.home-ledger__item:nth-child(3),
.home-ledger__item:nth-child(4),
.home-ledger__item:nth-child(5) {
  grid-column: span 3;
}

.home-ledger__media {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
}

.home-ledger__stage,
.home-ledger__image {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
}

.home-ledger__image {
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}

.home-ledger__image--previous {
  z-index: 1;
  animation: home-ledger-preview-slide-away 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-ledger__image--current {
  z-index: 2;
}

.home-ledger__image--incoming {
  animation: home-ledger-preview-slide-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform;
}

.home-ledger__image img {
  width: 100%;
  height: 100%;
  min-height: 16rem;
  object-fit: cover;
  filter: saturate(0.82) contrast(1.05);
  transform: scale(1.01);
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.home-ledger__item:hover img {
  filter: saturate(1) contrast(1.08);
  transform: scale(1.025);
}

.home-ledger__item-meta {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: grid;
  gap: 0.3rem;
  background: rgba(0, 0, 0, 0.86);
  padding: 0.9rem 1rem;
}

.home-ledger__item-meta span {
  color: #8b8b8b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-ledger__item-meta strong {
  overflow-wrap: anywhere;
  color: #ffffff;
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  font-weight: 800;
  line-height: 1;
}

.home-ledger__state {
  min-height: 12rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #1f1f1f;
}

.home-ledger__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: min(100%, 112rem);
  margin-inline: auto;
  color: #b7b7b7;
  font-size: 0.95rem;
}

.home-ledger__item--skeleton {
  pointer-events: none;
}

.home-ledger__skeleton-media {
  display: block;
  height: 100%;
  width: 100%;
}

.home-ledger__meta-skeleton {
  display: block;
  border-radius: 9999px;
}

.home-ledger__meta-skeleton--small {
  height: 0.7rem;
  width: 8rem;
}

.home-ledger__meta-skeleton--title {
  height: clamp(1.15rem, 2vw, 1.7rem);
  width: min(16rem, 72%);
}

:global(html.light .home-ledger) {
  background: var(--mocha-bg);
}

:global(html.light .home-ledger__intro p),
:global(html.light .home-ledger__item-meta span) {
  color: var(--mocha-muted);
}

:global(html.light .home-ledger__intro h2),
:global(html.light .home-ledger__link) {
  color: var(--mocha-text);
}

:global(html.light .home-ledger__grid),
:global(html.light .home-ledger__state) {
  border-color: var(--mocha-border);
}

:global(html.light .home-ledger__grid) {
  background: var(--mocha-border);
}

:global(html.light .home-ledger__state) {
  background: var(--mocha-surface);
  color: var(--mocha-text-soft);
}

@keyframes home-ledger-preview-slide-in {
  from {
    transform: translate3d(104%, 0, 0);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes home-ledger-preview-slide-away {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-14%, 0, 0);
  }
}

@media (max-width: 980px) {
  .home-ledger__intro {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .home-ledger__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-ledger__item:nth-child(n) {
    grid-column: span 1;
  }
}

@media (max-width: 620px) {
  .home-ledger__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-ledger__image--incoming,
  .home-ledger__image--previous,
  .home-ledger__item img,
  .home-ledger__link {
    animation: none;
    transition: none;
  }
}
</style>
