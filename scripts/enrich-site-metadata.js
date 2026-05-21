import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import yaml from 'js-yaml'

const sitesDir = path.resolve('src/content/sites')
const applyChanges = process.argv.includes('--apply')
const useSearch = process.argv.includes('--search-github')
const onlyNew = !process.argv.includes('--all')
const currentYear = new Date().getUTCFullYear()
const yearStart = `${currentYear}-01-01T00:00:00Z`
const concurrency = Number(process.env.ENRICH_CONCURRENCY || (useSearch ? 2 : 8))

function readOption(name) {
  const inline = process.argv.find(arg => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)

  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : ''
}

const parentFilter = readOption('--parent')
const subcategoryFilter = readOption('--subcategory')

const ignoredOwners = new Set([
  'about',
  'apps',
  'blog',
  'collections',
  'contact',
  'enterprise',
  'explore',
  'features',
  'github',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'pricing',
  'search',
  'settings',
  'signup',
  'sponsors',
  'topics',
])

const ignoredRepos = new Set([
  'actions',
  'discussions',
  'graphs',
  'issues',
  'network',
  'packages',
  'projects',
  'pulls',
  'releases',
  'security',
  'sponsors',
  'stargazers',
  'watchers',
])

const repoOverrides = new Map([
  ['activepieces', 'activepieces/activepieces'],
  ['bolt', 'stackblitz/bolt.new'],
  ['coolify', 'coollabsio/coolify'],
  ['tailgrids', 'TailGrids/tailgrids'],
  ['tbench', 'harbor-framework/terminal-bench'],
  ['tweakcn', 'jnsahaj/tweakcn'],
  ['uiball', 'GriffinJohnston/ldrs'],
])

const noRepoOverrides = new Set([
  'cerebras',
])

function getGithubToken() {
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const githubToken = getGithubToken()

function walkMetaFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMetaFiles(fullPath))
    } else if (entry.name === 'meta.yaml') {
      files.push(fullPath)
    }
  }
  return files
}

function cleanRepoName(value) {
  return value.replace(/\.git$/i, '').replace(/[^a-zA-Z0-9._-].*$/, '')
}

