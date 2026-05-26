import type { BookmarkResourceType } from '@/stores/bookmarks'

export type ProfileTabKey = 'sites' | 'bookmarks' | 'skills'

export interface ProfileTab {
  caption: string
  count: number
  key: ProfileTabKey
  label: string
}

export interface ProfileBookmarkItem {
  category: string
  description: string
  externalUrl: string | null
  id: string
  route: string
  title: string
  type: BookmarkResourceType
}
