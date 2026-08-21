<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import SitesHomeDiscovery from '@/components/sites/home/SitesHomeDiscovery.vue'
import SitesHomeFeaturedTools from '@/components/sites/home/SitesHomeFeaturedTools.vue'
import SitesHomeHeroCarousel from '@/components/sites/home/SitesHomeHeroCarousel.vue'
import SitesHomeTrendingTools from '@/components/sites/home/SitesHomeTrendingTools.vue'
import { useSitesHomeCatalog } from '@/composables/useSitesHomeCatalog'
import { useSitesStore } from '@/stores/sites'

interface SitePreviewEntry {
  image: string
  small: string
}

const store = useSitesStore()
const previews = shallowRef<Record<string, SitePreviewEntry>>({})
const previewsLoaded = shallowRef(false)

const sites = computed(() => store.allSites)
const loaded = computed(() => store.loaded)

const { heroTools, featuredTools, trendingTools, categories, libraries } = useSitesHomeCatalog({
  sites,
  previews,
  loaded,
})

const isLoading = computed(
  () => (store.loading || !previewsLoaded.value) && heroTools.value.length === 0,
)

const catalogError = computed(() => store.loadError)

onMounted(() => {
  void store.loadSites()
  void import('@/content/site-previews.json').then((module) => {
    previews.value = module.default as Record<string, SitePreviewEntry>
    previewsLoaded.value = true
  })
})
</script>

<template>
  <div class="sites-home">
    <div class="sites-home__frame">
      <div v-if="catalogError" class="sites-home__error" role="alert">
        {{ catalogError }}
      </div>

      <SitesHomeHeroCarousel :tools="heroTools" :is-loading="isLoading" />

      <div class="sites-home__stack">
        <SitesHomeFeaturedTools :tools="featuredTools" :is-loading="isLoading" />

        <SitesHomeTrendingTools :tools="trendingTools" :is-loading="isLoading" />

        <SitesHomeDiscovery
          :categories="categories"
          :libraries="libraries"
          :is-loading="isLoading"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  Theme tokens inherit into all child components.
  Dark defaults; light values apply when html.light is toggled.
*/
.sites-home {
  --sh-bg: #1a1a1a;
  --sh-surface: #222222;
  --sh-surface-elevated: #262626;
  --sh-surface-hover: #2a2a2a;
  --sh-surface-deep: #181818;
  --sh-border: rgba(255, 255, 255, 0.08);
  --sh-border-strong: rgba(255, 255, 255, 0.14);
  --sh-border-soft: rgba(255, 255, 255, 0.1);
  --sh-text: #e8e8e8;
  --sh-text-strong: #f0f0f0;
  --sh-text-soft: rgba(255, 255, 255, 0.7);
  --sh-text-muted: rgba(255, 255, 255, 0.5);
  --sh-text-faint: rgba(255, 255, 255, 0.3);
  --sh-accent: #ff8c1a;
  --sh-verified: #4ade80;
  --sh-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  --sh-shadow-strong: 0 18px 40px rgba(0, 0, 0, 0.45);
  --sh-shadow-hero: 0 20px 50px rgba(0, 0, 0, 0.35);
  --sh-shadow-preview: 0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04);
  --sh-control-bg: rgba(0, 0, 0, 0.5);
  --sh-control-bg-hover: rgba(0, 0, 0, 0.7);
  --sh-control-fg: #e8e8e8;
  --sh-cta-bg: #e8e8e8;
  --sh-cta-fg: #141414;
  --sh-cta-bg-hover: #f0f0f0;
  --sh-indicator: rgba(255, 255, 255, 0.25);
  --sh-indicator-track: rgba(255, 255, 255, 0.16);
  --sh-indicator-fill: #e8e8e8;
  --sh-meta-scrim: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.85) 62%);
  --sh-logo-bg: rgba(0, 0, 0, 0.4);
  --sh-feature-bg: rgba(255, 255, 255, 0.04);
  --sh-feature-bg-hover: rgba(255, 255, 255, 0.07);
  --sh-item-hover: #2a2a2a;
  --sh-error-border: rgba(248, 113, 113, 0.35);
  --sh-error-bg: rgba(248, 113, 113, 0.1);
  --sh-error-text: #fecaca;
  --sh-chip-mix-base: #e8e8e8;

  min-height: 100%;
  background: var(--sh-bg);
  color: var(--sh-text);
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

:global(html.light .sites-home) {
  --sh-bg: var(--mocha-bg);
  --sh-surface: var(--mocha-surface);
  --sh-surface-elevated: var(--mocha-surface-strong);
  --sh-surface-hover: var(--mocha-surface-strong);
  --sh-surface-deep: var(--mocha-surface-muted);
  --sh-border: var(--mocha-border);
  --sh-border-strong: var(--mocha-border-strong);
  --sh-border-soft: var(--mocha-border);
  --sh-text: var(--mocha-text);
  --sh-text-strong: var(--mocha-text);
  --sh-text-soft: var(--mocha-text-soft);
  --sh-text-muted: var(--mocha-muted);
  --sh-text-faint: var(--mocha-faint);
  --sh-accent: #ff7a00;
  --sh-verified: #16a34a;
  --sh-shadow: 0 8px 20px rgba(45, 33, 25, 0.08);
  --sh-shadow-strong: 0 16px 36px rgba(45, 33, 25, 0.14);
  --sh-shadow-hero: 0 16px 40px rgba(45, 33, 25, 0.1);
  --sh-shadow-preview: 0 18px 36px rgba(45, 33, 25, 0.12), 0 0 0 1px var(--mocha-border);
  --sh-control-bg: rgba(255, 250, 243, 0.88);
  --sh-control-bg-hover: #fff5e8;
  --sh-control-fg: var(--mocha-text);
  --sh-cta-bg: var(--mocha-text);
  --sh-cta-fg: #fffaf3;
  --sh-cta-bg-hover: #3d2d22;
  --sh-indicator: rgba(45, 33, 25, 0.18);
  --sh-indicator-track: rgba(45, 33, 25, 0.1);
  --sh-indicator-fill: var(--mocha-text);
  --sh-meta-scrim: linear-gradient(180deg, transparent, rgba(45, 33, 25, 0.86) 62%);
  --sh-logo-bg: var(--mocha-surface-muted);
  --sh-feature-bg: rgba(255, 250, 243, 0.72);
  --sh-feature-bg-hover: rgba(255, 245, 232, 0.95);
  --sh-item-hover: rgba(255, 140, 26, 0.1);
  --sh-error-border: rgba(197, 0, 0, 0.2);
  --sh-error-bg: rgba(247, 212, 214, 0.55);
  --sh-error-text: #c50000;
  --sh-chip-mix-base: var(--mocha-text);

  background: var(--mocha-bg);
  color: var(--mocha-text);
}

.sites-home__frame {
  width: min(100%, 1600px);
  margin-inline: auto;
  padding: 1.5rem 32px 3.5rem;
}

.sites-home__stack {
  display: grid;
  gap: 3rem;
  margin-top: 3rem;
}

.sites-home__error {
  margin-bottom: 1rem;
  border: 1px solid var(--sh-error-border);
  border-radius: 14px;
  background: var(--sh-error-bg);
  padding: 0.85rem 1rem;
  color: var(--sh-error-text);
  font-size: 0.9rem;
}

@media (max-width: 720px) {
  .sites-home__frame {
    padding: 1rem 1rem 2.5rem;
  }

  .sites-home__stack {
    gap: 2.25rem;
    margin-top: 2.25rem;
  }
}
</style>
