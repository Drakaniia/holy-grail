// Markdown / JSON response formatting + CHARACTER_LIMIT truncation.
// Markdown is compact (headers, bullet lists, verbose fields omitted); JSON is
// the complete record. Truncation reports `truncated: true` and points at
// offset/filters.

import { CHARACTER_LIMIT, absolutizeUrl } from './constants.js'
import type { SearchCatalogPage } from './search.js'
import type { Extension, McpServer, Preview, Site, Skill } from './types.js'

export interface Truncation {
  text: string
  truncated: boolean
  truncation_message?: string
}

export function applyTruncation(text: string, limit: number = CHARACTER_LIMIT): Truncation {
  if (text.length <= limit) return { text, truncated: false }
  const message =
    `\n\n[Response truncated at ${limit.toLocaleString()} characters. ` +
    `Use 'offset' / filters or a smaller 'limit' to narrow results.]`
  const cut = text.slice(0, Math.max(1, limit - message.length))
  return { text: cut + message, truncated: true, truncation_message: message }
}

// ---- Shared helpers ----

export interface PageMeta {
  total: number
  count: number
  offset: number
  has_more: boolean
  next_offset: number | null
}

function pageMetaLine(meta: PageMeta, label: string): string {
  const lines = [
    `# ${label}`,
    '',
    `Found ${meta.total.toLocaleString()} results (showing ${meta.count}, offset ${meta.offset})`,
    '',
  ]
  if (meta.has_more && meta.next_offset !== null) {
    lines.push(`_Use 'offset: ${meta.next_offset}' for the next page._`, '')
  }
  return lines.join('\n')
}

function link(name: string, url: string): string {
  return url ? `[${name}](${url})` : ''
}

function tagLine(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return ''
  return `\n**Tags:** ${tags.join(', ')}`
}

export function previewToPayload(preview: Preview | undefined): {
  image: string
  small: string
  width: number
  height: number
  capturedAt: string
  sourceUrl?: string
} | null {
  if (!preview) return null
  return {
    image: absolutizeUrl(preview.image),
    small: absolutizeUrl(preview.small),
    width: preview.width,
    height: preview.height,
    capturedAt: preview.capturedAt,
    ...(preview.sourceUrl ? { sourceUrl: preview.sourceUrl } : {}),
  }
}

function previewMarkdown(preview: Preview | undefined): string {
  if (!preview) return ''
  return `\n**Preview:** ${absolutizeUrl(preview.image)} (${preview.width}×${preview.height})`
}

// ---- Entity markdown ----

