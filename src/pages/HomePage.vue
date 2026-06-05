<script setup lang="ts">
import { computed } from 'vue'
import Footer from '@/components/Footer.vue'
import HomeDirectoryMap from '@/components/home/HomeDirectoryMap.vue'
import HomeFeaturedLedger from '@/components/home/HomeFeaturedLedger.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeNavbar from '@/components/home/HomeNavbar.vue'
import previewsIndex from '@/content/site-previews.json'
import { useSitesStore, type Site } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import type { HomeDirectoryRow, HomePreviewItem } from '@/types/home'

interface SitePreviewEntry {
  image: string
  small: string
}

const sitesStore = useSitesStore()
const skillsStore = useSkillsStore()
const previews = previewsIndex as Record<string, SitePreviewEntry>

const randomPreviewSeed = Math.random().toString(36).slice(2)

void sitesStore.loadSites()
void skillsStore.loadSkills()

function formatCount(value: number, loaded: boolean) {
  if (!loaded && value === 0) return '0'

  return Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function compareFeaturedSites(first: Site, second: Site) {
  if (first.featured !== second.featured) return first.featured ? -1 : 1
  if (first.verified !== second.verified) return first.verified ? -1 : 1
  return second.stars - first.stars
}

function getSeededPreviewScore(slug: string) {
  const input = `${randomPreviewSeed}:${slug}`
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function compareRandomizedSites(first: Site, second: Site) {
  return (
    getSeededPreviewScore(first.slug) -
      getSeededPreviewScore(second.slug) ||
    compareFeaturedSites(first, second)
  )
}

function getPreviewName(site: Site) {
  return site.name.split(/\s[|-]\s/)[0]?.trim() || site.name
}

function toPreviewItem(site: Site, index: number): HomePreviewItem | null {
  const preview = previews[site.slug]
  if (!preview) return null

  return {
    slug: site.slug,
    name: getPreviewName(site),
    category: site.subcategory || site.parentCategory,
    description: site.description,
    image: preview.image,
    small: preview.small,
    to: `/sites/${site.slug}`,
    rank: String(index + 1).padStart(2, '0'),
  }
}

const hasCatalogData = computed(
  () => sitesStore.allSites.length > 0 || skillsStore.allSkills.length > 0,
)

const isCatalogLoading = computed(
  () => (sitesStore.loading || skillsStore.loading) && !hasCatalogData.value,
)

const catalogError = computed(() => sitesStore.loadError || skillsStore.loadError)

const totalSitesLabel = computed(() =>
  formatCount(sitesStore.allSites.length, sitesStore.loaded),
)

const totalSkillsLabel = computed(() =>
  formatCount(skillsStore.allSkills.length, skillsStore.loaded),
)

const totalGroupsLabel = computed(() => {
  const groups = new Set<string>()

  sitesStore.allSites.forEach(site => groups.add(site.parentCategory))
  skillsStore.allSkills.forEach(skill => groups.add(skill.parentCategory))

  return formatCount(groups.size, sitesStore.loaded || skillsStore.loaded)
})

const previewItems = computed(() => {
  return sitesStore.allSites
    .filter(site => Boolean(previews[site.slug]?.image))
    .sort(compareRandomizedSites)
    .map(toPreviewItem)
    .filter((item): item is HomePreviewItem => Boolean(item))
})

const directoryRows = computed<HomeDirectoryRow[]>(() => [
  {
    index: '01',
    label: 'Sites',
    kicker: 'Tools and references',
    description: 'Cloud hosting, AI utilities, design sources, developer references, downloads, CLI agents, and UI libraries.',
    countLabel: totalSitesLabel.value,
    countLoading: isCatalogLoading.value,
    to: '/sites',
  },
  {
    index: '02',
    label: 'Skills',
    kicker: 'Agent workflows',
    description: 'Reusable operating instructions for development, design, research, security, deployment, and automation.',
    countLabel: totalSkillsLabel.value,
    countLoading: isCatalogLoading.value,
    to: '/skills/skills',
  },
  {
    index: '03',
    label: 'Saved',
    kicker: 'Personal shelf',
    description: 'Signed-in users can keep a focused shortlist of resources and return to them from the bookmark shelf.',
    countLabel: 'Auth',
    to: '/bookmarks',
  },
  {
    index: '04',
    label: 'Publish',
    kicker: 'Catalog intake',
    description: 'Add missing resources into the review flow so the library can keep expanding without losing structure.',
    countLabel: 'Open',
    to: '/publish',
  },
])
</script>

<template>
  <div class="home-page">
    <HomeNavbar />

    <HomeHero
      :total-sites-label="totalSitesLabel"
      :total-skills-label="totalSkillsLabel"
      :total-categories-label="totalGroupsLabel"
      :preview-items="previewItems"
      :is-loading="isCatalogLoading"
    />

    <HomeDirectoryMap :rows="directoryRows" />

    <HomeFeaturedLedger
      :items="previewItems"
      :is-loading="isCatalogLoading"
      :error="catalogError"
    />

    <Footer />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100%;
  background: #1f1f1f;
  color: #ffffff;
}

:global(html.light) .home-page {
  background: var(--mocha-bg);
}
</style>
