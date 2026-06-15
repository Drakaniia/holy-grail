<script setup lang="ts">
import { ArrowRight, Shuffle } from 'lucide-vue-next'
import SitesHomePreviewCard from '@/components/sites/home/SitesHomePreviewCard.vue'
import type { HomePreviewItem } from '@/types/home'

defineProps<{
  items: HomePreviewItem[]
  isLoading: boolean
}>()
</script>

<template>
  <section class="sites-home-showcase" aria-labelledby="sites-home-showcase-title">
    <div class="sites-home-showcase__header">
      <div>
        <p>Preview shelf</p>
        <h2 id="sites-home-showcase-title">A few doors already open.</h2>
      </div>
      <RouterLink to="/sites/development/cloud-hosting" class="sites-home-showcase__header-link">
        <Shuffle class="h-4 w-4" aria-hidden="true" />
        Cloud stack
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="items.length > 0" class="sites-home-showcase__grid">
      <SitesHomePreviewCard
        v-for="item in items"
        :key="item.slug"
        :item="item"
        variant="showcase"
      />
    </div>

    <div v-else-if="isLoading" class="sites-home-showcase__grid" aria-hidden="true">
      <div v-for="index in 6" :key="index" class="sites-home-showcase__skeleton hg-skeleton"></div>
    </div>
  </section>
</template>

<style scoped>
.sites-home-showcase {
  display: grid;
  gap: 1.25rem;
  padding: 0 clamp(1rem, 4%, 3rem) 3.5rem;
  background: linear-gradient(180deg, #1f1f1f 0%, #1f1f1f 100%);
  color: #ffffff;
}

.sites-home-showcase__header {
  display: flex;
  width: min(100%, 96rem);
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-inline: auto;
}

.sites-home-showcase__header p {
  color: #7aa7ff;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-showcase__header h2 {
  margin-top: 0.42rem;
  color: #ffffff;
  font-size: 2.2rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.sites-home-showcase__header-link {
  display: inline-flex;
  min-height: 2.55rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid rgba(122, 167, 255, 0.34);
  border-radius: 0.5rem;
  background: rgba(122, 167, 255, 0.1);
  padding: 0 0.85rem;
  color: #dbe7ff;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
}

.sites-home-showcase__header-link:hover,
.sites-home-showcase__header-link:focus-visible {
  border-color: rgba(122, 167, 255, 0.7);
  background: rgba(122, 167, 255, 0.16);
  transform: translateY(-1px);
}

.sites-home-showcase__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  width: min(100%, 96rem);
  margin-inline: auto;
}

.sites-home-showcase__skeleton {
  min-height: 17rem;
  border-radius: 0.5rem;
}

:global(html.light .sites-home-showcase) {
  background: var(--mocha-bg);
  color: var(--mocha-text);
}

:global(html.light .sites-home-showcase__header h2) {
  color: var(--mocha-text);
}

:global(html.light .sites-home-showcase__header-link) {
  border-color: color-mix(in srgb, #1d4ed8 24%, var(--mocha-border));
  background: rgba(29, 78, 216, 0.08);
  color: #1e3a8a;
}

@media (max-width: 1100px) {
  .sites-home-showcase__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .sites-home-showcase__header {
    align-items: stretch;
    flex-direction: column;
  }

  .sites-home-showcase__header h2 {
    font-size: 1.85rem;
  }

  .sites-home-showcase__header-link {
    width: fit-content;
  }

  .sites-home-showcase__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sites-home-showcase__header-link {
    transition: none;
  }
}
</style>
