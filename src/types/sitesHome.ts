export type SitesHomeGroupKey = 'ai' | 'design' | 'development' | 'watch' | 'downloads'

/** Homepage tool card model derived from catalog Site entries. */
export interface SitesHomeTool {
  id: string
  name: string
  slug: string
  logo: string
  coverImage: string
  coverImageSmall: string
  description: string
  category: string
  categoryKey: string
  verified: boolean
  featured: boolean
  trending: boolean
  library?: string
  website: string
  screenshots: string[]
  features: string[]
  accentColor: string
  to: string
  parentCategory: SitesHomeGroupKey | string
  stars: number
}

export interface SitesHomeCategoryItem {
  key: SitesHomeGroupKey
  name: string
  description: string
  count: number
  countLabel: string
  accent: string
  to: string
  icon: string
}

export interface SitesHomeLibraryItem {
  id: string
  name: string
  count: number
  countLabel: string
  to: string
}
