<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Code2, Download, Layers, Palette, Play, Sparkles } from 'lucide-vue-next'
import { siFigma, siFramer, siGithub, siReact, siTailwindcss, siVercel } from 'simple-icons'
import SitesHomeSectionHeader from '@/components/sites/home/SitesHomeSectionHeader.vue'
import type { SitesHomeCategoryItem, SitesHomeLibraryItem } from '@/types/sitesHome'

const props = defineProps<{
  categories: SitesHomeCategoryItem[]
  libraries: SitesHomeLibraryItem[]
  isLoading: boolean
}>()

const categoryIcons: Record<string, Component> = {
  sparkles: Sparkles,
  palette: Palette,
  code: Code2,
  play: Play,
  download: Download,
}

const brandIcons: Record<string, { path: string; hex: string }> = {
  react: siReact,
  tailwind: siTailwindcss,
  github: siGithub,
  vercel: siVercel,
  figma: siFigma,
  framer: siFramer,
}

function brandFor(name: string) {
  const brand = brandIcons[name.trim().toLowerCase()]
  if (!brand) return null
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(brand.hex.slice(i, i + 2), 16))
  return { path: brand.path, ink: r < 0x40 && g < 0x40 && b < 0x40 ? '#f5f5f5' : `#${brand.hex}` }
}

const libraryBrands = computed(
  () => new Map(props.libraries.map((library) => [library.id, brandFor(library.name)])),
)
</script>

<template>
  <div class="discovery">
    <section class="discovery__panel" aria-labelledby="explore-categories-title">
      <SitesHomeSectionHeader title="Explore Categories" title-id="explore-categories-title">
        <template #icon>
          <Layers aria-hidden="true" />
        </template>
      </SitesHomeSectionHeader>

      <div
        v-if="isLoading && categories.every((c) => c.count === 0)"
        class="discovery__grid"
        aria-hidden="true"
      >
        <div v-for="n in 6" :key="n" class="discovery__item discovery__item--skeleton">
          <span class="discovery__sk-icon hg-skeleton"></span>
          <span class="discovery__sk-lines">
            <span class="discovery__sk-line hg-skeleton"></span>
            <span class="discovery__sk-line discovery__sk-line--short hg-skeleton"></span>
          </span>
        </div>
      </div>

      <div v-else class="discovery__grid">
        <RouterLink
          v-for="category in categories"
          :key="category.key"
          :to="category.to"
          class="discovery__item"
          :style="{ '--accent': category.accent }"
        >
          <span class="discovery__icon" aria-hidden="true">
            <component :is="categoryIcons[category.icon] || Layers" class="h-4 w-4" />
          </span>
          <span class="discovery__copy">
            <strong>{{ category.name }}</strong>
            <span>{{ category.countLabel }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <section class="discovery__panel" aria-labelledby="popular-libraries-title">
      <SitesHomeSectionHeader title="Popular Libraries" title-id="popular-libraries-title" />

      <div v-if="isLoading && libraries.length === 0" class="discovery__grid" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="discovery__item discovery__item--skeleton">
          <span class="discovery__sk-icon hg-skeleton"></span>
          <span class="discovery__sk-lines">
            <span class="discovery__sk-line hg-skeleton"></span>
            <span class="discovery__sk-line discovery__sk-line--short hg-skeleton"></span>
          </span>
        </div>
      </div>

      <div v-else class="discovery__grid">
        <RouterLink
          v-for="library in libraries"
          :key="library.id"
          :to="library.to"
          class="discovery__item discovery__item--library"
        >
          <span class="discovery__icon discovery__icon--muted" aria-hidden="true">
            <svg
              v-if="libraryBrands.get(library.id)"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              :fill="libraryBrands.get(library.id)?.ink"
            >
              <path :d="libraryBrands.get(library.id)?.path" />
            </svg>
            <template v-else>{{ library.name.charAt(0) }}</template>
          </span>
          <span class="discovery__copy">
            <strong>{{ library.name }}</strong>
            <span>{{ library.countLabel }}</span>
          </span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.discovery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  width: 100%;
}

.discovery__panel {
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 20px;
  background: var(--sh-surface, #121212);
  padding: 1.15rem 1.15rem 1.25rem;
  transition:
    background-color 200ms ease,
    border-color 200ms ease;
}

.discovery__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.discovery__item {
  --accent: var(--sh-accent, #ff8c1a);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  padding: 0.75rem;
  color: inherit;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.discovery__item:hover,
.discovery__item:focus-visible {
  border-color: var(--sh-border, transparent);
  background: var(--sh-item-hover, #1b1b1b);
  outline: none;
}

.discovery__item:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}

.discovery__icon {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 16%, var(--sh-surface-deep, #0d0d0d));
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 700;
}

.discovery__icon--muted {
  border: 1px solid var(--sh-border-soft, rgba(255, 255, 255, 0.08));
  background: var(--sh-surface-deep, #0d0d0d);
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.75));
}

.discovery__copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.discovery__copy strong {
  overflow: hidden;
  color: var(--sh-text-strong, #f5f5f5);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discovery__copy span {
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  font-size: 0.8rem;
}

.discovery__item--skeleton {
  pointer-events: none;
}

.discovery__sk-icon {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.discovery__sk-lines {
  display: grid;
  gap: 0.35rem;
  flex: 1;
}

.discovery__sk-line {
  display: block;
  height: 0.7rem;
  width: 72%;
  border-radius: 9999px;
}

.discovery__sk-line--short {
  width: 46%;
}

@media (max-width: 1100px) {
  .discovery {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .discovery__grid {
    grid-template-columns: 1fr;
  }
}
</style>
