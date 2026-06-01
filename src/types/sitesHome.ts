import type { HomePreviewItem } from '@/types/home'

export type SitesHomeGroupKey = 'ai' | 'design' | 'development' | 'watch' | 'downloads'

export interface SitesHomeMetric {
  label: string
  value: string
  accent: string
}

export interface SitesHomeSubroute {
  label: string
  to: string
  countLabel: string
}

export interface SitesHomeCategorySummary {
  key: SitesHomeGroupKey
  name: string
  route: string
  description: string
  countLabel: string
  accent: string
  subroutes: SitesHomeSubroute[]
  featuredNames: string[]
}

export interface SitesHomePreviewItem extends HomePreviewItem {
  parentCategory: SitesHomeGroupKey | string
}
