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
    <div
      v-if="isLoading && tools.length === 0"
      class="hero-carousel__shell hero-carousel__shell--skeleton"
    >
      <div class="hero-carousel__col hero-carousel__col--left">
        <span class="hero-carousel__sk hero-carousel__sk--logo hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--title hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--body hg-skeleton"></span>
        <span class="hero-carousel__sk hero-carousel__sk--chip hg-skeleton"></span>
      </div>
      <div class="hero-carousel__col hero-carousel__col--right">
        <span
          v-for="n in 4"
          :key="n"
          class="hero-carousel__sk hero-carousel__sk--feature hg-skeleton"
        ></span>
      </div>
    </div>

    <div
      v-else-if="activeTool"
      class="hero-carousel__shell"
      :style="{ '--accent': activeTool.accentColor }"
    >
      <Transition :name="direction >= 0 ? 'hero-slide-next' : 'hero-slide-prev'" mode="out-in">
        <div :key="activeTool.id" class="hero-carousel__slide">
          <div class="hero-carousel__backdrop" aria-hidden="true">
            <img
              v-if="!imageFailed"
              :src="activeTool.coverImage"
              alt=""
              class="hero-carousel__backdrop-image"
              @error="imageFailed = true"
            />
          </div>

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
              <span v-else class="hero-carousel__logo-fallback">{{
                activeTool.name.charAt(0)
              }}</span>
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

            <RouterLink :to="activeTool.to" class="hero-carousel__cta"> View tool </RouterLink>
          </div>

          <div class="hero-carousel__col hero-carousel__col--right" aria-label="Highlights">
            <div
              v-for="(feature, index) in featureCards"
              :key="`${activeTool.id}-${feature}-${index}`"
              class="hero-carousel__feature"
            >
              <span class="hero-carousel__feature-index">{{
                String(index + 1).padStart(2, '0')
              }}</span>
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
  gap: 1.5rem;
  width: 100%;
  outline: none;
}

.hero-carousel:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, var(--sh-chip-mix-base, #fff));
  outline-offset: 4px;
  border-radius: 8px;
}

/*
  The page has exactly one atmosphere and it lives here: a single low-opacity
  accent wash behind the hero. No panel fill, radius, or shadow, so the
  screenshot and the type carry the section instead of its container.
*/
.hero-carousel__shell {
  position: relative;
  min-height: 520px;
  padding-block: 0.5rem;
}

.hero-carousel__shell::before {
  content: '';
  position: absolute;
  top: -3rem;
  left: -3rem;
  width: min(40rem, 100%);
  height: 26rem;
  border-radius: 50%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--accent) 15%, transparent),
    transparent 74%
  );
  pointer-events: none;
}

.hero-carousel__shell--skeleton {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 0.85fr;
  gap: 1.25rem;
  padding: clamp(1.25rem, 2.5vw, 2rem);
}

.hero-carousel__shell--skeleton .hero-carousel__col--right {
  gap: 0.75rem;
}

/*
  Two content columns with a deliberately empty middle track: the screenshot
  lives there as the hero's backdrop, so the centre of the section is image
  and the copy reads on top of the page, not on top of a card.
*/
.hero-carousel__slide {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 0.85fr;
  gap: 1.25rem;
  min-height: 520px;
  padding: 0.5rem 0.75rem;
}

/*
  The page screenshot is atmosphere, not a framed figure: it fills the hero,
  keeps its full aspect (object-fit: contain, so nothing is cropped), and
  dissolves into the page on both sides through a horizontal mask.
*/
.hero-carousel__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Absolute fill so the image is bounded by the hero, never by its own ratio. */
.hero-carousel__backdrop-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: var(--sh-backdrop-opacity, 0.9);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 36%, #000 64%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 36%, #000 64%, transparent 100%);
}

/* Type reads over the fade, so a page-colour wash keeps it ahead of the image. */
.hero-carousel__backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--sh-bg, #1a1a1a) var(--sh-backdrop-scrim, 40%), transparent);
}

