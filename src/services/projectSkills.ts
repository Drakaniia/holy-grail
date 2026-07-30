// src/services/projectSkills.ts
// Dynamic project-level skill discovery — scans locally installed SKILL.md files.

export interface ProjectSkillMeta {
  slug: string
  title: string
  description: string
  category: string
  parentCategory: string
  tags: string[]
  author: string
  authorName: string
  repoLink: string
  skillPath: string
  branch: string
  dateAdded: string
  featured: boolean
  localPath: string
}

/**
 * Parse YAML frontmatter from SKILL.md content.
 * Returns null if no valid frontmatter found.
 */
export function parseSkillFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return null

  const frontmatter: Record<string, unknown> = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value: unknown = line.slice(colonIndex + 1).trim()

    if (typeof value === 'string') {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((i) => i.trim().replace(/^["']|["']$/g, ''))
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      } else if (!isNaN(Number(value)) && value !== '') {
        value = Number(value)
      }
    }
    frontmatter[key] = value
  }

  return frontmatter
}

/**
 * Convert raw SKILL.md content + path to a ProjectSkillMeta.
 */
export function skillMdToMeta(content: string, slug: string, localPath: string): ProjectSkillMeta {
  const fm = parseSkillFrontmatter(content)
  return {
    slug: (fm?.slug as string) || slug,
    title: (fm?.title as string) || slug,
    description: (fm?.description as string) || '',
    category: (fm?.category as string) || '',
    parentCategory: (fm?.parentCategory as string) || 'skills',
    tags: (fm?.tags as string[]) || [],
    author: (fm?.author as string) || '',
    authorName: (fm?.authorName as string) || '',
    repoLink: (fm?.repoLink as string) || '',
    skillPath: (fm?.skillPath as string) || '',
    branch: (fm?.branch as string) || 'main',
    dateAdded: (fm?.dateAdded as string) || new Date().toISOString(),
    featured: (fm?.featured as boolean) || false,
    localPath,
  }
}
