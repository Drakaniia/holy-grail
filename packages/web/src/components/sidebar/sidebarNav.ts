import type { Component } from 'vue'
import {
  Activity,
  BookOpen,
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
  Image,
  Lightbulb,
  MessageSquare,
  Microscope,
  Package,
  Palette,
  Plug,
  Presentation,
  ScanSearch,
  Server,
  Shapes,
  ShieldCheck,
  Sparkles,
  Terminal,
  Type,
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