function parseGithubRepoUrl(url) {
  try {
    const parsed = new URL(url.replace(/&amp;/g, '&'))
    if (parsed.hostname.toLowerCase() !== 'github.com') return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = cleanRepoName(parts[1])
    if (!owner || !repo) return null
    if (ignoredOwners.has(owner.toLowerCase()) || ignoredRepos.has(repo.toLowerCase())) return null
    if (repo.startsWith('.')) return null

    return `${owner}/${repo}`
  } catch {
    return null
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function domainBase(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    const labels = hostname.split('.')
    return labels.length > 1 ? labels[labels.length - 2] : labels[0]
  } catch {
    return ''
  }
}

function scoreCandidate(repo, meta) {
  const [owner, name] = repo.toLowerCase().split('/')
  const repoName = name.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const slug = normalizeText(meta.slug).replace(/\s+/g, '-')
  const repoCompact = repoName.replace(/-/g, '')
  const slugCompact = slug.replace(/-/g, '')
  const siteName = normalizeText(meta.name)
  const base = domainBase(meta.website)
  const baseCompact = base.replace(/-/g, '')
  let score = 0

  if (slug && (repoName === slug || repoName.includes(slug) || slug.includes(repoName))) score += 10
  if (slugCompact && (repoCompact === slugCompact || repoCompact.includes(slugCompact))) score += 10
  if (base && (repoName === base || repoName.includes(base))) score += 8
  if (baseCompact && (repoCompact === baseCompact || repoCompact.includes(baseCompact))) score += 8
  if (base && owner === base && repoName === base) score += 4

  const genericTokens = new Set([
    'app',
    'apps',
    'best',
    'build',
    'builder',
    'cloud',
    'code',
    'create',
    'design',
    'developer',
    'free',
    'home',
    'platform',
    'tools',
    'website',
  ])

  for (const token of siteName.split(/\s+/).filter(t => t.length > 3 && !genericTokens.has(t))) {
    if (owner.includes(token) || repoName.includes(token)) score += 1
  }

  if (name === `${owner}.github.io`) score -= 2
  return score
}

async function fetchText(url) {
  if (!url) return ''
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 holy-grail-metadata-enricher',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!response.ok) return ''
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return ''
    const text = await response.text()
    return text.slice(0, 750000)
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

function extractGithubRepos(html) {
  const repos = []
  const seen = new Set()
  const pattern = /https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?(?:[/?#[^\s"'<>)]*)?/gi
  for (const match of html.matchAll(pattern)) {
    const repo = parseGithubRepoUrl(match[0])
    if (repo && !seen.has(repo.toLowerCase())) {
      seen.add(repo.toLowerCase())
      repos.push(repo)
    }
  }
  return repos
}

async function discoverRepoFromPages(meta) {
  const pages = Array.from(new Set([meta.website, meta.docs].filter(Boolean)))
  const candidates = []

  for (const page of pages) {
    const html = await fetchText(page)
    candidates.push(...extractGithubRepos(html))
  }

  if (!candidates.length) return null

  const ranked = candidates
    .map(repo => ({ repo, score: scoreCandidate(repo, meta) }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.score >= 4 ? ranked[0].repo : null
}

function githubHeaders() {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'holy-grail-metadata-enricher',
    'x-github-api-version': '2022-11-28',
  }
  if (githubToken) headers.authorization = `Bearer ${githubToken}`
  return headers
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`)
  }
  return response.json()
}

function countFromLinkHeader(linkHeader, currentLength) {
  if (!linkHeader) return currentLength
  const last = linkHeader
    .split(',')
    .map(part => part.trim())
    .find(part => part.includes('rel="last"'))
  if (!last) return currentLength
  const match = last.match(/[?&]page=(\d+)/)
  return match ? Number(match[1]) : currentLength
}

async function githubCount(url) {
  const response = await fetch(url, { headers: githubHeaders() })
  if (response.status === 404 || response.status === 409) return 0
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`)
  }
  const rows = await response.json()
  return countFromLinkHeader(response.headers.get('link'), Array.isArray(rows) ? rows.length : 0)
}

async function searchGithubRepo(meta) {
  if (!useSearch) return null

  const base = domainBase(meta.website)
  const name = normalizeText(meta.name)
    .split(/\s+/)
    .filter(token => token.length > 2)
    .slice(0, 4)
    .join(' ')
  const query = encodeURIComponent(`${base || meta.slug} ${name} in:name,description`)
  const data = await githubJson(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=5`)
  const items = data?.items || []
  if (!items.length) return null

  const ranked = items
    .map(item => ({ repo: item.full_name, score: scoreCandidate(item.full_name, meta), stars: item.stargazers_count || 0 }))
    .sort((a, b) => b.score - a.score || b.stars - a.stars)

  return ranked[0]?.score >= 4 ? ranked[0].repo : null
}

async function getRepoStats(fullName) {
  const repo = await githubJson(`https://api.github.com/repos/${fullName}`)
  if (!repo || repo.fork) return null

  const encoded = `${repo.owner.login}/${repo.name}`
  const latestRelease = await githubJson(`https://api.github.com/repos/${encoded}/releases/latest`)
  const releases = await githubCount(`https://api.github.com/repos/${encoded}/releases?per_page=1`)
  const contributors = await githubCount(`https://api.github.com/repos/${encoded}/contributors?anon=1&per_page=1`)
  const commitsThisYear = await githubCount(
    `https://api.github.com/repos/${encoded}/commits?since=${encodeURIComponent(yearStart)}&per_page=1`
  )

  return {
    sourceCode: repo.html_url,
    stars: repo.stargazers_count || 0,
    watchers: repo.subscribers_count || 0,
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : 'Unknown',
    lastCommit: repo.pushed_at ? relativeDate(repo.pushed_at) : 'Unknown',
    lastRelease: latestRelease?.published_at ? relativeDate(latestRelease.published_at) : 'No releases',
    version: latestRelease?.tag_name || '',
    contributors,
    commitsThisYear,
    releases,
  }
}

function relativeDate(value) {
  const then = new Date(value)
  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - then.getTime())
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years} year${years === 1 ? '' : 's'} ago`
  if (months > 0) return `${months} month${months === 1 ? '' : 's'} ago`
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  return 'just now'
}

function orderedMeta(meta, stats) {
  return {
    slug: meta.slug || '',
    name: meta.name || '',
    description: meta.description || '',
    category: meta.category || 'Uncategorized',
    parentCategory: meta.parentCategory || '',
    subcategory: meta.subcategory ?? null,
    stars: stats?.stars ?? meta.stars ?? 0,
    watchers: stats?.watchers ?? meta.watchers ?? 0,
    addedDaysAgo: meta.addedDaysAgo ?? 0,
    license: stats?.license ?? (meta.license === 'Bookmark' ? 'Proprietary' : meta.license || 'Unknown'),
    lastCommit: stats?.lastCommit ?? (meta.lastCommit?.startsWith('Imported ') ? 'N/A' : meta.lastCommit || 'N/A'),
    lastRelease: stats?.lastRelease ?? (meta.lastRelease === 'Bookmark' ? 'N/A' : meta.lastRelease || 'N/A'),
    version: stats?.version ?? meta.version ?? '',
    contributors: stats?.contributors ?? meta.contributors ?? 0,
    commitsThisYear: stats?.commitsThisYear ?? meta.commitsThisYear ?? 0,
    releases: stats?.releases ?? meta.releases ?? 0,
    platforms: meta.platforms || ['Web'],
    deployment: meta.deployment || ['Cloud'],
    website: meta.website || '',
    docs: meta.docs || meta.website || '',
    sourceCode: stats?.sourceCode ?? meta.sourceCode ?? '',
    icon: meta.icon || meta.slug || '',
    verified: Boolean(stats?.sourceCode || meta.verified),
    featured: Boolean(meta.featured),
    tags: meta.tags || [],
    atGlance: meta.atGlance || '',
    fullDescription: meta.fullDescription || '',
    ...(meta.coreFeatures ? { coreFeatures: meta.coreFeatures } : {}),
    ...(meta.additionalFeatures ? { additionalFeatures: meta.additionalFeatures } : {}),
    ...(meta.deployCompose ? { deployCompose: meta.deployCompose } : {}),
    ...(meta.similarTools ? { similarTools: meta.similarTools } : {}),
  }
}

async function main() {
  const metaFiles = walkMetaFiles(sitesDir)
  const rows = metaFiles
    .map(filePath => ({
      filePath,
      meta: yaml.load(fs.readFileSync(filePath, 'utf8')) || {},
    }))
    .filter(row => !onlyNew || row.meta.addedDaysAgo === 0)
    .filter(row => !parentFilter || row.meta.parentCategory === parentFilter)
    .filter(row => !subcategoryFilter || (row.meta.subcategory || '') === subcategoryFilter)

  let found = 0
  let updated = 0
  let skipped = 0
  const failures = []

  async function processRow(row, index) {
    const label = `${index + 1}/${rows.length} ${row.meta.slug || path.basename(path.dirname(row.filePath))}`

    try {
      const slug = row.meta.slug || path.basename(path.dirname(row.filePath))
      const existing = parseGithubRepoUrl(row.meta.sourceCode || '')
      const discovered = noRepoOverrides.has(slug)
        ? null
        : repoOverrides.get(slug) || existing || (await discoverRepoFromPages(row.meta)) || (await searchGithubRepo(row.meta))
      let stats = null

      if (discovered) {
        stats = await getRepoStats(discovered)
        if (stats) found += 1
      }

      const nextMeta = orderedMeta(row.meta, stats)
      const before = fs.readFileSync(row.filePath, 'utf8')
      const after = yaml.dump(nextMeta, {
        lineWidth: 100,
        noRefs: true,
        quotingType: '"',
        sortKeys: false,
      })

      if (before !== after) {
        updated += 1
        if (applyChanges) fs.writeFileSync(row.filePath, after)
      } else {
        skipped += 1
      }

      const repoNote = stats?.sourceCode ? ` -> ${stats.sourceCode}` : ' -> no public GitHub repo found'
      console.log(`${label}${repoNote}`)
    } catch (error) {
      failures.push(`${label}: ${error.message}`)
      console.log(`${label} -> failed: ${error.message}`)
    }
  }

  for (let offset = 0; offset < rows.length; offset += concurrency) {
    const batch = rows.slice(offset, offset + concurrency)
    await Promise.all(batch.map((row, batchIndex) => processRow(row, offset + batchIndex)))
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? 'apply' : 'dry-run',
        scanned: rows.length,
        reposFound: found,
        filesChanged: updated,
        unchanged: skipped,
        failures: failures.length,
      },
      null,
      2
    )
  )

  if (failures.length) {
    console.log('Failures:')
    for (const failure of failures) console.log(`- ${failure}`)
  }
}

main()
