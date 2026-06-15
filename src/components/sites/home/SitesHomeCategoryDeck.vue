<script setup lang="ts">
import type { Component } from 'vue'
import { Bot, Code2, Download, Film, Palette } from 'lucide-vue-next'
import type { SitesHomeCategorySummary, SitesHomeGroupKey } from '@/types/sitesHome'

defineProps<{
  summaries: SitesHomeCategorySummary[]
}>()

function getCategoryIcon(key: SitesHomeGroupKey): Component {
  switch (key) {
    case 'ai':
      return Bot
    case 'design':
      return Palette
    case 'development':
      return Code2
    case 'watch':
      return Film
    case 'downloads':
      return Download
  }
}
</script>

<template>
  <section class="sites-home-category-deck" aria-labelledby="sites-home-category-title">
    <div class="sites-home-category-deck__header">
      <p>Main corridors</p>
      <h2 id="sites-home-category-title">A homepage for the whole catalog.</h2>
    </div>

    <div class="sites-home-category-deck__grid">
      <article
        v-for="summary in summaries"
        :key="summary.key"
        class="sites-home-category-deck__card"
        :style="{ '--category-accent': summary.accent }"
      >
        <RouterLink
          :to="summary.route"
          class="sites-home-category-deck__main-link"
          :aria-label="`Open ${summary.name} sites`"
        >
          <span class="sites-home-category-deck__icon">
            <component :is="getCategoryIcon(summary.key)" class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="sites-home-category-deck__topline">
            <span>{{ summary.name }}</span>
            <strong>{{ summary.countLabel }}</strong>
          </span>
          <span class="sites-home-category-deck__description">
            {{ summary.description }}
          </span>
        </RouterLink>

        <div
          v-if="summary.subroutes.length > 0"
          class="sites-home-category-deck__subroutes"
          aria-label="Subcollections"
        >
          <RouterLink
            v-for="subroute in summary.subroutes"
            :key="subroute.to"
            :to="subroute.to"
            class="sites-home-category-deck__subroute"
          >
            <span>{{ subroute.label }}</span>
            <strong>{{ subroute.countLabel }}</strong>
          </RouterLink>
        </div>

        <p v-if="summary.featuredNames.length > 0" class="sites-home-category-deck__featured">
          <span v-for="name in summary.featuredNames" :key="name">
            {{ name }}
          </span>
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.sites-home-category-deck {
  display: grid;
  gap: 1.25rem;
  padding: 3rem clamp(1rem, 4%, 3rem);
  background: linear-gradient(180deg, #1f1f1f 0%, #1f1f1f 100%);
  color: #ffffff;
}

.sites-home-category-deck__header {
  display: grid;
  gap: 0.45rem;
  width: min(100%, 96rem);
  margin-inline: auto;
}

.sites-home-category-deck__header p {
  color: #39ffb4;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-category-deck__header h2 {
  max-width: 42rem;
  color: #ffffff;
  font-size: 2.4rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.sites-home-category-deck__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  width: min(100%, 96rem);
  margin-inline: auto;
}

.sites-home-category-deck__card {
  position: relative;
  display: grid;
  min-height: 22rem;
  align-content: space-between;
  gap: 1rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 0.5rem;
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--category-accent) 18%, transparent),
      transparent 48%
    ),
    #1f1f1f;
}

.sites-home-category-deck__card::before {
  position: absolute;
  inset: auto -1rem -2.5rem auto;
  width: 8rem;
  height: 8rem;
  border: 1px solid color-mix(in srgb, var(--category-accent) 60%, transparent);
  border-radius: 50%;
  content: '';
  opacity: 0.32;
}

.sites-home-category-deck__main-link {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  color: inherit;
}

.sites-home-category-deck__icon {
  display: inline-flex;
  width: 2.65rem;
  height: 2.65rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--category-accent) 42%, rgba(255, 255, 255, 0.12));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--category-accent) 16%, rgba(255, 255, 255, 0.04));
  color: var(--category-accent);
}

.sites-home-category-deck__topline {
  display: grid;
  gap: 0.38rem;
}

.sites-home-category-deck__topline span {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.sites-home-category-deck__topline strong {
  color: var(--category-accent);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-category-deck__description {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.88rem;
  line-height: 1.5;
}

.sites-home-category-deck__subroutes {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  padding: 0 1rem;
}

.sites-home-category-deck__subroute {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.42rem 0.5rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.sites-home-category-deck__subroute span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sites-home-category-deck__subroute strong {
  color: var(--category-accent);
  font-weight: 900;
}

.sites-home-category-deck__main-link:hover .sites-home-category-deck__topline span,
.sites-home-category-deck__main-link:focus-visible .sites-home-category-deck__topline span {
  color: var(--category-accent);
}

.sites-home-category-deck__subroute:hover,
.sites-home-category-deck__subroute:focus-visible {
  border-color: color-mix(in srgb, var(--category-accent) 55%, rgba(255, 255, 255, 0.1));
  background: color-mix(in srgb, var(--category-accent) 12%, rgba(255, 255, 255, 0.04));
  color: #ffffff;
}

.sites-home-category-deck__featured {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0 1rem 1rem;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.74rem;
  line-height: 1.35;
}

.sites-home-category-deck__featured span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sites-home-category-deck__featured span:not(:last-child)::after {
  content: ',';
}

:global(html.light .sites-home-category-deck) {
  background: var(--mocha-bg);
  color: var(--mocha-text);
}

:global(html.light .sites-home-category-deck__header h2),
:global(html.light .sites-home-category-deck__topline span) {
  color: var(--mocha-text);
}

:global(html.light .sites-home-category-deck__card) {
  border-color: var(--mocha-border);
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--category-accent) 15%, transparent),
      transparent 48%
    ),
    var(--mocha-surface);
}

:global(html.light .sites-home-category-deck__description),
:global(html.light .sites-home-category-deck__subroute),
:global(html.light .sites-home-category-deck__featured) {
  color: var(--mocha-text-soft);
}

:global(html.light .sites-home-category-deck__subroute) {
  border-color: var(--mocha-border);
  background: rgba(255, 250, 243, 0.66);
}

@media (max-width: 1280px) {
  .sites-home-category-deck__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .sites-home-category-deck__grid {
    grid-template-columns: 1fr;
  }

  .sites-home-category-deck__card {
    min-height: 17rem;
  }
}

@media (max-width: 560px) {
  .sites-home-category-deck {
    padding-block: 2.25rem;
  }

  .sites-home-category-deck__header h2 {
    font-size: 1.85rem;
  }
}
</style>
