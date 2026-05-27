<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { HomeDirectoryRow } from '@/types/home'

defineProps<{
  rows: HomeDirectoryRow[]
}>()
</script>

<template>
  <section class="home-directory" aria-labelledby="home-directory-title">
    <div class="home-directory__heading">
      <p>HG-02 / Directory map</p>
      <h2 id="home-directory-title">Four ways into the library.</h2>
    </div>

    <div class="home-directory__rows">
      <RouterLink
        v-for="row in rows"
        :key="row.index"
        :to="row.to"
        class="home-directory__row"
      >
        <span class="home-directory__index">{{ row.index }}</span>
        <span class="home-directory__name">
          <span>{{ row.label }}</span>
          <small>{{ row.kicker }}</small>
        </span>
        <span class="home-directory__description">{{ row.description }}</span>
        <span class="home-directory__count">
          <span
            v-if="row.countLoading"
            class="home-directory__count-skeleton hg-skeleton"
            aria-hidden="true"
          ></span>
          <span v-else>{{ row.countLabel }}</span>
        </span>
        <ArrowUpRight class="home-directory__icon h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.home-directory {
  display: grid;
  gap: 2rem;
  padding: clamp(2.5rem, 5vw, 5.5rem) clamp(1.25rem, 4vw, 4.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: #090909;
}

.home-directory__heading {
  display: grid;
  grid-template-columns: minmax(10rem, 0.32fr) minmax(0, 1fr);
  gap: clamp(1rem, 4vw, 4rem);
  width: min(100%, 112rem);
  margin-inline: auto;
}

.home-directory__heading p {
  color: #8b8b8b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-directory__heading h2 {
  max-width: 16ch;
  color: #ffffff;
  font-size: clamp(2.2rem, 5vw, 4.9rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.96;
}

.home-directory__rows {
  display: grid;
  width: min(100%, 112rem);
  margin-inline: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.home-directory__row {
  display: grid;
  grid-template-columns: 4rem minmax(9rem, 0.6fr) minmax(14rem, 1fr) 7rem 1.5rem;
  gap: 1rem;
  align-items: center;
  min-height: 6.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  color: #ffffff;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    padding-left 160ms ease;
}

.home-directory__row:hover {
  background: rgba(255, 122, 0, 0.08);
  padding-left: 0.75rem;
}

.home-directory__index,
.home-directory__name small,
.home-directory__count {
  color: #8b8b8b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-directory__name {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.home-directory__name span {
  overflow-wrap: anywhere;
  color: #ffffff;
  font-size: clamp(1.35rem, 2vw, 2.1rem);
  font-weight: 800;
  line-height: 1;
}

.home-directory__description {
  max-width: 48rem;
  color: #b7b7b7;
  font-size: 0.96rem;
  line-height: 1.55;
}

.home-directory__count {
  color: #ffffff;
  text-align: right;
}

.home-directory__count-skeleton {
  display: inline-block;
  height: 0.75rem;
  width: 3.25rem;
  border-radius: 9999px;
}

.home-directory__icon {
  color: #ff8c1a;
  transition: transform 160ms ease;
}

.home-directory__row:hover .home-directory__icon {
  transform: translate(2px, -2px);
}

:global(html.light .home-directory) {
  border-bottom-color: var(--mocha-border);
  background: var(--mocha-surface);
}

:global(html.light .home-directory__heading p),
:global(html.light .home-directory__index),
:global(html.light .home-directory__name small) {
  color: var(--mocha-muted);
}

:global(html.light .home-directory__heading h2),
:global(html.light .home-directory__name span),
:global(html.light .home-directory__row),
:global(html.light .home-directory__count) {
  color: var(--mocha-text);
}

:global(html.light .home-directory__description) {
  color: var(--mocha-text-soft);
}

:global(html.light .home-directory__rows),
:global(html.light .home-directory__row) {
  border-color: var(--mocha-border);
}

:global(html.light .home-directory__row:hover) {
  background: rgba(255, 122, 0, 0.1);
}

@media (max-width: 920px) {
  .home-directory__heading {
    grid-template-columns: 1fr;
  }

  .home-directory__row {
    grid-template-columns: 3rem minmax(0, 1fr) 1.5rem;
    gap: 0.8rem;
    padding: 1.25rem 0;
  }

  .home-directory__description,
  .home-directory__count {
    grid-column: 2 / 3;
  }

  .home-directory__count {
    text-align: left;
  }

  .home-directory__icon {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 620px) {
  .home-directory__row {
    grid-template-columns: 1fr;
  }

  .home-directory__description,
  .home-directory__count,
  .home-directory__icon {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-directory__row,
  .home-directory__icon {
    transition: none;
  }
}
</style>
