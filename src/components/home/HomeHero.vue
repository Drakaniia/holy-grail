<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Search, Sparkles } from 'lucide-vue-next'
import type { HomePreviewItem } from '@/types/home'

const props = defineProps<{
  totalSitesLabel: string
  totalSkillsLabel: string
  totalCategoriesLabel: string
  previewItems: HomePreviewItem[]
  isLoading: boolean
}>()

const heroPreviewItems = computed(() => props.previewItems.slice(0, 4))
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__index">
      <span>HG-01</span>
      <span>Curated operating index</span>
    </div>

    <div class="home-hero__grid">
      <div class="home-hero__copy">
        <p class="home-hero__eyebrow">Holy Grail Library</p>
        <h1 id="home-hero-title" class="home-hero__title">Holy Grail</h1>
        <p class="home-hero__summary">
          A working index for cloud hosting, AI tools, design references, CLI agents, UI
          libraries, and reusable agent skills without losing the thread.
        </p>

        <div class="home-hero__actions" aria-label="Primary actions">
          <RouterLink to="/sites/development/cloud-hosting" class="home-hero__primary-link">
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
          <span>{{ totalCategoriesLabel }} groups</span>
        </div>

        <div class="home-hero__preview-grid">
          <div
            v-for="item in heroPreviewItems"
            :key="item.slug"
            class="home-hero__preview"
          >
            <picture>
              <source :srcset="item.small" media="(max-width: 720px)" />
              <img
                :src="item.image"
                :alt="`${item.name} site preview`"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div class="home-hero__preview-meta">
              <span>{{ item.rank }}</span>
              <strong>{{ item.name }}</strong>
            </div>
          </div>

          <div
            v-if="isLoading && heroPreviewItems.length === 0"
            class="home-hero__preview-skeleton"
            aria-label="Loading previews"
          ></div>
        </div>

        <div class="home-hero__metrics" aria-label="Catalog totals">
          <div>
            <span>{{ totalSitesLabel }}</span>
            <p>Sites</p>
          </div>
          <div>
            <span>{{ totalSkillsLabel }}</span>
            <p>Skills</p>
          </div>
          <div>
            <span>{{ totalCategoriesLabel }}</span>
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
  padding: clamp(2rem, 4vw, 4.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    #050505;
  background-size: 5rem 5rem;
}

.home-hero::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(120deg, rgba(255, 122, 0, 0.18), transparent 26rem),
    linear-gradient(180deg, rgba(5, 5, 5, 0) 0%, #050505 100%);
}

.home-hero__index,
.home-hero__grid,
.home-hero__utility {
  position: relative;
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
  color: #070707;
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
  background: rgba(5, 5, 5, 0.82);
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

.home-hero__preview,
.home-hero__preview-skeleton {
  min-height: 9rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #101010;
}

.home-hero__preview {
  position: relative;
}

.home-hero__preview img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  filter: saturate(0.78) contrast(1.04);
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

.home-hero__preview-skeleton {
  grid-column: 1 / -1;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent),
    #101010;
  background-size: 220% 100%;
  animation: home-skeleton 1.4s ease infinite;
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
  background: rgba(5, 5, 5, 0.9);
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
  background:
    linear-gradient(90deg, rgba(45, 33, 25, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(45, 33, 25, 0.07) 1px, transparent 1px),
    var(--mocha-bg);
}

:global(html.light .home-hero::before) {
  background:
    linear-gradient(120deg, rgba(255, 122, 0, 0.18), transparent 26rem),
    linear-gradient(180deg, rgba(245, 238, 230, 0) 0%, var(--mocha-bg) 100%);
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
:global(html.light .home-hero__preview-skeleton),
:global(html.light .home-hero__metrics),
:global(html.light .home-hero__metrics div) {
  border-color: var(--mocha-border);
}

:global(html.light .home-hero__secondary-link:hover) {
  background: rgba(255, 122, 0, 0.1);
}

@keyframes home-skeleton {
  from {
    background-position: 180% 0;
  }

  to {
    background-position: -80% 0;
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

  .home-hero__preview,
  .home-hero__preview-skeleton {
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
  .home-hero__preview-skeleton {
    animation: none;
  }

  .home-hero__primary-link,
  .home-hero__secondary-link {
    transition: none;
  }
}
</style>
