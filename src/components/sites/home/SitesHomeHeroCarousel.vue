<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useCarouselProgress } from '@/composables/useCarouselProgress'
import type { SitesHomeTool } from '@/types/sitesHome'

const props = defineProps<{
  tools: SitesHomeTool[]
  isLoading: boolean
}>()

const logoFailed = shallowRef(false)
const imageFailed = shallowRef(false)
const dragStartX = shallowRef<number | null>(null)

const slideCount = computed(() => props.tools.length)
const { activeIndex, progress, direction, goTo, next, prev, pause, resume, canNavigate } =
  useCarouselProgress({ slideCount })

const activeTool = computed(() => props.tools[activeIndex.value] ?? null)

const featureCards = computed(() => {
  const features = activeTool.value?.features ?? []
  if (features.length >= 4) return features.slice(0, 4)
  if (!activeTool.value) return []

  const fillers = [activeTool.value.category, 'Catalog', 'Web', 'Directory']
  return [...features, ...fillers].slice(0, 4)
})

watch(activeTool, () => {
  logoFailed.value = false
  imageFailed.value = false
})

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  dragStartX.value = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (dragStartX.value === null) return
  const delta = event.clientX - dragStartX.value
  dragStartX.value = null

  if (Math.abs(delta) < 48) return
  if (delta < 0) next()
  else prev()
}

function onPointerCancel() {
  dragStartX.value = null
}
</script>

