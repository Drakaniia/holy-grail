import MarkdownIt from 'markdown-it'
import { parse } from 'yaml'

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

  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')

  try {
    return { frontmatter: (parse(match[1]) ?? {}) as Record<string, unknown>, body }
  } catch {
    // Malformed frontmatter still leaves the markdown body readable.
    return { frontmatter: {}, body }
  }
}

export async function fetchSkillContent(
  owner: string,
  repo: string,
  skillPath: string,
  branch = 'main',
): Promise<SkillContent> {
  // Try multiple SKILL.md locations matching npx grail CLI behavior
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
