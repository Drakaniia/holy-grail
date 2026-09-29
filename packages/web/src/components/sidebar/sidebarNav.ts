import type { Component } from 'vue'
import {
  Activity,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  BrainCircuit,
  Code2,
  Component as ComponentIcon,
  Disc3,
  Download,
  FileText,
  Film,
  Gamepad2,
  GraduationCap,
  Github,
  Hammer,
  HardDriveDownload,
  House,
  Image,
  Layers,
  Lightbulb,
  MessageSquare,
  Microscope,
  Package,
  Palette,
  Plug,
  Presentation,
  Puzzle,
  ScanSearch,
  Server,
  Shapes,
  ShieldCheck,
  Sparkles,
  Terminal,
  Type,
  UserRound,
  Video,
  Workflow,
  Wrench,
} from 'lucide-vue-next'

export type SiteGroup = 'ai' | 'design' | 'development' | 'watch' | 'downloads'

export interface SidebarNavItem {
  name: string
  icon: Component
  route: string
}

export interface SidebarNavGroup {
  name: string
  icon: Component
  route: string
  group: SiteGroup
  items: SidebarNavItem[]
}

export const watchSubcategories: SidebarNavItem[] = [
  { name: 'Movies', icon: Video, route: '/sites/watch/movies' },
  { name: 'Anime', icon: Sparkles, route: '/sites/watch/anime' },
]

export const downloadsSubcategories: SidebarNavItem[] = [
  { name: 'Game Download', icon: Gamepad2, route: '/sites/downloads/game-download' },
  { name: 'VFX Download', icon: Video, route: '/sites/downloads/vfx-download' },
  {
    name: 'Software Download',
    icon: HardDriveDownload,
    route: '/sites/downloads/software-download',
  },
  { name: 'Torrents', icon: Disc3, route: '/sites/downloads/torrents' },
  { name: 'Movies', icon: Film, route: '/sites/downloads/movies' },
]

export const aiSubcategories: SidebarNavItem[] = [
  { name: 'Image', icon: Image, route: '/sites/ai/image' },
  { name: 'API', icon: Plug, route: '/sites/ai/api' },
  { name: 'Detector', icon: ScanSearch, route: '/sites/ai/detector' },
  { name: 'Automation', icon: Workflow, route: '/sites/ai/automation' },
  { name: 'Agent Skills', icon: Bot, route: '/sites/ai/agent-skills' },
  { name: 'Video', icon: Video, route: '/sites/ai/video' },
  { name: 'Machine Learning', icon: BrainCircuit, route: '/sites/ai/ml' },
  { name: 'CHAT', icon: MessageSquare, route: '/sites/ai/chat' },
  { name: 'Website Development', icon: Hammer, route: '/sites/ai/wb' },
  { name: 'Research', icon: Microscope, route: '/sites/ai/research' },
  { name: 'PPT', icon: Presentation, route: '/sites/ai/ppt' },
  { name: 'Others', icon: Package, route: '/sites/ai/others' },
]

export const designSubcategories: SidebarNavItem[] = [
  { name: 'Inspiration', icon: Lightbulb, route: '/sites/design/inspiration' },
  { name: 'Fonts', icon: Type, route: '/sites/design/fonts' },
  { name: '3D', icon: Box, route: '/sites/design/3d' },
  { name: 'Prompts', icon: FileText, route: '/sites/design/prompts' },
  { name: 'ICONS/SVG', icon: Shapes, route: '/sites/design/icons-svg' },
  { name: 'MD', icon: BookOpen, route: '/sites/design/md' },
  { name: 'Design Tools', icon: Wrench, route: '/sites/design/design-tools' },
]