<template>
  <section
    class="hero-carousel"
    tabindex="0"
    aria-roledescription="carousel"
    aria-label="Featured tools"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
    @keydown.left.prevent="prev"
    @keydown.right.prevent="next"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div v-if="isLoading && tools.length === 0" class="hero-carousel__shell hero-carousel__shell--skeleton">
      <div class="hero-carousel__col hero-carousel__col--left">
        <span class="hero-carousel__sk hero-carousel__sk--logo hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--title hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--body hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--chip hg-skeleton"></span>
      </div>
      <div class="hero-carousel__col hero-carousel__col--mid">
        <span class="hero-carousel__sk hero-carousel__sk--shot hg-skeleton"></span>
      </div>
      <div class="hero-carousel__col hero-carousel__col--right">
        <span v-for="n in 4" :key="n" class="hero-carousel__sk hero-carousel__sk--feature hg-skeleton"></span>
      </div>
    </div>

    <div
      v-else-if="activeTool"
      class="hero-carousel__shell"
      :style="{ '--accent': activeTool.accentColor }"
    >
      <Transition :name="direction >= 0 ? 'hero-slide-next' : 'hero-slide-prev'" mode="out-in">
        <div :key="activeTool.id" class="hero-carousel__slide">
          <div class="hero-carousel__col hero-carousel__col--left">
            <div class="hero-carousel__logo-wrap">
              <img
                v-if="activeTool.logo && !logoFailed"
                :src="activeTool.logo"
                :alt="`${activeTool.name} logo`"
                class="hero-carousel__logo"
                width="56"
                height="56"
                @error="logoFailed = true"
              />
              <span v-else class="hero-carousel__logo-fallback">{{ activeTool.name.charAt(0) }}</span>
            </div>

            <div class="hero-carousel__name-row">
              <h1 class="hero-carousel__name">{{ activeTool.name }}</h1>
              <BadgeCheck
                v-if="activeTool.verified"
                class="hero-carousel__verified"
                aria-label="Verified"
              />
            </div>

            <p class="hero-carousel__description">{{ activeTool.description }}</p>
            <span class="hero-carousel__category">{{ activeTool.category }}</span>

            <RouterLink :to="activeTool.to" class="hero-carousel__cta">
              View tool
            </RouterLink>
          </div>

          <div class="hero-carousel__col hero-carousel__col--mid">
            <RouterLink :to="activeTool.to" class="hero-carousel__preview" :aria-label="`Open ${activeTool.name}`">
              <img
                v-if="!imageFailed"
                :src="activeTool.coverImage"
                :srcset="`${activeTool.coverImageSmall} 720w, ${activeTool.coverImage} 1440w`"
                sizes="(max-width: 900px) 90vw, 30vw"
                :alt="`${activeTool.name} screenshot`"
                class="hero-carousel__preview-image"
                @error="imageFailed = true"
              />
              <span v-else class="hero-carousel__preview-fallback">{{ activeTool.name }}</span>
            </RouterLink>
          </div>

          <div class="hero-carousel__col hero-carousel__col--right" aria-label="Highlights">
            <div
              v-for="(feature, index) in featureCards"
              :key="`${activeTool.id}-${feature}-${index}`"
              class="hero-carousel__feature"
            >
              <span class="hero-carousel__feature-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="hero-carousel__feature-label">{{ feature }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <div v-if="canNavigate" class="hero-carousel__controls" aria-label="Carousel controls">
        <button type="button" class="hero-carousel__nav" aria-label="Previous slide" @click="prev">
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" class="hero-carousel__nav" aria-label="Next slide" @click="next">
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-else class="hero-carousel__empty">
      <p>No featured previews are available yet.</p>
    </div>

    <div
      v-if="tools.length > 1"
      class="hero-carousel__indicators"
      role="tablist"
      aria-label="Slide indicators"
    >
      <button
        v-for="(tool, index) in tools"
        :key="tool.id"
        type="button"
        role="tab"
        class="hero-carousel__indicator"
        :class="{ 'hero-carousel__indicator--active': index === activeIndex }"
        :aria-selected="index === activeIndex"
        :aria-label="`Show ${tool.name}`"
        @click="goTo(index, index > activeIndex ? 1 : -1)"
      >
        <span
          v-if="index === activeIndex"
          class="hero-carousel__indicator-fill"
          :style="{ transform: `scaleX(${progress})` }"
        ></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero-carousel {
  --accent: var(--sh-accent, #ff8c1a);
  display: grid;
  gap: 1rem;
  width: 100%;
  outline: none;
}

.hero-carousel:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, var(--sh-chip-mix-base, #fff));
  outline-offset: 4px;
  border-radius: 8px;
}

.hero-carousel__shell {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 24px;
  background:
    radial-gradient(
      ellipse 80% 70% at 12% 20%,
      color-mix(in srgb, var(--accent) 22%, transparent),
      transparent 58%
    ),
    radial-gradient(
      ellipse 50% 50% at 88% 80%,
      color-mix(in srgb, var(--accent) 10%, transparent),
      transparent 55%
    ),
    var(--sh-surface, #121212);
  box-shadow: var(--sh-shadow-hero, 0 20px 50px rgba(0, 0, 0, 0.28));
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.hero-carousel__shell--skeleton {
  display: grid;
  grid-template-columns: 1.15fr 0.95fr 0.9fr;
  gap: 1.25rem;
  padding: clamp(1.25rem, 2.5vw, 2rem);
}

.hero-carousel__slide {
  display: grid;
  grid-template-columns: 1.15fr 0.95fr 0.9fr;
  gap: 1.25rem;
  min-height: 520px;
  padding: clamp(1.25rem, 2.5vw, 2rem);
}

.hero-carousel__col {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.hero-carousel__col--left {
  justify-content: center;
  gap: 1rem;
}

.hero-carousel__col--mid {
  align-items: center;
  justify-content: center;
}

.hero-carousel__col--right {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-content: center;
}

.hero-carousel__logo-wrap {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  overflow: hidden;
  border: 1px solid var(--sh-border-strong, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  background: var(--sh-logo-bg, rgba(0, 0, 0, 0.35));
}

.hero-carousel__logo {
  width: 2.35rem;
  height: 2.35rem;
  object-fit: contain;
}

.hero-carousel__logo-fallback {
  color: var(--sh-text, #fff);
  font-size: 1.4rem;
  font-weight: 700;
}

.hero-carousel__name-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.hero-carousel__name {
  margin: 0;
  color: var(--sh-text, #fff);
  font-size: clamp(2rem, 3.4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.hero-carousel__verified {
  width: 1.35rem;
  height: 1.35rem;
  flex-shrink: 0;
  color: var(--sh-verified, #4ade80);
}

.hero-carousel__description {
  max-width: 28rem;
  margin: 0;
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.72));
  font-size: 1rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-carousel__category {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--sh-border-soft, rgba(255, 255, 255, 0.08)));
  border-radius: 9999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  padding: 0.35rem 0.75rem;
  color: color-mix(in srgb, var(--accent) 55%, var(--sh-chip-mix-base, #fff));
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-carousel__cta {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  margin-top: 0.35rem;
  border-radius: 9999px;
  background: var(--sh-cta-bg, #fff);
  padding: 0.7rem 1.15rem;
  color: var(--sh-cta-fg, #0a0a0a);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.hero-carousel__cta:hover {
  background: var(--sh-cta-bg-hover, #f3f3f3);
  transform: translateY(-1px);
}

.hero-carousel__preview {
  display: block;
  width: 100%;
  max-width: 22rem;
  overflow: hidden;
  border: 1px solid var(--sh-border-strong, rgba(255, 255, 255, 0.1));
  border-radius: 18px;
  background: var(--sh-surface-deep, #0a0a0a);
  box-shadow: var(--sh-shadow-preview, 0 24px 48px rgba(0, 0, 0, 0.4));
  aspect-ratio: 10 / 13;
  transition: transform 220ms ease;
}

.hero-carousel__preview:hover {
  transform: translateY(-3px) scale(1.01);
}

.hero-carousel__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.hero-carousel__preview-fallback {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 16rem;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.5));
  font-weight: 600;
}

.hero-carousel__feature {
  display: grid;
  gap: 0.45rem;
  min-height: 5.5rem;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 16px;
  background: var(--sh-feature-bg, rgba(255, 255, 255, 0.03));
  padding: 0.9rem;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.hero-carousel__feature:hover {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.12));
  background: var(--sh-feature-bg-hover, rgba(255, 255, 255, 0.06));
}

.hero-carousel__feature-index {
  color: var(--sh-text-faint, rgba(255, 255, 255, 0.35));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-carousel__feature-label {
  color: var(--sh-text-strong, #f2f2f2);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.hero-carousel__controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 3;
  display: inline-flex;
  gap: 0.4rem;
}

.hero-carousel__nav {
  display: inline-flex;
  width: 2.35rem;
  height: 2.35rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sh-border-strong, rgba(255, 255, 255, 0.1));
  border-radius: 9999px;
  background: var(--sh-control-bg, rgba(0, 0, 0, 0.45));
  color: var(--sh-control-fg, #fff);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.hero-carousel__nav:hover {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.22));
  background: var(--sh-control-bg-hover, rgba(0, 0, 0, 0.7));
}

.hero-carousel__indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding-top: 0.25rem;
}

.hero-carousel__indicator {
  position: relative;
  width: 0.5rem;
  height: 0.5rem;
  overflow: hidden;
  border: 0;
  border-radius: 9999px;
  background: var(--sh-indicator, rgba(255, 255, 255, 0.22));
  cursor: pointer;
  padding: 0;
  transition:
    width 220ms ease,
    background-color 220ms ease;
}

.hero-carousel__indicator--active {
  width: 2.75rem;
  background: var(--sh-indicator-track, rgba(255, 255, 255, 0.14));
}

.hero-carousel__indicator-fill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  border-radius: inherit;
  background: var(--sh-indicator-fill, #fff);
  will-change: transform;
}

.hero-carousel__empty {
  display: grid;
  place-items: center;
  min-height: 280px;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.06));
  border-radius: 24px;
  background: var(--sh-surface, #121212);
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
}

.hero-carousel__sk {
  display: block;
  border-radius: 12px;
}

.hero-carousel__sk--logo {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 16px;
}

.hero-carousel__sk--title {
  width: min(16rem, 80%);
  height: 2.4rem;
}

.hero-carousel__sk--body {
  width: min(22rem, 95%);
  height: 4rem;
}

.hero-carousel__sk--chip {
  width: 7rem;
  height: 1.8rem;
  border-radius: 9999px;
}

.hero-carousel__sk--shot {
  width: 100%;
  max-width: 22rem;
  height: 18rem;
  margin-inline: auto;
  border-radius: 18px;
}

.hero-carousel__sk--feature {
  height: 5.5rem;
  border-radius: 16px;
}

.hero-slide-next-enter-active,
.hero-slide-next-leave-active,
.hero-slide-prev-enter-active,
.hero-slide-prev-leave-active {
  transition:
    opacity 500ms ease,
    transform 500ms ease;
}

.hero-slide-next-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.hero-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.hero-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.hero-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

@media (max-width: 1100px) {
  .hero-carousel__slide,
  .hero-carousel__shell--skeleton {
    grid-template-columns: 1fr 1fr;
    min-height: auto;
  }

  .hero-carousel__col--right {
    grid-column: 1 / -1;
  }

  .hero-carousel__shell {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .hero-carousel__slide,
  .hero-carousel__shell--skeleton {
    grid-template-columns: 1fr;
  }

  .hero-carousel__col--right {
    display: flex;
    grid-template-columns: none;
    gap: 0.65rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scroll-snap-type: x mandatory;
  }

  .hero-carousel__feature {
    min-width: 9.5rem;
    scroll-snap-align: start;
  }

  .hero-carousel__preview {
    max-width: none;
    aspect-ratio: 16 / 10;
  }

  .hero-carousel__name {
    font-size: 1.85rem;
  }

  .hero-carousel__controls {
    top: auto;
    bottom: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-slide-next-enter-active,
  .hero-slide-next-leave-active,
  .hero-slide-prev-enter-active,
  .hero-slide-prev-leave-active,
  .hero-carousel__cta,
  .hero-carousel__preview,
  .hero-carousel__indicator {
    transition: none;
  }
}
</style>
