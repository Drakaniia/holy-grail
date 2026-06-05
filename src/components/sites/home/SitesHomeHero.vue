<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Boxes, Hammer, Palette, Sparkles } from 'lucide-vue-next'
import ShapeGrid from '@/components/home/ShapeGrid.vue'
import SitesHomePreviewCard from '@/components/sites/home/SitesHomePreviewCard.vue'
import { useRandomPreviewTiles } from '@/composables/useRandomPreviewTiles'
import type { HomePreviewItem } from '@/types/home'
import type { SitesHomeMetric } from '@/types/sitesHome'

const props = defineProps<{
  metrics: SitesHomeMetric[]
  previewItems: HomePreviewItem[]
  isLoading: boolean
}>()

const previewItems = computed(() => props.previewItems)
const { markImageFailed, tiles } = useRandomPreviewTiles({
  items: previewItems,
  tileCount: 7,
  initialDelayRange: [180, 1400],
  rotationDelayRange: [2600, 6200],
})

const heroTile = computed(() => tiles.value[0])
const supportingTiles = computed(() => tiles.value.slice(1, 7))
</script>

<template>
  <section class="sites-home-hero" aria-labelledby="sites-home-title">
    <ShapeGrid
      class="sites-home-hero__grid"
      direction="diagonal"
      :speed="0.28"
      :square-size="62"
      border-color="rgba(255, 255, 255, 0.12)"
      hover-fill-color="rgba(255, 140, 26, 0.16)"
      shape="triangle"
      :hover-trail-amount="4"
      aria-hidden="true"
    />

    <div class="sites-home-hero__index">
      <span>Sites Atlas</span>
      <span>HG-SITES</span>
    </div>

    <div class="sites-home-hero__layout">
      <div class="sites-home-hero__copy">
        <p class="sites-home-hero__eyebrow">
          <Sparkles class="h-4 w-4" aria-hidden="true" />
          Curated web shelf
        </p>
        <h1 id="sites-home-title" class="sites-home-hero__title">
          Browse by signal.
        </h1>
        <p class="sites-home-hero__summary">
          A visual front door for AI builders, design references, developer platforms,
          streaming shelves, downloads, and the odd tools worth keeping close.
        </p>

        <div class="sites-home-hero__actions" aria-label="Featured site collections">
          <RouterLink to="/sites/ai/wb" class="sites-home-hero__primary-action">
            <Hammer class="h-4 w-4" aria-hidden="true" />
            AI builders
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/sites/design/inspiration" class="sites-home-hero__secondary-action">
            <Palette class="h-4 w-4" aria-hidden="true" />
            Inspiration
          </RouterLink>
          <RouterLink to="/sites/development/ui-libraries" class="sites-home-hero__secondary-action">
            <Boxes class="h-4 w-4" aria-hidden="true" />
            UI kits
          </RouterLink>
        </div>

        <div class="sites-home-hero__metrics" aria-label="Sites catalog totals">
          <div
            v-for="metric in props.metrics"
            :key="metric.label"
            class="sites-home-hero__metric"
            :style="{ '--metric-accent': metric.accent }"
          >
            <span>{{ metric.value }}</span>
            <p>{{ metric.label }}</p>
          </div>
        </div>
      </div>

      <div class="sites-home-hero__stage" aria-label="Featured site previews">
        <div class="sites-home-hero__stage-header">
          <span>Live preview field</span>
          <span>{{ props.previewItems.length }} captures</span>
        </div>

        <div class="sites-home-hero__preview-field">
          <SitesHomePreviewCard
            v-if="heroTile"
            class="sites-home-hero__main-preview"
            :item="heroTile.item"
            :previous-item="heroTile.previousItem"
            :animation-nonce="heroTile.animationNonce"
            variant="hero-large"
            @image-error="markImageFailed"
          />
          <div
            v-else-if="props.isLoading"
            class="sites-home-hero__main-preview sites-home-hero__preview-skeleton hg-skeleton"
            aria-hidden="true"
          ></div>

          <div class="sites-home-hero__supporting-grid">
            <SitesHomePreviewCard
              v-for="tile in supportingTiles"
              :key="tile.key"
              :item="tile.item"
              :previous-item="tile.previousItem"
              :animation-nonce="tile.animationNonce"
              variant="hero-small"
              @image-error="markImageFailed"
            />
            <div
              v-for="index in props.isLoading && supportingTiles.length === 0 ? 4 : 0"
              :key="`sites-home-skeleton-${index}`"
              class="sites-home-hero__preview-skeleton hg-skeleton"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sites-home-hero {
  position: relative;
  min-height: 41rem;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.18), transparent 24rem),
    linear-gradient(180deg, #1f1f1f 0%, #1f1f1f 62%, #1f1f1f 100%);
  color: #ffffff;
}

.sites-home-hero::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(90deg, rgba(31, 31, 31, 0.92), rgba(31, 31, 31, 0.42) 58%, rgba(31, 31, 31, 0.9)),
    radial-gradient(circle at 82% 20%, rgba(57, 255, 180, 0.12), transparent 20rem);
}

.sites-home-hero__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.62;
}

.sites-home-hero__index,
.sites-home-hero__layout {
  position: relative;
  z-index: 2;
}

