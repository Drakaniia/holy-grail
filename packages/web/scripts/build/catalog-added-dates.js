import { execFileSync } from 'node:child_process'
import path from 'node:path'

const DAY_MS = 86_400_000

/*
  "Newly Added" filters compare `addedDaysAgo <= 7` (see src/specs/newly-added-filter-spec.md),
  and the spec defines that field as "days since the item was added, computed relative to build
  time". Site and extension metas only carry a placeholder (`addedDaysAgo: 0`), which made the
  filter match the whole catalog. The real add date is the commit that introduced the entry, so we
  resolve it from git history once per generator run.

  Precedence: meta.dateAdded (explicit ISO date) -> git add date -> meta.addedDaysAgo -> 0.
*/

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

/**
 * Map of entry slug -> ISO date the entry first landed in the repository.
 * `pathspecs` are repo-root relative content dirs; pass both the current monorepo layout and the
 * legacy pre-monorepo layout so entries added before the refactor keep their original date.
 * Pathspecs that no longer exist are harmless.
 */
export function loadCatalogAddedDates({ kind, pathspecs, cwd = process.cwd() }) {
  const dates = new Map()

  try {
    const repoRoot = runGit(['rev-parse', '--show-toplevel'], cwd).trim()
    const log = runGit(
      ['log', '--reverse', '--diff-filter=A', '--format=@@%aI', '--name-only', '--', ...pathspecs],
      repoRoot,
    )

    let committedAt = ''
    for (const rawLine of log.split('\n')) {
      const line = rawLine.trim()

      if (line.startsWith('@@')) {
        committedAt = line.slice(2)
        continue
      }

      if (!committedAt || !line.endsWith('/meta.yaml') || !line.includes(`/content/${kind}/`)) {
        continue
      }

      const slug = path.basename(path.dirname(line))
      if (slug && !dates.has(slug)) {
        dates.set(slug, committedAt)
      }
    }
  } catch (error) {
    console.warn(
      `catalog-added-dates: git history unavailable for ${kind}, using meta values (${error.message})`,
    )
  }

  return dates
}

export function resolveAddedDaysAgo(meta, slug, addedDates) {
  const fallback = Number(meta.addedDaysAgo) > 0 ? Math.floor(Number(meta.addedDaysAgo)) : 0
  const source = meta.dateAdded || addedDates.get(slug)

  if (!source) return fallback

  const addedAt = source instanceof Date ? source.getTime() : Date.parse(String(source))
  if (Number.isNaN(addedAt)) return fallback

  return Math.max(0, Math.floor((Date.now() - addedAt) / DAY_MS))
}
