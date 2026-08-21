// Domain types mirroring the generated catalog indexes. Shapes follow the
// records in src/content/*-index.json and public/content/skills-registry.json.

export interface SiteFeature {
  name: string
  description: string
  icon: string
}

export interface SimilarTool {
  slug: string
  name: string
  description: string
  stars: number
  addedDaysAgo: number
  verified: boolean
  website?: string
}

export interface Site {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  subcategory: string | null
  stars: number
  watchers: number
  addedDaysAgo: number
  license: string
  lastCommit: string
  lastRelease: string
  version: string
  contributors: number
  commitsThisYear: number
  releases: number
  platforms: string[]
  deployment: string[]
  website: string
  docs: string
  sourceCode: string
  icon: string
  verified: boolean
  featured: boolean
  tags?: string[]
  atGlance?: string
  fullDescription?: string
  coreFeatures?: SiteFeature[]
  additionalFeatures?: SiteFeature[]
  deployCompose?: string
  installCommand?: string
  similarTools?: SimilarTool[]
}

export interface Extension {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  subcategory?: string
  version: string
  addedDaysAgo: number
  license: string
  website: string
  docs: string
  sourceCode: string
  icon: string
  verified: boolean
  featured: boolean
  tags: string[]
  atGlance?: string
  fullDescription?: string
  coreFeatures?: SiteFeature[]
  additionalFeatures?: SiteFeature[]
  similarTools?: SimilarTool[]
  chromeWebStoreId?: string
  chromeWebStoreRating?: number
  userCount?: number
  permissions?: string[]
  manifestVersion?: string
  installButtonBehavior?: string
}

export interface McpTool {
  name: string
  description: string
}

export interface McpServer {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  icon: string
  verified: boolean
  featured: boolean
  tags: string[]
  website: string
  docs: string
  sourceCode: string
  installCommand: string
  transport: string
  tools: McpTool[]
  connections: string[]
}

export interface Skill {
  slug: string
  title: string
  description: string
  category: string
  parentCategory: string
  tags: string[]
  views: number
  uses: number
  author: string
  authorName: string
  repoLink: string
  skillPath: string
  branch: string
  addedBy: string
  featured: boolean
  dateAdded: string
  hasLocalContent: boolean
}

export interface Preview {
  image: string
  small: string
  sourceUrl: string
  capturedAt: string
  width: number
  height: number
  bytes?: number
  fallback?: boolean
}

export type CatalogKind = 'site' | 'extension' | 'mcp' | 'skill'

export type MatchStrength = 'Direct' | 'Close' | 'Nearest'