export const developmentSubcategories: SidebarNavItem[] = [
  { name: 'Cloud & Hosting', icon: Server, route: '/sites/development/cloud-hosting' },
  { name: 'Learning', icon: GraduationCap, route: '/sites/development/learning' },
  { name: 'References', icon: BookOpen, route: '/sites/development/references' },
  { name: 'Tooling', icon: Wrench, route: '/sites/development/tooling' },
  { name: 'CLI Tools', icon: Terminal, route: '/sites/development/cli-tools' },
  { name: 'UI Libraries', icon: ComponentIcon, route: '/sites/development/ui-libraries' },
  { name: 'Repositories', icon: Github, route: '/sites/development/repositories' },
  { name: 'MCP', icon: Plug, route: '/sites/development/mcp' },
  { name: 'Monitoring', icon: Activity, route: '/sites/development/monitoring' },
]

export const skillsNav: SidebarNavItem[] = [
  { name: 'Skills', icon: Sparkles, route: '/skills/skills' },
  { name: 'Design', icon: Palette, route: '/skills/design' },
]

export const extensionCategories: SidebarNavItem[] = [
  { name: 'Writing', icon: FileText, route: '/extensions/writing' },
  { name: 'Productivity', icon: Workflow, route: '/extensions/productivity' },
  { name: 'Developer Tools', icon: Code2, route: '/extensions/developer-tools' },
  { name: 'Privacy', icon: ShieldCheck, route: '/extensions/privacy' },
  { name: 'Design', icon: Palette, route: '/extensions/design' },
]

export const mcpCategories: SidebarNavItem[] = [
  { name: 'Development', icon: Code2, route: '/mcp/development' },
  { name: 'Database', icon: Server, route: '/mcp/database' },
  { name: 'AI', icon: Bot, route: '/mcp/ai' },
  { name: 'Cloud', icon: Wrench, route: '/mcp/cloud' },
]

export const siteSubcategoryGroups: { parentCategory: SiteGroup; items: SidebarNavItem[] }[] = [
  { parentCategory: 'ai', items: aiSubcategories },
  { parentCategory: 'design', items: designSubcategories },
  { parentCategory: 'development', items: developmentSubcategories },
  { parentCategory: 'watch', items: watchSubcategories },
  { parentCategory: 'downloads', items: downloadsSubcategories },
] as const

export const siteGroupNav: SidebarNavGroup[] = [
  { name: 'AI', icon: Bot, route: '/sites/ai', group: 'ai', items: aiSubcategories },
  {
    name: 'Design',
    icon: Palette,
    route: '/sites/design',
    group: 'design',
    items: designSubcategories,
  },
  {
    name: 'Development',
    icon: Code2,
    route: '/sites/development',
    group: 'development',
    items: developmentSubcategories,
  },
  { name: 'Watch', icon: Film, route: '/sites/watch', group: 'watch', items: watchSubcategories },
  {
    name: 'Downloads',
    icon: Download,
    route: '/sites/downloads',
    group: 'downloads',
    items: downloadsSubcategories,
  },
] as const

export const isSiteGroupRoute = (path: string, group: SiteGroup): boolean => {
  return path === `/sites/${group}` || path.startsWith(`/sites/${group}/`)
}

export type SidebarSectionKey = 'sites' | 'extensions' | 'mcp' | 'skills'
export type SidebarScope = SidebarSectionKey | 'all'

export interface SidebarSection {
  key: SidebarSectionKey
  name: string
  icon: Component
  /** Landing route used by the mobile tab bar and the section header link. */
  route: string
  /** Collapsible groups (the sites catalog is the only section with children). */
  groups: SidebarNavGroup[]
  /** Flat rows rendered directly under the section header. */
  items: SidebarNavItem[]
}

/**
 * The browse tree, ordered top to bottom. Every section renderer walks this same list so the
 * desktop column, the search panel and the mobile chips can never drift apart.
 */
export const sidebarSections: SidebarSection[] = [
  {
    key: 'sites',
    name: 'Sites',
    icon: Layers,
    route: '/',
    groups: siteGroupNav,
    items: [],
  },
  {
    key: 'extensions',
    name: 'Extensions',
    icon: Puzzle,
    route: '/extensions/writing',
    groups: [],
    items: extensionCategories,
  },
  {
    key: 'mcp',
    name: 'MCP',
    icon: Plug,
    route: '/mcp/development',
    groups: [],
    items: mcpCategories,
  },
  {
    key: 'skills',
    name: 'Skills',
    icon: Sparkles,
    route: '/skills/skills',
    groups: [],
    items: skillsNav,
  },
]

