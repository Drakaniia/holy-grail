<script setup lang="ts">
import type { HomePreviewItem } from '@/types/home'

const props = withDefaults(
  defineProps<{
    item: HomePreviewItem
    previousItem?: HomePreviewItem | null
    animationNonce?: number
    variant?: 'hero-large' | 'hero-small' | 'showcase'
  }>(),
  {
    previousItem: null,
    animationNonce: 0,
    variant: 'showcase',
  },
)

const emit = defineEmits<{
  imageError: [slug: string]
}>()
</script>

<template>
  <RouterLink
    :to="props.item.to"
    class="sites-home-preview-card"
    :class="`sites-home-preview-card--${props.variant}`"
    :aria-label="`Open ${props.item.name}`"
  >
    <span class="sites-home-preview-card__media">
      <picture
        v-if="props.previousItem"
        class="sites-home-preview-card__image sites-home-preview-card__image--previous"
        aria-hidden="true"
      >
        <source :srcset="props.previousItem.small" media="(max-width: 720px)" />
        <img
          :src="props.previousItem.image"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>

      <picture
        :key="`${props.item.slug}-${props.animationNonce}`"
        class="sites-home-preview-card__image sites-home-preview-card__image--current"
        :class="{ 'sites-home-preview-card__image--incoming': props.previousItem }"
      >
        <source :srcset="props.item.small" media="(max-width: 720px)" />
        <img
          :src="props.item.image"
          :alt="`${props.item.name} preview`"
          loading="lazy"
          decoding="async"
          @error="emit('imageError', props.item.slug)"
        />
      </picture>
    </span>

    <span class="sites-home-preview-card__shade"></span>

    <span class="sites-home-preview-card__content">
      <span class="sites-home-preview-card__kicker">
        <span>{{ props.item.rank }}</span>
        <span>{{ props.item.category }}</span>
      </span>
      <strong class="sites-home-preview-card__title">{{ props.item.name }}</strong>
      <span
        v-if="props.variant === 'showcase'"
        class="sites-home-preview-card__description"
      >
        {{ props.item.description }}
      </span>
    </span>
  </RouterLink>
</template>

<style scoped>
.sites-home-preview-card {
  position: relative;
  display: block;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.5rem;
  background: #1f1f1f;
  color: #ffffff;
  isolation: isolate;
  transition:
    border-color 170ms ease,
    transform 170ms ease;
}

.sites-home-preview-card:hover,
.sites-home-preview-card:focus-visible {
  border-color: rgba(255, 140, 26, 0.86);
  transform: translateY(-2px);
}

.sites-home-preview-card:focus-visible {
  outline: 2px solid #ff8c1a;
  outline-offset: 3px;
}

.sites-home-preview-card--hero-large {
  aspect-ratio: 16 / 11;
  min-height: 20rem;
}

.sites-home-preview-card--hero-small {
  aspect-ratio: 16 / 11;
  min-height: 9rem;
}

.sites-home-preview-card--showcase {
  aspect-ratio: 16 / 12;
  min-height: 17rem;
}

.sites-home-preview-card__media,
.sites-home-preview-card__image,
.sites-home-preview-card__shade {
  position: absolute;
  inset: 0;
  display: block;
}

.sites-home-preview-card__media {
  z-index: 0;
  overflow: hidden;
}

.sites-home-preview-card__image {
  overflow: hidden;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}

.sites-home-preview-card__image--previous {
  z-index: 1;
  animation: sites-home-preview-slide-away 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sites-home-preview-card__image--current {
  z-index: 2;
}

.sites-home-preview-card__image--incoming {
  animation: sites-home-preview-slide-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform;
}

.sites-home-preview-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.8) contrast(1.04);
  transition:
    filter 170ms ease,
    transform 170ms ease;
}

.sites-home-preview-card:hover .sites-home-preview-card__image img,
.sites-home-preview-card:focus-visible .sites-home-preview-card__image img {
  filter: saturate(1.02) contrast(1.1);
  transform: scale(1.025);
}

.sites-home-preview-card__shade {
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.86) 100%),
    linear-gradient(120deg, rgba(0, 0, 0, 0.7), transparent 58%);
}

.sites-home-preview-card__content {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 3;
  display: grid;
  gap: 0.42rem;
  padding: 1rem;
}

.sites-home-preview-card__kicker {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sites-home-preview-card__kicker span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sites-home-preview-card__title {
  min-width: 0;
  overflow: hidden;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sites-home-preview-card--hero-large .sites-home-preview-card__title {
  font-size: 1.35rem;
}

.sites-home-preview-card__description {
  display: -webkit-box;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

:global(html.light .sites-home-preview-card) {
  border-color: var(--mocha-border);
  background: var(--mocha-surface);
  color: var(--mocha-text);
}

:global(html.light .sites-home-preview-card__shade) {
  background:
    linear-gradient(180deg, rgba(45, 33, 25, 0.02) 0%, rgba(45, 33, 25, 0.84) 100%),
    linear-gradient(120deg, rgba(45, 33, 25, 0.54), transparent 58%);
}

@keyframes sites-home-preview-slide-in {
  from {
    transform: translate3d(104%, 0, 0);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes sites-home-preview-slide-away {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-14%, 0, 0);
  }
}

@media (max-width: 900px) {
  .sites-home-preview-card--hero-large {
    min-height: 17rem;
  }
}

@media (max-width: 640px) {
  .sites-home-preview-card--hero-large,
  .sites-home-preview-card--hero-small,
  .sites-home-preview-card--showcase {
    min-height: 13.5rem;
  }

  .sites-home-preview-card__content {
    padding: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sites-home-preview-card,
  .sites-home-preview-card__image,
  .sites-home-preview-card__image img {
    animation: none;
    transition: none;
  }
}
</style>
