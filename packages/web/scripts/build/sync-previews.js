import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const submoduleDir = path.join(projectRoot, 'public/previews')
const submodulePath = path.relative(projectRoot, submoduleDir).split(path.sep).join('/')

// When invoked from a git hook, GIT_DIR/GIT_WORK_TREE point at the parent repo.
// Unset them so each call resolves its repo from `cwd` (the submodule worktree or
// the project root), not from the environment of the caller.
const gitEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/^GIT_(DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|PREFIX|COMMON_DIR|CEILING_DIRECTORIES)$/.test(
        key,
      ),
  ),
)

function runGit(args, cwd, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8' }).trim()
  } catch (error) {
    if (allowFail) return ''
    const stderr = error.stderr?.toString().trim() || error.message
    throw new Error(`git ${args.join(' ')} failed:\n${stderr}`, { cause: error })
  }
}

function isSubmoduleInitialized() {
  // An initialized submodule has a .git file (or .git dir) inside its worktree.
  return fs.existsSync(path.join(submoduleDir, '.git'))
}

function countChanges(porcelainLines) {
  let added = 0
  let changed = 0
  let removed = 0

  for (const line of porcelainLines) {
    const code = line[0]
    if (code === 'A' || code === '?') added += 1
    else if (code === 'D') removed += 1
    else changed += 1
  }

  return { added, changed, removed }
}

function syncPreviews() {
  if (!isSubmoduleInitialized()) {
    console.log(
      `previews: submodule not initialized (run \`bun run setup\` to fetch ${submodulePath}) — skipping sync`,
    )
    return 0
  }

  const statusOutput = runGit(['status', '--porcelain'], submoduleDir)
  if (!statusOutput) {
    console.log('previews: no changes')
    return 0
  }

  const beforeSha = runGit(['rev-parse', 'HEAD'], submoduleDir)
  const porcelainLines = statusOutput.split('\n').filter(Boolean)
  const { added, changed, removed } = countChanges(porcelainLines)

  const messageParts = []
  if (added > 0) messageParts.push(`${added} added`)
  if (changed > 0) messageParts.push(`${changed} changed`)
  if (removed > 0) messageParts.push(`${removed} removed`)
  const message = `chore: update previews (${messageParts.join(', ')})`

  runGit(['add', '-A'], submoduleDir)
  runGit(['commit', '-m', message], submoduleDir)
  runGit(['push', 'origin', 'HEAD'], submoduleDir)

  // Stage the updated gitlink in the parent so this commit records the new SHA.
  runGit(['add', submodulePath], projectRoot)

  const afterSha = runGit(['rev-parse', 'HEAD'], submoduleDir)
  console.log(`previews: committed and pushed ${beforeSha} → ${afterSha} (${submodulePath})`)
  return 0
}

try {
  process.exit(syncPreviews())
} catch (error) {
  console.error(`previews: sync failed — ${error.message}`)
  process.exit(1)
}
