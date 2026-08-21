// Verifies a deployed Holy Grail MCP endpoint behaves like a real MCP server.
// Used by CI (deploy-mcp.yml) after `vercel deploy --prebuilt`.
//
// Usage: bun mcp/scripts/verify-remote.mjs <base-url>
// Exit codes: 0 = verified (or protected preview, see below), 1 = broken,
//             2 = usage error.
//
// Deployment protection (Vercel Authentication) intercepts generated URLs with
// 401 before routing; a protected response means the deployment exists but is
// not publicly probeable — exit 0 with a note so PR previews don't fail on
// protection. Any other non-JSON-RPC response (405/404 SPA fallback, etc.)
// means the function is missing and fails the check.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const url = process.argv[2]
if (!url) {
  console.error('Usage: bun verify-remote.mjs <base-url>')
  process.exit(2)
}

function fail(message) {
  console.error(`FAIL ${url}: ${message}`)
  process.exit(1)
}

// 1. Raw POST — detects protection vs. missing-function responses.
let raw
try {
  raw = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  })
} catch (error) {
  fail(`unreachable: ${error.message}`)
}

const rawText = await raw.text()
if (raw.status === 401 && rawText.includes('Protected deployment')) {
  console.log(
    `SKIP ${url}: deployment is protected (Vercel Authentication) — not publicly probeable`,
  )
  process.exit(0)
}
if (raw.status !== 200) {
  fail(`POST tools/list → HTTP ${raw.status} (${rawText.slice(0, 120)}) — function not served`)
}
let json
try {
  json = JSON.parse(rawText)
} catch {
  fail(`non-JSON response (${rawText.slice(0, 120)}) — SPA fallback serving this route`)
}
const rawTools = json?.result?.tools ?? []
if (rawTools.length !== 10) {
  fail(`tools/list returned ${rawTools.length} tools (expected 10)`)
}

// 2. Full battery through the official SDK client (initialize handshake).
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { accept: 'application/json, text/event-stream' } },
})
const client = new Client({ name: 'ci-verify-remote', version: '1.0.0' })
await client.connect(transport)

const tools = await client.listTools()
if (tools.tools.length !== 10) fail(`SDK tools/list → ${tools.tools.length} (expected 10)`)

const search = await client.callTool({
  name: 'search',
  arguments: { query: 'browser automation', limit: 1 },
})
const top1 = search.structuredContent?.results?.[0]?.slug
if (top1 !== 'playwright-mcp') fail(`search top-1 → ${String(top1)} (expected playwright-mcp)`)

const stats = await client.callTool({ name: 'get_stats', arguments: {} })
const counts = stats.structuredContent?.counts
if (!counts || counts.mcp < 1 || counts.sites < 1) fail(`get_stats → ${JSON.stringify(counts)}`)

const resources = await client.listResources()
if (!resources.resources?.length) fail('resources/list returned nothing')

await client.close()
console.log(
  `OK ${url}: 10 tools, search top-1 playwright-mcp, stats ${JSON.stringify(counts)}, ${resources.resources.length} resources`,
)