.sites-home-hero__index {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  width: min(100%, 96rem);
  margin-inline: auto;
  padding: 1.4rem clamp(1rem, 4%, 3rem) 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-hero__layout {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(34rem, 1.18fr);
  gap: 3rem;
  align-items: center;
  width: min(100%, 96rem);
  margin-inline: auto;
  padding: 3.2rem clamp(1rem, 4%, 3rem) 4rem;
}

.sites-home-hero__copy {
  display: grid;
  gap: 1.35rem;
  min-width: 0;
}

.sites-home-hero__eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.55rem;
  border-left: 0.24rem solid #39ffb4;
  padding-left: 0.72rem;
  color: #e8fff7;
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-hero__eyebrow svg {
  color: #39ffb4;
}

.sites-home-hero__title {
  max-width: 8ch;
  color: #ffffff;
  font-size: 5.8rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.92;
}

.sites-home-hero__summary {
  max-width: 39rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1.08rem;
  line-height: 1.68;
}

.sites-home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  padding-top: 0.1rem;
}

.sites-home-hero__primary-action,
.sites-home-hero__secondary-action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.52rem;
  border: 1px solid;
  border-radius: 0.5rem;
  padding: 0 0.92rem;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  transition:
    border-color 170ms ease,
    background-color 170ms ease,
    color 170ms ease,
    transform 170ms ease;
}

.sites-home-hero__primary-action {
  border-color: #ff8c1a;
  background: #ff8c1a;
  color: #1f1f1f;
}

.sites-home-hero__secondary-action {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.sites-home-hero__primary-action:hover,
.sites-home-hero__secondary-action:hover,
.sites-home-hero__primary-action:focus-visible,
.sites-home-hero__secondary-action:focus-visible {
  transform: translateY(-1px);
}

.sites-home-hero__secondary-action:hover,
.sites-home-hero__secondary-action:focus-visible {
  border-color: rgba(57, 255, 180, 0.62);
  background: rgba(57, 255, 180, 0.1);
}

.sites-home-hero__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  width: min(100%, 32rem);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
}

.sites-home-hero__metric {
  display: grid;
  gap: 0.38rem;
  background: rgba(31, 31, 31, 0.88);
  padding: 0.88rem;
}

.sites-home-hero__metric span {
  color: var(--metric-accent);
  font-size: 1.55rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
}

.sites-home-hero__metric p {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-hero__stage {
  min-width: 0;
}

.sites-home-hero__stage-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.72rem;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-hero__preview-field {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(17rem, 0.88fr);
  gap: 0.82rem;
  align-items: stretch;
}

.sites-home-hero__supporting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.82rem;
}

.sites-home-hero__preview-skeleton {
  min-height: 9rem;
  border-radius: 0.5rem;
}

.sites-home-hero__main-preview.sites-home-hero__preview-skeleton {
  min-height: 20rem;
}

:global(html.light .sites-home-hero) {
  border-bottom-color: var(--mocha-border);
  background:
    linear-gradient(135deg, rgba(255, 140, 26, 0.2), transparent 24rem),
    var(--mocha-bg);
  color: var(--mocha-text);
}

:global(html.light .sites-home-hero::before) {
  background:
    linear-gradient(90deg, rgba(245, 238, 230, 0.94), rgba(245, 238, 230, 0.34) 58%, rgba(245, 238, 230, 0.9)),
    radial-gradient(circle at 82% 20%, rgba(4, 120, 87, 0.1), transparent 20rem);
}

:global(html.light .sites-home-hero__title),
:global(html.light .sites-home-hero__secondary-action) {
  color: var(--mocha-text);
}

:global(html.light .sites-home-hero__summary),
:global(html.light .sites-home-hero__index),
:global(html.light .sites-home-hero__stage-header),
:global(html.light .sites-home-hero__metric p) {
  color: var(--mocha-text-soft);
}

:global(html.light .sites-home-hero__eyebrow) {
  color: #047857;
}

:global(html.light .sites-home-hero__secondary-action),
:global(html.light .sites-home-hero__metrics) {
  border-color: var(--mocha-border);
  background: rgba(255, 250, 243, 0.7);
}

:global(html.light .sites-home-hero__metric) {
  background: rgba(255, 250, 243, 0.88);
}

@media (max-width: 1180px) {
  .sites-home-hero__layout {
    grid-template-columns: 1fr;
  }

  .sites-home-hero__title {
    max-width: 12ch;
  }
}

@media (max-width: 760px) {
  .sites-home-hero {
    min-height: auto;
  }

  .sites-home-hero__index {
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 1rem;
  }

  .sites-home-hero__layout {
    gap: 2rem;
    padding-top: 2rem;
  }

  .sites-home-hero__title {
    font-size: 3.8rem;
  }

  .sites-home-hero__summary {
    font-size: 1rem;
  }

  .sites-home-hero__metrics,
  .sites-home-hero__preview-field,
  .sites-home-hero__supporting-grid {
    grid-template-columns: 1fr;
  }

  .sites-home-hero__supporting-grid :deep(.sites-home-preview-card:nth-child(n + 4)) {
    display: none;
  }
}

@media (max-width: 440px) {
  .sites-home-hero__title {
    font-size: 3rem;
  }

  .sites-home-hero__actions {
    display: grid;
  }

  .sites-home-hero__primary-action,
  .sites-home-hero__secondary-action {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sites-home-hero__primary-action,
  .sites-home-hero__secondary-action {
    transition: none;
  }
}
</style>
