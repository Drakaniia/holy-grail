// Vercel Function (Node runtime) exposing the Holy Grail MCP endpoint at
// /api/mcp (aliased to /mcp via vercel.json).
//
// The function bundles the snapshot JSON (mcp/data/*.json, produced by
// `bun run build:mcp`) and injects it through setIndexSnapshot, so no
// filesystem reads happen at runtime — cold starts only parse the bundled data.

import type { IncomingMessage, ServerResponse } from 'node:http'
import extensions from '../mcp/data/extensions-index.json'
import mcpServers from '../mcp/data/mcp-index.json'
import previews from '../mcp/data/site-previews.json'
import sites from '../mcp/data/sites-index.json'
import skills from '../mcp/data/skills-registry.json'
import { setIndexSnapshot } from '../mcp/src/data.js'
import { handleNodeRequest } from '../mcp/src/http.js'

setIndexSnapshot({ sites, extensions, mcp: mcpServers, skills, previews })

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handleNodeRequest(req, res)
}
