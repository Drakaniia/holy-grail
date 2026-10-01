// Scans src/content/mcp/*/meta.yaml and writes public/content/mcp-index.json,
// the only copy — the SPA fetches it over HTTP.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = resolve(__dirname, '../../src/content/mcp')
const outputPath = resolve(__dirname, '../../public/content/mcp-index.json')

if (!existsSync(contentDir)) {
  writeFileSync(outputPath, '[]')
  process.exit(0)
}

const servers = []

for (const catDir of readdirSync(contentDir, { withFileTypes: true }).filter((d) =>
  d.isDirectory(),
)) {
  const catPath = resolve(contentDir, catDir.name)
  for (const entry of readdirSync(catPath, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  )) {
    const metaPath = resolve(catPath, entry.name, 'meta.yaml')
    if (existsSync(metaPath)) {
      servers.push(parse(readFileSync(metaPath, 'utf-8')))
    }
  }
}

const json = JSON.stringify(servers, null, 2)
writeFileSync(outputPath, json)
console.log(`MCP index: ${servers.length} servers written`)
