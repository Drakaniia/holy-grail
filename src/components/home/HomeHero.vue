<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Search, Sparkles } from 'lucide-vue-next'
import { useRandomPreviewTiles } from '@/composables/useRandomPreviewTiles'
import ShapeGrid from '@/components/home/ShapeGrid.vue'
import type { HomePreviewItem } from '@/types/home'

const props = defineProps<{
  totalSitesLabel: string
  totalSkillsLabel: string
  totalCategoriesLabel: string
  previewItems: HomePreviewItem[]
  isLoading: boolean
}>()

const previewItems = computed(() => props.previewItems)
const { markImageFailed, tiles: heroPreviewTiles } = useRandomPreviewTiles({
  items: previewItems,
  tileCount: 4,
  initialDelayRange: [120, 1600],
  rotationDelayRange: [2200, 5200],
})
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <ShapeGrid
      class="home-hero__shape-grid"
      direction="right"
      :speed="0.35"
      :square-size="54"
      border-color="rgba(255, 140, 26, 0.26)"
      hover-fill-color="rgba(255, 140, 26, 0.18)"
      shape="hexagon"
      :hover-trail-amount="5"
      aria-hidden="true"
    />

    <div class="home-hero__index">
      <span>HG-01</span>
      <span>Curated operating index</span>
    </div>

    <div class="home-hero__grid">
      <div class="home-hero__copy">
        <p class="home-hero__eyebrow">Holy Grail Library</p>
        <h1 id="home-hero-title" class="home-hero__title">Holy Grail</h1>
        <p class="home-hero__summary">
          A working index for cloud hosting, AI tools, design references, CLI agents, UI libraries,
          and reusable agent skills without losing the thread.
        </p>

        <div class="home-hero__actions" aria-label="Primary actions">
          <RouterLink to="/sites" class="home-hero__primary-link">
            Browse sites
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/skills/skills" class="home-hero__secondary-link">
            Browse skills
          </RouterLink>
        </div>
      </div>

      <div class="home-hero__panel" aria-label="Catalog preview">
        <div class="home-hero__panel-topline">
          <span>Live catalog surface</span>
          <span class="home-hero__topline-count">
            <span
              v-if="isLoading"
              class="home-hero__topline-skeleton hg-skeleton"
              aria-hidden="true"
            ></span>
            <span v-else>{{ totalCategoriesLabel }} groups</span>
          </span>
        </div>

        <div class="home-hero__preview-grid">
          <RouterLink
            v-for="tile in heroPreviewTiles"
            :key="tile.key"
            :to="tile.item.to"
            class="home-hero__preview"
            :aria-label="`Open ${tile.item.name} overview`"
          >
            <span class="home-hero__preview-media">
              <span class="home-hero__preview-stage">
                <picture
                  v-if="tile.previousItem"
                  class="home-hero__preview-image home-hero__preview-image--previous"
                  aria-hidden="true"
                >
                  <source :srcset="tile.previousItem.small" media="(max-width: 720px)" />
                  <img :src="tile.previousItem.image" alt="" loading="lazy" decoding="async" />
                </picture>

                <picture
                  :key="`${tile.key}-${tile.item.slug}-${tile.animationNonce}`"
                  class="home-hero__preview-image home-hero__preview-image--current"
                  :class="{ 'home-hero__preview-image--incoming': tile.previousItem }"
                >
                  <source :srcset="tile.item.small" media="(max-width: 720px)" />
                  <img
                    :src="tile.item.image"
                    :alt="`${tile.item.name} site preview`"
                    loading="lazy"
                    decoding="async"
                    @error="markImageFailed(tile.item.slug)"
                  />
                </picture>
              </span>
            </span>
            <span class="home-hero__preview-meta">
              <span>{{ tile.item.rank }}</span>
              <strong>{{ tile.item.name }}</strong>
            </span>
          </RouterLink>

          <div
            v-for="index in isLoading && heroPreviewTiles.length === 0 ? 4 : 0"
            :key="`preview-skeleton-${index}`"
            class="home-hero__preview home-hero__preview--skeleton"
            aria-hidden="true"
          >
            <span class="home-hero__preview-media">
              <span class="home-hero__preview-skeleton-media hg-skeleton"></span>
            </span>
            <span class="home-hero__preview-meta">
              <span class="home-hero__preview-rank-skeleton hg-skeleton"></span>
              <strong class="home-hero__preview-title-skeleton hg-skeleton"></strong>
            </span>
          </div>
        </div>

        <div class="home-hero__metrics" aria-label="Catalog totals">
          <div>
            <span
              v-if="isLoading"
              class="home-hero__metric-skeleton hg-skeleton"
              aria-hidden="true"
            ></span>
            <span v-else>{{ totalSitesLabel }}</span>
            <p>Sites</p>
          </div>
          <div>
            <span
              v-if="isLoading"
              class="home-hero__metric-skeleton hg-skeleton"
              aria-hidden="true"
            ></span>
            <span v-else>{{ totalSkillsLabel }}</span>
            <p>Skills</p>
          </div>
          <div>
            <span
              v-if="isLoading"
              class="home-hero__metric-skeleton hg-skeleton"
              aria-hidden="true"
            ></span>
            <span v-else>{{ totalCategoriesLabel }}</span>
            <p>Groups</p>
          </div>
        </div>
      </div>
    </div>

    <div class="home-hero__utility">
      <div>
        <Sparkles class="h-4 w-4" aria-hidden="true" />
        <span>Runtime indexes load from public content manifests.</span>
      </div>
      <div>
        <Search class="h-4 w-4" aria-hidden="true" />
        <span>Use global search with Ctrl or Cmd K from anywhere.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  display: grid;
  gap: 1.5rem;
  min-height: min(680px, calc(100dvh - 9rem));
  overflow: hidden;
  padding: clamp(2rem, 4vw, 4.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: #1f1f1f;
}

