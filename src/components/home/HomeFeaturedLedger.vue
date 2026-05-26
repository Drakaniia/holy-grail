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
      <div v-for="index in 3" :key="index" class="home-ledger__skeleton"></div>
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
          <picture
            v-if="tile.previousItem"
            class="home-ledger__image home-ledger__image--previous"
          >
            <source :srcset="tile.previousItem.small" media="(max-width: 720px)" />
            <img
              :src="tile.previousItem.image"
              :alt="`${tile.previousItem.name} preview`"
              loading="lazy"
              decoding="async"
            />
          </picture>

          <picture
            :key="`${tile.key}-${tile.item.slug}-${tile.animationNonce}`"
            class="home-ledger__image home-ledger__image--incoming"
            :class="{ 'home-ledger__image--wipe': tile.previousItem }"
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
  background: #050505;
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
  background: #111111;
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

.home-ledger__media,
.home-ledger__image {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
}

.home-ledger__image--wipe {
  animation: home-ledger-mask-swipe 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
  clip-path: inset(0 100% 0 0);
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

.home-ledger__state,
.home-ledger__skeleton {
  min-height: 12rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #0d0d0d;
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

.home-ledger__skeleton {
  grid-column: span 2;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent),
    #101010;
  background-size: 220% 100%;
  animation: home-ledger-skeleton 1.4s ease infinite;
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
:global(html.light .home-ledger__state),
:global(html.light .home-ledger__skeleton) {
  border-color: var(--mocha-border);
}

:global(html.light .home-ledger__grid) {
  background: var(--mocha-border);
}

:global(html.light .home-ledger__state),
:global(html.light .home-ledger__skeleton) {
  background: var(--mocha-surface);
  color: var(--mocha-text-soft);
}

@keyframes home-ledger-skeleton {
  from {
    background-position: 180% 0;
  }

  to {
    background-position: -80% 0;
  }
}

@keyframes home-ledger-mask-swipe {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
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

  .home-ledger__item:nth-child(n),
  .home-ledger__skeleton {
    grid-column: span 1;
  }
}

@media (max-width: 620px) {
  .home-ledger__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-ledger__image--wipe,
  .home-ledger__item img,
  .home-ledger__link,
  .home-ledger__skeleton {
    animation: none;
    transition: none;
  }
}
</style>
