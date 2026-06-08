<script setup lang="ts">
import { computed } from 'vue'
import SitesHomePreviewCard from '@/components/sites/home/SitesHomePreviewCard.vue'
import { useRandomPreviewTiles } from '@/composables/useRandomPreviewTiles'
import type { HomePreviewItem } from '@/types/home'

const props = defineProps<{
  previewItems: HomePreviewItem[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  imageError: [slug: string]
}>()

const previewItems = computed(() => props.previewItems)
const { markImageFailed, tiles } = useRandomPreviewTiles({
  items: previewItems,
  tileCount: 7,
  initialDelayRange: [6000, 9200],
  rotationDelayRange: [7200, 12000],
})

const heroTile = computed(() => tiles.value[0])
const supportingTiles = computed(() => tiles.value.slice(1, 7))

function handleImageError(slug: string) {
  markImageFailed(slug)
  emit('imageError', slug)
}
</script>

<template>
  <div class="sites-home-hero__preview-field">
    <SitesHomePreviewCard
      v-if="heroTile"
      class="sites-home-hero__main-preview"
      :item="heroTile.item"
      :previous-item="heroTile.previousItem"
      :animation-nonce="heroTile.animationNonce"
      variant="hero-large"
      @image-error="handleImageError"
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
        @image-error="handleImageError"
      />
      <div
        v-for="index in props.isLoading && supportingTiles.length === 0 ? 4 : 0"
        :key="`sites-home-skeleton-${index}`"
        class="sites-home-hero__preview-skeleton hg-skeleton"
        aria-hidden="true"
      ></div>
    </div>
  </div>
</template>
