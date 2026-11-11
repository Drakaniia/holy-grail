// Resolves and downloads a catalog skill's files from GitHub.
//
// The skill directory is located the same way the SPA and `npx grail` do: try
// <skillPath>/SKILL.md, skills/<skillPath>/SKILL.md, .agents/skills/...,
// .claude/skills/..., a direct .md path, then a root SKILL.md (single-skill
// repo). One git-trees API call lists the repo; file bodies come from
// raw.githubusercontent.com, which is not API rate-limited. If the trees API
// is unavailable (rate limit, truncated tree) only SKILL.md is returned.
// GITHUB_TOKEN / GH_TOKEN raise the API limit when set.

import { posix } from 'node:path'
import { SKILL_MAX_FILE_BYTES, SKILL_MAX_FILES, SKILL_MAX_TOTAL_BYTES } from './constants.js'
import type { Skill } from './types.js'

const FETCH_TIMEOUT_MS = 15000
const CACHE_TTL_MS = 10 * 60 * 1000
/** Subdirectories kept for single-skill repos whose SKILL.md sits at the root. */
const ROOT_SKILL_DIRS = ['scripts/', 'references/', 'assets/', 'templates/', 'examples/']

export interface SkillFile {
  /** Path relative to the skill directory, POSIX separators. */
  path: string
  size: number
  encoding: 'utf-8' | 'base64'
  content: string
}

export interface SkillBundle {
  slug: string
  repo: string
  branch: string
  /** Skill directory inside the repo ('' = repo root). */
  skillDir: string
  sourceUrl: string
  files: SkillFile[]
  /** Files skipped because of size/count limits. */
  skipped: Array<{ path: string; reason: string }>
  /** True when the repo listing failed and only SKILL.md could be fetched. */
  partial: boolean
}

interface TreeEntry {
  path: string
  type: string
  size?: number
}

