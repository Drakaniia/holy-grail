import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export interface SkillContent {
  raw: string
  html: string
  frontmatter: Record<string, unknown>
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { frontmatter: {}, body: content }

  const frontmatter: Record<string, unknown> = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Parse arrays like [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value
        .slice(1, -1)
        .split(',')
        .map((i) => i.trim().replace(/^["']|["']$/g, ''))
      frontmatter[key] = items
    } else if (value === 'true') {
      frontmatter[key] = true
    } else if (value === 'false') {
      frontmatter[key] = false
    } else if (!isNaN(Number(value)) && value !== '') {
      frontmatter[key] = Number(value)
    } else {
      frontmatter[key] = value
    }
  }

  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
  return { frontmatter, body }
}

export async function fetchSkillContent(
  owner: string,
  repo: string,
  skillPath: string,
  branch = 'main',
): Promise<SkillContent> {
  // Try multiple SKILL.md locations matching npx skills CLI behavior
  const candidates = skillPath
    ? [
        `${skillPath}/SKILL.md`,
        `skills/${skillPath}/SKILL.md`,
        `.agents/skills/${skillPath}/SKILL.md`,
        `.claude/skills/${skillPath}/SKILL.md`,
        skillPath,
      ]
    : ['SKILL.md']

  // Also try root level for single-skill repos
  if (skillPath) {
    candidates.push('SKILL.md')
  }

  for (const path of candidates) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const raw = await res.text()
        const { frontmatter, body } = parseFrontmatter(raw)
        const html = md.render(body)
        return { raw, html, frontmatter }
      }
    } catch {
      continue
    }
  }

  throw new Error(`SKILL.md not found in ${owner}/${repo}`)
}

export function renderMarkdown(content: string): string {
  const { body } = parseFrontmatter(content)
  return md.render(body)
}
