export interface HomePreviewItem {
  slug: string
  name: string
  category: string
  description: string
  image: string
  small: string
  to: string
  rank: string
}

export interface HomeDirectoryRow {
  index: string
  label: string
  kicker: string
  description: string
  countLabel: string
  countLoading?: boolean
  to: string
}
