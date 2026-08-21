// Eval runner: spawns the built server over stdio, answers each question in
// evals/questions.xml deterministically using the server's tools, and compares
// against the expected answer. Exits non-zero on any mismatch.
//
// Run: bun mcp/evals/run-evals.ts   (requires `bun run build:mcp` first)

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const here = dirname(fileURLToPath(import.meta.url))
const serverPath = resolve(here, '../dist/index.js')

interface QaPair {
  id: string
  question: string
  answer: string
}

function parseQuestions(xml: string): QaPair[] {
  const pairs: QaPair[] = []
  const re =
    /<qa_pair>\s*<id>([\s\S]*?)<\/id>\s*<question>([\s\S]*?)<\/question>\s*<answer>([\s\S]*?)<\/answer>\s*<\/qa_pair>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    pairs.push({ id: match[1].trim(), question: match[2].trim(), answer: match[3].trim() })
  }
  return pairs
}

/** Reads a key from a tool's structuredContent (our own contract — shapes are defined by our tools). */
function pick(payload: unknown, key: string): unknown {
  if (payload !== null && typeof payload === 'object' && key in payload) {
    return (payload as Record<string, unknown>)[key]
  }
  return undefined
}

type Resolver = (client: Client) => Promise<string>

const resolvers: Record<string, Resolver> = {
  '1-browser-testing-mcp': async (client) => {
    const r = await client.callTool({
      name: 'search',
      arguments: { query: 'browser automation', limit: 5 },
    })
    const results = pick(r.structuredContent, 'results')
    const list = Array.isArray(results) ? (results as unknown[]) : []
    const hit = list.find((item) => pick(item, 'kind') === 'mcp')
    return String(pick(hit, 'slug') ?? '')
  },
  '2-supabase-sql': async (client) => {
    const r = await client.callTool({
      name: 'search',
      arguments: { query: 'supabase mcp', limit: 5 },
    })
    const results = pick(r.structuredContent, 'results')
    const list = Array.isArray(results) ? (results as unknown[]) : []
    const hit = list.find((item) => pick(item, 'kind') === 'mcp')
    return String(pick(hit, 'slug') ?? '')
  },
  '3-bsd-backend-site': async (client) => {
    const listed = await client.callTool({
      name: 'list_sites',
      arguments: { category: 'Backend', limit: 100 },
    })
    const items = pick(listed.structuredContent, 'items')
    if (!Array.isArray(items)) return ''
    for (const item of items as unknown[]) {
      const slug = pick(item, 'slug')
      if (typeof slug !== 'string') continue
      const detail = await client.callTool({ name: 'get_site', arguments: { slug } })
      if (pick(detail.structuredContent, 'license') === 'BSD-3-Clause') return slug
    }
    return ''
  },
  '4-markdown-extension': async (client) => {
    const r = await client.callTool({
      name: 'search',
      arguments: { query: 'markdown webpage', limit: 5 },
    })
    const results = pick(r.structuredContent, 'results')
    const list = Array.isArray(results) ? (results as unknown[]) : []
    const hit = list.find((item) => pick(item, 'kind') === 'extension')
    return String(pick(hit, 'slug') ?? '')
  },
  '5-drakaniia-skill-count': async (client) => {
    let count = 0
    for (let offset = 0; offset < 400; offset += 100) {
      const listed = await client.callTool({
        name: 'list_skills',
        arguments: { limit: 100, offset },
      })
      const items = pick(listed.structuredContent, 'items')
      if (!Array.isArray(items) || items.length === 0) break
      for (const item of items as unknown[]) {
        const slug = pick(item, 'slug')
        if (typeof slug !== 'string') continue
        const detail = await client.callTool({ name: 'get_skill', arguments: { slug } })
        if (pick(detail.structuredContent, 'authorName') === 'Drakaniia') count += 1
      }
      if (pick(listed.structuredContent, 'has_more') !== true) break
    }
    return String(count)
  },
  '6-ai-site-count': async (client) => {
    const r = await client.callTool({
      name: 'list_sites',
      arguments: { parentCategory: 'ai', limit: 1 },
    })
    return String(pick(r.structuredContent, 'total') ?? '')
  },
  '7-skill-install-command': async (client) => {
    const r = await client.callTool({ name: 'get_skill', arguments: { slug: 'audit-codebase' } })
    return String(pick(r.structuredContent, 'installHint') ?? '')
  },
  '8-top-deployment-site': async (client) => {
    const listed = await client.callTool({
      name: 'list_sites',
      arguments: { category: 'Deployment', limit: 100 },
    })
    const items = pick(listed.structuredContent, 'items')
    if (!Array.isArray(items)) return ''
    let best = ''
    let bestStars = -1
    for (const item of items as unknown[]) {
      const stars = pick(item, 'stars')
      if (typeof stars === 'number' && stars > bestStars) {
        bestStars = stars
        best = String(pick(item, 'slug') ?? '')
      }
    }
    return best
  },
  '9-efficient-blocker': async (client) => {
    const r = await client.callTool({
      name: 'search',
      arguments: { query: 'efficient blocker', limit: 5 },
    })
    const results = pick(r.structuredContent, 'results')
    const list = Array.isArray(results) ? (results as unknown[]) : []
    const hit = list.find((item) => pick(item, 'kind') === 'extension')
    return String(pick(hit, 'slug') ?? '')
  },
  '10-most-extensions-parent': async (client) => {
    const r = await client.callTool({ name: 'get_stats', arguments: {} })
    const byParent = pick(r.structuredContent, 'byParentCategory')
    if (byParent === null || typeof byParent !== 'object') return ''
    let best = ''
    let bestCount = -1
    for (const [parent, counts] of Object.entries(byParent as Record<string, unknown>)) {
      const extCount = pick(counts, 'extensions')
      if (typeof extCount === 'number' && extCount > bestCount) {
        bestCount = extCount
        best = parent
      }
    }
    return best
  },
}

async function main(): Promise<void> {
  const pairs = parseQuestions(readFileSync(resolve(here, 'questions.xml'), 'utf-8'))
  if (pairs.length !== 10) {
    console.error(`Expected 10 QA pairs, found ${pairs.length}`)
    process.exit(2)
  }

  const transport = new StdioClientTransport({
    command: 'bun',
    args: [serverPath],
    stderr: 'pipe',
  })
  const client = new Client({ name: 'holy-grail-evals', version: '1.0.0' })
  await client.connect(transport)

  let passed = 0
  for (const pair of pairs) {
    const resolver = resolvers[pair.id]
    if (!resolver) {
      console.error(`No resolver for question '${pair.id}'`)
      process.exit(2)
    }
    try {
      const actual = await resolver(client)
      const ok = actual.trim() === pair.answer.trim()
      if (ok) passed += 1
      console.log(`${ok ? 'PASS' : 'FAIL'} [${pair.id}] ${pair.question}`)
      console.log(`      expected: ${pair.answer} | actual: ${actual}`)
    } catch (error) {
      console.error(`ERROR [${pair.id}] ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  await client.close()

  console.log(`\nEvals: ${passed}/${pairs.length} passed`)
  if (passed !== pairs.length) process.exit(1)
}

await main()
