// Copies the current generated catalog indexes into mcp/data/ so the published
// npm package ships a bundled snapshot (loader fallback path). Repo/dev mode and
// HOLY_GRAIL_DATA_DIR always read live generated indexes instead.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const outDir = resolve(__dirname, '../data')

const sources = [
  ['src/content/sites-index.json', 'sites-index.json'],
  ['src/content/extensions-index.json', 'extensions-index.json'],
  ['src/content/mcp-index.json', 'mcp-index.json'],
  ['src/content/site-previews.json', 'site-previews.json'],
  ['public/content/skills-registry.json', 'skills-registry.json'],
]

mkdirSync(outDir, { recursive: true })
let copied = 0
for (const [rel, name] of sources) {
  const from = resolve(repoRoot, rel)
  if (!existsSync(from)) {
    console.error(`SKIP ${rel}: not found`)
    continue
  }
  copyFileSync(from, resolve(outDir, name))
  copied++
  console.log(`copied ${rel} -> data/${name}`)
}
console.log(`Snapshot: ${copied}/${sources.length} files copied to mcp/data`)