.home-hero::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(120deg, rgba(255, 122, 0, 0.18), transparent 26rem),
    linear-gradient(180deg, rgba(31, 31, 31, 0) 0%, #1f1f1f 100%);
}

.home-hero__shape-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.78;
}

.home-hero__index,
.home-hero__grid,
.home-hero__utility {
  position: relative;
  z-index: 2;
}

.home-hero__index {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: min(100%, 112rem);
  margin-inline: auto;
  color: #8b8b8b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(24rem, 0.82fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  width: min(100%, 112rem);
  margin-inline: auto;
}

.home-hero__copy {
  display: grid;
  gap: 1.35rem;
  max-width: 54rem;
}

.home-hero__eyebrow {
  width: fit-content;
  border-left: 0.22rem solid #ff7a00;
  padding-left: 0.7rem;
  color: #d7d7d7;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.home-hero__title {
  max-width: 7ch;
  color: #ffffff;
  font-size: clamp(4.3rem, 11vw, 8.8rem);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 0.9;
}

.home-hero__summary {
  max-width: 45rem;
  color: #b7b7b7;
  font-size: clamp(1rem, 1.4vw, 1.22rem);
  line-height: 1.65;
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.45rem;
}

.home-hero__primary-link,
.home-hero__secondary-link {
  display: inline-flex;
  min-height: 2.85rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 1px solid;
  padding: 0 1rem;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.home-hero__primary-link {
  border-color: #ff7a00;
  background: #ff7a00;
  color: #1f1f1f;
}

.home-hero__secondary-link {
  border-color: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.home-hero__primary-link:hover,
.home-hero__secondary-link:hover {
  transform: translateY(-1px);
}

.home-hero__secondary-link:hover {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.07);
}

.home-hero__panel {
  display: grid;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(31, 31, 31, 0.82);
  padding: clamp(1rem, 2vw, 1.4rem);
}

.home-hero__panel-topline,
.home-hero__preview-meta,
.home-hero__metrics {
  display: flex;
}

.home-hero__panel-topline {
  justify-content: space-between;
  gap: 1rem;
  color: #8b8b8b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.home-hero__preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.home-hero__preview {
  min-height: 9rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #1f1f1f;
}

.home-hero__preview {
  position: relative;
  display: block;
  color: inherit;
  transition:
    border-color 180ms ease,
    transform 180ms ease;
}

.home-hero__preview:hover,
.home-hero__preview:focus-visible {
  border-color: rgba(255, 122, 0, 0.78);
  transform: translateY(-2px);
}

.home-hero__preview--skeleton:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: none;
}

.home-hero__preview:focus-visible {
  outline: 2px solid #ff8c1a;
  outline-offset: 3px;
}

.home-hero__preview-media {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
}

.home-hero__preview-stage,
.home-hero__preview-image {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
}

.home-hero__preview-image {
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}

