// update-registry.js
// Maintainer script: scans known GitHub repos for SKILL.md files and updates
// the community registry at public/content/skills-registry.json.
//
// Usage: bun run update:registry
//
// To add a new source repo, add it to REGISTRY_SOURCES below and submit a PR.
// The registry has NO hardcoded limits — any public GitHub repo following the
// SKILL.md convention can be added.
//
// LobeHub-inspired: this is a maintainer tool, NOT a build step. The registry
// JSON file ships with the app and is fetched at runtime. No build-time GitHub
// API calls needed for normal dev/build.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')

const REGISTRY_PATH = resolve(projectRoot, 'public/content/skills-registry.json')

// ── Registry sources — add any public GitHub repo here ────────────────
// Format: { owner, repo }
// Starts empty — grows organically via PRs. No hardcoded limit.
// Anyone can add a repo that follows the SKILL.md convention.
const REGISTRY_SOURCES = [
  // Add any public GitHub repo that follows the SKILL.md convention.
  // Skills are discovered from these repos and merged into the registry.
  { owner: 'midudev', repo: 'autoskills' },
  { owner: 'mattpocock', repo: 'skills' },
  { owner: 'Imbad0202', repo: 'academic-research-skills' },
  { owner: 'Leonxlnx', repo: 'taste-skill' },
  { owner: 'anthropics', repo: 'skills' },
  { owner: 'addyosmani', repo: 'agent-skills' },
  { owner: '402-md', repo: 'skillmd' },
  { owner: 'choutos', repo: 'agent-skills-spec' },
  { owner: 'Drakaniia', repo: 'skills' },
  { owner: 'obra', repo: 'superpowers' },
]

const GITHUB_API = 'https://api.github.com'
const GITHUB_RAW = 'https://raw.githubusercontent.com'

// ── Frontmatter parser ──────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return {}
  const frontmatter = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else if (value === 'true') {
      value = true
    } else if (value === 'false') {
      value = false
    } else if (!isNaN(Number(value)) && value !== '') {
      value = Number(value)
    }
    frontmatter[key] = value
  }
  return frontmatter
}

// ── GitHub API ──────────────────────────────────────────────────────

async function githubFetch(url) {
  const headers = {
    'User-Agent': 'holy-grail/1.0',
    Accept: 'application/vnd.github.v3+json',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, { headers })
}

async function getRepoTree(owner, repo, branch = 'main') {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  const res = await githubFetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.tree || null
}

async function fetchRawSkillMd(owner, repo, filepath, branch = 'main') {
  const url = `${GITHUB_RAW}/${owner}/${repo}/${branch}/${filepath}`
  try {
    const res = await fetch(url)
    if (res.ok) {
      const text = await res.text()
      if (text.trim().length > 0) return text
    }
  } catch {}
  return null
}

// ── Discovery ───────────────────────────────────────────────────────

async function discoverSkills(owner, repo) {
  const tree = await getRepoTree(owner, repo)
  if (!tree) return []

  const skillMdPaths = tree
    .filter((e) => e.type === 'blob' && e.path.endsWith('/SKILL.md'))
    .map((e) => e.path)

  if (skillMdPaths.length === 0) return []

  const seen = new Set()
  const skills = []

  for (const filepath of skillMdPaths) {
    const parts = filepath.split('/')
    if (parts.length < 2) continue
    const dir = parts.slice(0, -1).join('/')
    const slug = parts[parts.length - 2]
    if (seen.has(slug)) continue
    seen.add(slug)

    const content = await fetchRawSkillMd(owner, repo, filepath)
    if (!content) continue

    const fm = parseFrontmatter(content)
    const firstLine = (content.trim().split('\n')[0] || '').replace(/^#\s*/, '')

    skills.push({
      slug: fm.slug || fm.name || slug,
      title: fm.title || fm.name || slug,
      description: fm.description || firstLine || `${owner}/${repo} — ${slug}`,
      category: fm.category || 'AI',
      parentCategory: 'skills',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      views: Number(fm.views) || 0,
      uses: Number(fm.uses) || 0,
      author: fm.author || owner,
      authorName: fm.authorName || owner,
      repoLink: `${owner}/${repo}`,
      skillPath: dir,
      branch: fm.branch || 'main',
      addedBy: fm.addedBy || '',
      featured: Boolean(fm.featured),
      dateAdded: fm.dateAdded || '',
      hasLocalContent: false,
    })
  }

  return skills
}

// ── Merge ──────────────────────────────────────────────────────────

function mergeSkills(existing, discovered) {
  const slugMap = new Map()
  for (const s of existing) slugMap.set(s.slug, s)
  for (const s of discovered) {
    if (!slugMap.has(s.slug)) slugMap.set(s.slug, s)
  }
  return [...slugMap.values()].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.views - a.views
  })
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Updating registry from ${REGISTRY_SOURCES.length} source repos...`)

  // Load existing registry (if any) so we don't lose manually-added entries
  let existing = []
  if (existsSync(REGISTRY_PATH)) {
    try {
      existing = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
      console.log(`  Existing registry: ${existing.length} skills`)
    } catch {}
  }

  const allDiscovered = []
  const seen = new Set()

  for (const { owner, repo } of REGISTRY_SOURCES) {
    process.stdout.write(`  ${owner}/${repo}... `)
    try {
      const skills = await discoverSkills(owner, repo)
      const newSkills = skills.filter((s) => !seen.has(s.slug))
      for (const s of newSkills) seen.add(s.slug)
      allDiscovered.push(...newSkills)
      console.log(`${newSkills.length} skills`)
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : err}`)
    }
  }

  const merged = mergeSkills(existing, allDiscovered)
  const json = JSON.stringify(merged, null, 2)
  writeFileSync(REGISTRY_PATH, json, 'utf-8')

  console.log(`\nRegistry updated: ${merged.length} skills total`)
  console.log(`  ${allDiscovered.length} discovered from ${REGISTRY_SOURCES.length} source repos`)
  console.log(`  ${merged.length - allDiscovered.length} carried over from previous registry`)
  console.log(`  Written to: ${REGISTRY_PATH}`)
  console.log('\nCommit this file to share the updated registry with all users.')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