export function formatSite(site: Site, preview?: Preview): string {
  const lines = [
    `# ${site.name} (site)`,
    '',
    site.description,
    '',
    `**Category:** ${site.category}${site.parentCategory ? ` / ${site.parentCategory}` : ''}`,
    `**Stars:** ${site.stars.toLocaleString()} · **Watchers:** ${site.watchers.toLocaleString()} · **License:** ${site.license}`,
    `**Version:** ${site.version} · **Contributors:** ${site.contributors.toLocaleString()} · **Releases:** ${site.releases.toLocaleString()}`,
  ]
  if (site.platforms.length > 0) lines.push(`**Platforms:** ${site.platforms.join(', ')}`)
  if (site.deployment.length > 0) lines.push(`**Deployment:** ${site.deployment.join(', ')}`)
  const links = [
    link('Website', site.website),
    link('Docs', site.docs),
    link('Source', site.sourceCode),
  ].filter(Boolean)
  if (links.length > 0) lines.push(`**Links:** ${links.join(' · ')}`)
  lines.push(tagLine(site.tags).trim() || '')
  if (site.verified) lines.push('**Verified:** true')
  if (site.fullDescription) {
    lines.push('', '## About', '', truncateDescription(site.fullDescription))
  }
  if (site.coreFeatures && site.coreFeatures.length > 0) {
    lines.push('', '## Core features', '')
    for (const f of site.coreFeatures) lines.push(`- **${f.name}** — ${f.description}`)
  }
  if (site.similarTools && site.similarTools.length > 0) {
    lines.push('', '## Similar tools', '')
    for (const t of site.similarTools) {
      lines.push(`- **${t.name}** — ${t.description} (${t.stars.toLocaleString()} stars)`)
    }
  }
  lines.push(previewMarkdown(preview))
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatExtension(extension: Extension, preview?: Preview): string {
  const lines = [
    `# ${extension.name} (extension)`,
    '',
    extension.description,
    '',
    `**Category:** ${extension.category}${extension.parentCategory ? ` / ${extension.parentCategory}` : ''}`,
    `**License:** ${extension.license} · **Version:** ${extension.version}`,
  ]
  const links = [
    link('Website', extension.website),
    link('Docs', extension.docs),
    link('Source', extension.sourceCode),
  ].filter(Boolean)
  if (links.length > 0) lines.push(`**Links:** ${links.join(' · ')}`)
  lines.push(tagLine(extension.tags).trim() || '')
  if (extension.verified) lines.push('**Verified:** true')
  if (extension.fullDescription) {
    lines.push('', '## About', '', truncateDescription(extension.fullDescription))
  }
  if (extension.coreFeatures && extension.coreFeatures.length > 0) {
    lines.push('', '## Core features', '')
    for (const f of extension.coreFeatures) lines.push(`- **${f.name}** — ${f.description}`)
  }
  if (extension.similarTools && extension.similarTools.length > 0) {
    lines.push('', '## Similar tools', '')
    for (const t of extension.similarTools) {
      lines.push(`- **${t.name}** — ${t.description} (${t.stars.toLocaleString()} stars)`)
    }
  }
  lines.push(previewMarkdown(preview))
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatMcpServer(server: McpServer): string {
  const lines = [
    `# ${server.name} (mcp server)`,
    '',
    server.description,
    '',
    `**Category:** ${server.category}${server.parentCategory ? ` / ${server.parentCategory}` : ''}`,
    `**Transport:** ${server.transport}`,
  ]
  if (server.installCommand) lines.push(`**Install:** \`${server.installCommand}\``)
  const links = [
    link('Website', server.website),
    link('Docs', server.docs),
    link('Source', server.sourceCode),
  ].filter(Boolean)
  if (links.length > 0) lines.push(`**Links:** ${links.join(' · ')}`)
  lines.push(tagLine(server.tags).trim() || '')
  if (server.verified) lines.push('**Verified:** true')
  if (server.tools.length > 0) {
    lines.push('', '## Tools', '')
    for (const t of server.tools) lines.push(`- \`${t.name}\` — ${t.description}`)
  }
  if (server.connections.length > 0) {
    lines.push('', '## Connections', '', server.connections.map((c) => `- ${c}`).join('\n'))
  }
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatSkill(skill: Skill): string {
  const lines = [
    `# ${skill.title} (skill)`,
    '',
    skill.description,
    '',
    `**Category:** ${skill.category}${skill.parentCategory ? ` / ${skill.parentCategory}` : ''}`,
  ]
  if (skill.authorName) lines.push(`**Author:** ${skill.authorName}`)
  lines.push(
    `**Repo:** ${skill.repoLink} · **Path:** ${skill.skillPath} · **Branch:** ${skill.branch}`,
  )
  if (skill.views > 0 || skill.uses > 0) {
    lines.push(
      `**Views:** ${skill.views.toLocaleString()} · **Uses:** ${skill.uses.toLocaleString()}`,
    )
  }
  lines.push(tagLine(skill.tags).trim() || '')
  lines.push(`**Install:** \`npx grail add ${skill.repoLink} --skill ${skill.slug}\``)
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function truncateDescription(text: string, max = 500): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

// ---- Search + list markdown ----

export function formatSearchResults(
  query: string,
  page: SearchCatalogPage,
  kindFilter?: string,
): string {
  const lines = [
    `# Search results for "${query}"`,
    '',
    `Found ${page.total.toLocaleString()} matches (showing ${page.count}, offset ${page.offset})${
      kindFilter ? ` for kind '${kindFilter}'` : ''
    }`,
    '',
  ]
  if (page.results.length === 0) {
    lines.push('No matches. Try a shorter or broader query.')
    return lines.join('\n')
  }
  for (const hit of page.results) {
    lines.push(
      `- **${hit.name}** (\`${hit.kind}\`, ${hit.matchStrength}, score ${hit.score.toFixed(1)}) — ${hit.description}`,
    )
    lines.push(`  - slug: \`${hit.slug}\` · route: \`${hit.route}\``)
  }
  if (page.has_more && page.next_offset !== null) {
    lines.push('', `_Use 'offset: ${page.next_offset}' for the next page._`)
  }
  return lines.join('\n')
}

export function formatSiteList(
  sites: Array<Pick<Site, 'slug' | 'name' | 'category' | 'stars'>>,
  meta: PageMeta,
  filters?: { parentCategory?: string; category?: string },
): string {
  const label = [
    'Sites',
    filters?.parentCategory && `(${filters.parentCategory})`,
    filters?.category && `(${filters.category})`,
  ]
    .filter(Boolean)
    .join(' ')
  const lines = [pageMetaLine(meta, label).trimEnd()]
  for (const site of sites) {
    lines.push(
      `- **${site.name}** (\`${site.slug}\`, ${site.category}) — ${site.stars.toLocaleString()} stars`,
    )
  }
  return lines.join('\n')
}

export function formatExtensionList(
  extensions: Array<Pick<Extension, 'slug' | 'name' | 'category'>>,
  meta: PageMeta,
  filters?: { parentCategory?: string; category?: string },
): string {
  const label = [
    'Extensions',
    filters?.parentCategory && `(${filters.parentCategory})`,
    filters?.category && `(${filters.category})`,
  ]
    .filter(Boolean)
    .join(' ')
  const lines = [pageMetaLine(meta, label).trimEnd()]
  for (const ext of extensions) {
    lines.push(`- **${ext.name}** (\`${ext.slug}\`, ${ext.category})`)
  }
  return lines.join('\n')
}

export function formatMcpServerList(
  servers: Array<Pick<McpServer, 'slug' | 'name' | 'category' | 'transport' | 'tools'>>,
  meta: PageMeta,
  filters?: { category?: string; transport?: string },
): string {
  const label = [
    'MCP servers',
    filters?.category && `(${filters.category})`,
    filters?.transport && `(${filters.transport})`,
  ]
    .filter(Boolean)
    .join(' ')
  const lines = [pageMetaLine(meta, label).trimEnd()]
  for (const server of servers) {
    lines.push(
      `- **${server.name}** (\`${server.slug}\`, ${server.category}, ${server.transport}, ${server.tools.length} tools)`,
    )
  }
  return lines.join('\n')
}

export function formatSkillList(
  skills: Array<Pick<Skill, 'slug' | 'title' | 'category'>>,
  meta: PageMeta,
  filters?: { category?: string; parentCategory?: string },
): string {
  const label = [
    'Skills',
    filters?.category && `(${filters.category})`,
    filters?.parentCategory && `(${filters.parentCategory})`,
  ]
    .filter(Boolean)
    .join(' ')
  const lines = [pageMetaLine(meta, label).trimEnd()]
  for (const skill of skills) {
    lines.push(`- **${skill.title}** (\`${skill.slug}\`, ${skill.category})`)
  }
  return lines.join('\n')
}

export interface StatsPayload {
  counts: Record<'sites' | 'extensions' | 'mcp' | 'skills', number>
  total: number
  byParentCategory: Record<
    string,
    { sites: number; extensions: number; mcp: number; skills: number }
  >
}

export function formatStats(stats: StatsPayload): string {
  const lines = ['# Catalog Stats', '', '| Kind | Count |', '|---|---|']
  for (const kind of ['sites', 'extensions', 'mcp', 'skills'] as const) {
    lines.push(`| ${kind} | ${stats.counts[kind].toLocaleString()} |`)
  }
  lines.push(`| **Total** | **${stats.total.toLocaleString()}** |`)
  lines.push('', '## By parent category', '')
  for (const [parent, counts] of Object.entries(stats.byParentCategory)) {
    const parts = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([kind, n]) => `${kind}: ${n}`)
    if (parts.length > 0) lines.push(`- **${parent}** — ${parts.join(' · ')}`)
  }
  return lines.join('\n')
}