.home-hero__preview-image--previous {
  z-index: 1;
  animation: home-hero-preview-slide-away 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-hero__preview-image--current {
  z-index: 2;
}

.home-hero__preview-image--incoming {
  animation: home-hero-preview-slide-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform;
}

.home-hero__preview-image img {
  width: 100%;
  height: 100%;
  min-height: 9rem;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  filter: saturate(0.78) contrast(1.04);
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.home-hero__preview:hover .home-hero__preview-image img,
.home-hero__preview:focus-visible .home-hero__preview-image img {
  filter: saturate(1) contrast(1.08);
  transform: scale(1.025);
}

.home-hero__preview-meta {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  background: rgba(0, 0, 0, 0.84);
  padding: 0.55rem 0.65rem;
  color: #d8d8d8;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-hero__preview-meta strong {
  min-width: 0;
  overflow: hidden;
  color: #ffffff;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-hero__preview-skeleton-media,
.home-hero__preview-rank-skeleton,
.home-hero__preview-title-skeleton,
.home-hero__metric-skeleton,
.home-hero__topline-skeleton {
  display: block;
}

.home-hero__preview-skeleton-media {
  height: 100%;
  width: 100%;
}

.home-hero__preview-rank-skeleton {
  height: 0.7rem;
  width: 1.5rem;
  border-radius: 9999px;
}

.home-hero__preview-title-skeleton {
  height: 0.8rem;
  width: min(7rem, 62%);
  border-radius: 9999px;
}

.home-hero__metric-skeleton {
  height: clamp(1.6rem, 3vw, 2.7rem);
  width: 4.5rem;
  border-radius: 9999px;
}

.home-hero__topline-count {
  display: inline-flex;
  min-width: 4.25rem;
  justify-content: flex-end;
}

.home-hero__topline-skeleton {
  height: 0.7rem;
  width: 4.25rem;
  border-radius: 9999px;
}

.home-hero__metrics {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.home-hero__metrics div {
  flex: 1;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1rem 0.9rem 0.1rem 0;
}

.home-hero__metrics div:last-child {
  border-right: 0;
  padding-right: 0;
}

.home-hero__metrics span {
  display: block;
  color: #ffffff;
  font-size: clamp(1.6rem, 3vw, 2.7rem);
  font-weight: 800;
  line-height: 1;
}

.home-hero__metrics p {
  margin-top: 0.45rem;
  color: #8b8b8b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-hero__utility {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  width: min(100%, 112rem);
  margin-inline: auto;
  align-self: end;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.12);
}

.home-hero__utility div {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: rgba(31, 31, 31, 0.9);
  padding: 0.85rem 1rem;
  color: #a8a8a8;
  font-size: 0.82rem;
  line-height: 1.4;
}

.home-hero__utility svg {
  flex-shrink: 0;
  color: #ff8c1a;
}

:global(html.light .home-hero) {
  border-bottom-color: var(--mocha-border);
  background: var(--mocha-bg);
}

:global(html.light .home-hero::before) {
  background:
    linear-gradient(120deg, rgba(255, 122, 0, 0.18), transparent 26rem),
    linear-gradient(180deg, rgba(245, 238, 230, 0) 0%, var(--mocha-bg) 100%);
}

:global(html.light .home-hero__shape-grid) {
  opacity: 0.42;
}

:global(html.light .home-hero__index),
:global(html.light .home-hero__panel-topline),
:global(html.light .home-hero__preview-meta span),
:global(html.light .home-hero__metrics p) {
  color: var(--mocha-muted);
}

:global(html.light .home-hero__eyebrow),
:global(html.light .home-hero__title),
:global(html.light .home-hero__preview-meta strong),
:global(html.light .home-hero__metrics span),
:global(html.light .home-hero__secondary-link) {
  color: var(--mocha-text);
}

:global(html.light .home-hero__summary),
:global(html.light .home-hero__utility div) {
  color: var(--mocha-text-soft);
}

:global(html.light .home-hero__panel),
:global(html.light .home-hero__utility div) {
  border-color: var(--mocha-border);
  background: rgba(255, 250, 243, 0.86);
}

:global(html.light .home-hero__utility) {
  border-color: var(--mocha-border);
  background: var(--mocha-border);
}

:global(html.light .home-hero__secondary-link),
:global(html.light .home-hero__preview),
:global(html.light .home-hero__metrics),
:global(html.light .home-hero__metrics div) {
  border-color: var(--mocha-border);
}

:global(html.light .home-hero__secondary-link:hover) {
  background: rgba(255, 122, 0, 0.1);
}

@keyframes home-hero-preview-slide-in {
  from {
    transform: translate3d(104%, 0, 0);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes home-hero-preview-slide-away {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-14%, 0, 0);
  }
}

@media (max-width: 1180px) {
  .home-hero__grid {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .home-hero__title {
    max-width: 8ch;
  }
}

@media (max-width: 720px) {
  .home-hero {
    padding: 1.25rem;
  }

  .home-hero__index,
  .home-hero__utility {
    grid-template-columns: 1fr;
  }

  .home-hero__index {
    align-items: flex-start;
    flex-direction: column;
  }

  .home-hero__title {
    font-size: clamp(3rem, 16vw, 4.2rem);
  }

  .home-hero__preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .home-hero__preview {
    min-height: 7rem;
  }

  .home-hero__preview:nth-of-type(n + 3) {
    display: none;
  }

  .home-hero__metrics {
    display: flex;
  }

  .home-hero__metrics div {
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 0;
    padding: 0.8rem 0.55rem 0 0;
  }

  .home-hero__metrics div:last-child {
    border-right: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__preview,
  .home-hero__preview-image--incoming,
  .home-hero__preview-image--previous,
  .home-hero__preview-image img {
    animation: none;
    transition: none;
  }

  .home-hero__primary-link,
  .home-hero__secondary-link {
    transition: none;
  }
}
</style>
