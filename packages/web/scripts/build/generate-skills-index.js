import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

const outputPaths = [
  path.resolve(projectRoot, 'src/content/skills-index.json'),
  path.resolve(projectRoot, 'public/content/skills-index.json'),
]

const CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.grail')
const CACHE_FILE = path.join(CACHE_DIR, 'skills-discovery-cache.json')
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * generate-skills-index.js — Dynamic skills index generator
 *
 * Discovers skills from GitHub repos following the SKILL.md convention.
 *
 * How it works:
 *   1. Uses GitHub Git Trees API — ONE call per repo returns the full file tree
 *   2. SKILL.md content fetched via raw.githubusercontent.com (no rate limit)
 *   3. Results cached to ~/.grail/skills-discovery-cache.json (1h TTL)
 *   4. public/content/skills-index.json committed to git as fallback
 *
 * No local installation needed — we discover and index.
 * Users install skills via `npx grail add` on their own machines.
 */

const KNOWN_REPOS = [
  { owner: 'midudev', repo: 'autoskills' },
  { owner: 'anthropics', repo: 'skills' },
  { owner: 'addyosmani', repo: 'agent-skills' },
  { owner: 'mgechev', repo: 'skills-best-practices' },
  { owner: 'mattpocock', repo: 'skills' },
  { owner: 'Imbad0202', repo: 'academic-research-skills' },
  { owner: 'Leonxlnx', repo: 'taste-skill' },
  { owner: 'agentskills', repo: 'agentskills' },
  { owner: '402-md', repo: 'skillmd' },
  { owner: 'choutos', repo: 'agent-skills-spec' },
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

/** Get full recursive file tree via Git Trees API (1 call per repo). */
async function getRepoTree(owner, repo, branch = 'main') {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  const res = await githubFetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.tree || null
}

/** Fetch SKILL.md via raw.githubusercontent.com (no rate limit). */
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

  // Find all SKILL.md files in the tree
  const skillMdPaths = tree
    .filter((e) => e.type === 'blob' && e.path.endsWith('/SKILL.md'))
    .map((e) => e.path)

  if (skillMdPaths.length === 0) return []

  // Group by parent directory (the skill)
  // Each unique parent directory = one skill
  const seen = new Set()
  const skills = []

  for (const filepath of skillMdPaths) {
    const parts = filepath.split('/')
    if (parts.length < 2) continue // root SKILL.md, not a skill dir
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

// ── Cache ───────────────────────────────────────────────────────────

function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (Date.now() - data.timestamp < CACHE_TTL_MS) return data
    }
  } catch {}
  return null
}

function writeCache(skills) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ timestamp: Date.now(), skills, repos: KNOWN_REPOS }, null, 2),
    )
  } catch {}
}

// ── Main ────────────────────────────────────────────────────────────

async function build() {
  const cached = readCache()
  if (cached) {
    console.log(`Using cached skills (${cached.skills.length} skills)`)
    writeIndex(cached.skills)
    return
  }

  console.log(`Discovering skills from ${KNOWN_REPOS.length} repos...`)
  const allSkills = []
  const seen = new Set()

  for (const { owner, repo } of KNOWN_REPOS) {
    process.stdout.write(`  ${owner}/${repo}... `)
    try {
      const skills = await discoverSkills(owner, repo)
      const newSkills = skills.filter((s) => !seen.has(s.slug))
      for (const s of newSkills) seen.add(s.slug)
      allSkills.push(...newSkills)
      console.log(`${newSkills.length} skills`)
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (allSkills.length > 0) {
    writeCache(allSkills)
    writeIndex(allSkills)
  } else {
    // Discovery failed (rate limited, network error, etc.).
    // Don't overwrite the committed fallback index.
    // public/content/skills-index.json is committed to git and has skills data.
    console.log('No skills discovered. Keeping existing index untouched.')
  }
}

function writeIndex(skills) {
  const sorted = [...skills].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.views - a.views
  })
  const json = JSON.stringify(sorted, null, 2)
  for (const p of outputPaths) {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, json, 'utf-8')
  }
  console.log(`\nWritten: ${sorted.length} skills from ${KNOWN_REPOS.length} repos`)
}

build().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