.hero-carousel__col {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.hero-carousel__col--left {
  grid-column: 1;
  z-index: 1;
  justify-content: center;
  gap: 1rem;
}

.hero-carousel__col--right {
  grid-column: 3;
  z-index: 1;
  justify-content: center;
  gap: 0;
}

.hero-carousel__logo-wrap {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  overflow: hidden;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  background: transparent;
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
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  font-size: 0.85rem;
}

.hero-carousel__cta {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  margin-top: 0.5rem;
  border-radius: 8px;
  background: var(--sh-cta-bg, #fff);
  padding: 0.62rem 1rem;
  color: var(--sh-cta-fg, #0a0a0a);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 140ms var(--ease-out-quint, ease-out),
    background-color 160ms ease,
    color 160ms ease;
}

.hero-carousel__cta:hover {
  background: var(--sh-cta-bg-hover, #f3f3f3);
}

.hero-carousel__cta:active {
  transform: scale(0.98);
}

.hero-carousel__feature {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  border-top: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  padding: 0.8rem 0;
}

.hero-carousel__feature:first-child {
  border-top: 0;
}

.hero-carousel__feature-index {
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.7));
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.hero-carousel__feature-label {
  color: var(--sh-text-strong, #f0f0f0);
  font-size: 0.92rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.4;
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
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  background: transparent;
  color: var(--sh-text-soft, rgba(255, 255, 255, 0.7));
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.hero-carousel__nav:hover {
  border-color: var(--sh-border-strong, rgba(255, 255, 255, 0.18));
  background: var(--sh-item-hover, #2a2a2a);
  color: var(--sh-text-strong, #f5f5f5);
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
  border-block: 1px solid var(--sh-border, rgba(255, 255, 255, 0.08));
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
}

.hero-carousel__sk {
  display: block;
  border-radius: 12px;
}

.hero-carousel__sk--logo {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 10px;
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

.hero-carousel__sk--feature {
  height: 3.1rem;
  border-radius: 6px;
}

.hero-slide-next-enter-active,
.hero-slide-next-leave-active,
.hero-slide-prev-enter-active,
.hero-slide-prev-leave-active {
  transition:
    opacity 260ms var(--ease-out-quint, ease-out),
    transform 260ms var(--ease-out-quint, ease-out);
}

.hero-slide-next-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.hero-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.hero-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.hero-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (max-width: 1100px) {
  .hero-carousel__slide,
  .hero-carousel__shell--skeleton {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-carousel__col--left,
  .hero-carousel__col--right {
    grid-column: 1;
  }

  /* Below this width the copy sits directly over the image, so it dims behind
     a stronger wash instead of competing with the type. */
  .hero-carousel__slide {
    --sh-backdrop-scrim: 60%;

    gap: 2.5rem;
  }

  .hero-carousel__backdrop-image {
    opacity: calc(var(--sh-backdrop-opacity, 0.9) * 0.6);
  }

  .hero-carousel__shell {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .hero-carousel__col--right {
    gap: 0;
  }

  .hero-carousel__shell::before {
    top: -2rem;
    right: -1.5rem;
    left: -1.5rem;
    width: auto;
    height: 20rem;
  }

  .hero-carousel__slide {
    --sh-backdrop-scrim: 65%;

    padding-inline: 0;
  }

  .hero-carousel__backdrop-image {
    opacity: calc(var(--sh-backdrop-opacity, 0.9) * 0.45);
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
  /* Cross-fade instead of sliding: keep the opacity swap, drop the 18px travel. */
  .hero-slide-next-enter-active,
  .hero-slide-next-leave-active,
  .hero-slide-prev-enter-active,
  .hero-slide-prev-leave-active {
    transition: opacity 200ms ease;
  }

  .hero-slide-next-enter-from,
  .hero-slide-next-leave-to,
  .hero-slide-prev-enter-from,
  .hero-slide-prev-leave-to {
    transform: none;
  }

  .hero-carousel__cta,
  .hero-carousel__indicator {
    transition: none;
  }
}
</style>