export interface SidebarSearchEntry {
  name: string
  route: string
  icon: Component
  /** Group or section label the row is nested under — shown as the result group header. */
  parent: string
  section: SidebarSectionKey
}

/** Flat search corpus: every destination the sidebar can navigate to, with its parent label. */
export const sidebarSearchEntries: SidebarSearchEntry[] = sidebarSections.flatMap((section) => [
  ...section.groups.flatMap((group) => [
    {
      name: group.name,
      route: group.route,
      icon: group.icon,
      parent: section.name,
      section: section.key,
    },
    ...group.items.map((item) => ({
      name: item.name,
      route: item.route,
      icon: item.icon,
      parent: group.name,
      section: section.key,
    })),
  ]),
  ...section.items.map((item) => ({
    name: item.name,
    route: item.route,
    icon: item.icon,
    parent: section.name,
    section: section.key,
  })),
])

export type SidebarMainMenuGroupKey = 'home' | 'explore' | 'build'

export interface SidebarMainMenuItem {
  name: string
  icon: Component
  route: string
  group: SidebarMainMenuGroupKey
  /**
   * Predicate rather than a prefix match: `Home` owns the bare `/` and `Sites` owns `/sites/*`, so
   * exactly one entry is ever highlighted.
   */
  isActive: (path: string) => boolean
  /** Set when the row also drills in: pushing the section view as it navigates. */
  section?: SidebarSectionKey
}

/**
 * The 21st-style headers over the root view. `home` is deliberately headerless — Home is a
 * destination, not one of the catalog tabs, and the reference floats it above the first section
 * header rather than burying it under one.
 */
export const sidebarMainMenuGroups: {
  key: SidebarMainMenuGroupKey
  name: string | null
}[] = [
  { key: 'home', name: null },
  { key: 'explore', name: 'Explore' },
  { key: 'build', name: 'Build' },
]

/**
 * The root of the sidebar stack: a one-stop jump to every top-level destination, derived from
 * `sidebarSections` so a new section appears here without anyone editing a menu. Clicking a section
 * navigates *and* pushes that section's list onto the stack.
 */
export const sidebarMainMenuItems: SidebarMainMenuItem[] = [
  {
    name: 'Home',
    icon: House,
    route: '/',
    group: 'home',
    isActive: (path) => path === '/',
  },
  ...sidebarSections.map((section) => ({
    name: section.name,
    icon: section.icon,
    route: section.route,
    group: 'explore' as const,
    section: section.key,
    // The sites section's route is the app root, which belongs to Home alone — otherwise landing on
    // `/` lights up both rows.
    isActive: (path: string) =>
      path !== '/' && (path === section.route || path.startsWith(`${section.route}/`)),
  })),
  {
    name: 'Bookmarks',
    icon: Bookmark,
    route: '/bookmarks',
    group: 'build',
    isActive: (path) => path === '/bookmarks' || path.startsWith('/bookmarks/'),
  },
  {
    name: 'Account',
    icon: UserRound,
    route: '/account',
    group: 'build',
    isActive: (path) => path === '/account' || path.startsWith('/account/'),
  },
]

/** Section a path belongs to, or `null` for routes the column does not own (docs, not-found…). */
export function getSidebarSectionForPath(path: string): SidebarSectionKey | null {
  if (path === '/' || path === '/sites' || path.startsWith('/sites/')) return 'sites'
  if (path.startsWith('/extensions')) return 'extensions'
  if (path.startsWith('/mcp')) return 'mcp'
  if (path.startsWith('/skills')) return 'skills'

  return null
}

/** Category chips for the mobile scroller: the destinations worth one lateral hop. */
export function getSectionChips(section: SidebarSectionKey): SidebarNavItem[] {
  if (section === 'sites') {
    return siteGroupNav.map((group) => ({
      name: group.name,
      icon: group.icon,
      route: group.route,
    }))
  }

  return sidebarSections.find((entry) => entry.key === section)?.items ?? []
}
