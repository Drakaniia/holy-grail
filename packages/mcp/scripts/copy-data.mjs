// Copies the current generated catalog indexes into mcp/data/ so the published
// npm package ships a bundled snapshot (loader fallback path). Repo/dev mode and
// HOLY_GRAIL_DATA_DIR always read live generated indexes instead.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SNAPSHOT } from './data-files.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../web')
const outDir = resolve(__dirname, '../data')

mkdirSync(outDir, { recursive: true })
let copied = 0
for (const [rel, name] of SNAPSHOT) {
  const from = resolve(repoRoot, rel)
  if (!existsSync(from)) {
    console.error(`SKIP ${rel}: not found`)
    continue
  }
  copyFileSync(from, resolve(outDir, name))
  copied++
  console.log(`copied ${rel} -> data/${name}`)
}
console.log(`Snapshot: ${copied}/${SNAPSHOT.length} files copied to mcp/data`)