const cache = new Map<string, { at: number; bundle: SkillBundle }>()

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'holy-grail-mcp',
    'x-github-api-version': '2022-11-28',
  }
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function rawUrl(repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${encodePath(path)}`
}

function candidatePaths(skillPath: string): string[] {
  const clean = skillPath.replace(/^\/+|\/+$/g, '')
  if (!clean) return ['SKILL.md']
  const candidates = [
    `${clean}/SKILL.md`,
    `skills/${clean}/SKILL.md`,
    `.agents/skills/${clean}/SKILL.md`,
    `.claude/skills/${clean}/SKILL.md`,
  ]
  if (clean.toLowerCase().endsWith('.md')) candidates.push(clean)
  candidates.push('SKILL.md')
  return candidates
}

async function fetchTree(repo: string, branch: string): Promise<TreeEntry[] | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers: githubHeaders(), signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    )
    if (!response.ok) return null
    const body = (await response.json()) as { tree?: TreeEntry[]; truncated?: boolean }
    if (!Array.isArray(body.tree) || body.truncated) return null
    return body.tree
  } catch {
    return null
  }
}

async function fetchRaw(repo: string, branch: string, path: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(rawUrl(repo, branch, path), {
      headers: { 'user-agent': 'holy-grail-mcp' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

function isBinary(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 8000)
  for (let i = 0; i < limit; i++) if (bytes[i] === 0) return true
  return false
}

function toSkillFile(path: string, bytes: Uint8Array): SkillFile {
  const binary = isBinary(bytes)
  return {
    path,
    size: bytes.length,
    encoding: binary ? 'base64' : 'utf-8',
    content: binary ? Buffer.from(bytes).toString('base64') : new TextDecoder().decode(bytes),
  }
}

/** True for a safe relative POSIX path that cannot escape its base directory. */
export function isSafeRelativePath(path: string): boolean {
  if (!path || path.includes('\0') || path.includes('\\')) return false
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return false
  const normalized = posix.normalize(path)
  return normalized === path && !normalized.split('/').includes('..')
}

export async function fetchSkillBundle(skill: Skill): Promise<SkillBundle> {
  const key = `${skill.repoLink}@${skill.branch}:${skill.skillPath}:${skill.slug}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.bundle

  const repo = skill.repoLink.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error(`Skill '${skill.slug}' has an invalid repository link '${skill.repoLink}'`)
  }
  const branch = skill.branch || 'main'
  const candidates = candidatePaths(skill.skillPath)
  const tree = await fetchTree(repo, branch)

  let skillMdPath: string | null = null
  if (tree) {
    const blobs = new Set(tree.filter((e) => e.type === 'blob').map((e) => e.path))
    skillMdPath = candidates.find((c) => blobs.has(c)) ?? null
  } else {
    for (const candidate of candidates) {
      const bytes = await fetchRaw(repo, branch, candidate)
      if (bytes) {
        // Listing unavailable: return SKILL.md alone, flagged partial.
        const dir = posix.dirname(candidate) === '.' ? '' : posix.dirname(candidate)
        const bundle: SkillBundle = {
          slug: skill.slug,
          repo,
          branch,
          skillDir: dir,
          sourceUrl: `https://github.com/${repo}/tree/${branch}${dir ? `/${dir}` : ''}`,
          files: [toSkillFile('SKILL.md', bytes)],
          skipped: [],
          partial: true,
        }
        cache.set(key, { at: Date.now(), bundle })
        return bundle
      }
    }
  }
  if (!skillMdPath || !tree) {
    throw new Error(
      `Could not find SKILL.md for '${skill.slug}' in ${repo}@${branch} (tried: ${candidates.join(', ')})`,
    )
  }

  const skillDir = posix.dirname(skillMdPath) === '.' ? '' : posix.dirname(skillMdPath)
  const prefix = skillDir ? `${skillDir}/` : ''
  const members = tree
    .filter((e) => e.type === 'blob' && e.path.startsWith(prefix))
    .map((e) => ({ repoPath: e.path, path: e.path.slice(prefix.length), size: e.size ?? 0 }))
    .filter((e) =>
      skillDir ? true : e.path === 'SKILL.md' || ROOT_SKILL_DIRS.some((d) => e.path.startsWith(d)),
    )
    .filter((e) => isSafeRelativePath(e.path))
    // SKILL.md first, then alphabetical
    .sort((a, b) =>
      a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : a.path.localeCompare(b.path),
    )

  const files: SkillFile[] = []
  const skipped: SkillBundle['skipped'] = []
  let total = 0
  for (const member of members) {
    if (files.length >= SKILL_MAX_FILES) {
      skipped.push({ path: member.path, reason: `more than ${SKILL_MAX_FILES} files` })
      continue
    }
    if (member.size > SKILL_MAX_FILE_BYTES) {
      skipped.push({ path: member.path, reason: `larger than ${SKILL_MAX_FILE_BYTES / 1024} KB` })
      continue
    }
    if (total + member.size > SKILL_MAX_TOTAL_BYTES) {
      skipped.push({ path: member.path, reason: 'total size limit reached' })
      continue
    }
    const bytes = await fetchRaw(repo, branch, member.repoPath)
    if (!bytes) {
      skipped.push({ path: member.path, reason: 'download failed' })
      continue
    }
    total += bytes.length
    files.push(toSkillFile(member.path, bytes))
  }
  if (!files.some((f) => f.path === 'SKILL.md')) {
    throw new Error(`Failed to download SKILL.md for '${skill.slug}' from ${repo}@${branch}`)
  }

  const bundle: SkillBundle = {
    slug: skill.slug,
    repo,
    branch,
    skillDir,
    sourceUrl: `https://github.com/${repo}/tree/${branch}${skillDir ? `/${skillDir}` : ''}`,
    files,
    skipped,
    partial: false,
  }
  cache.set(key, { at: Date.now(), bundle })
  return bundle
}
