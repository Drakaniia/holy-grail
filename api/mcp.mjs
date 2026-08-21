// Vercel Function (Node runtime) exposing the Holy Grail MCP endpoint at
// /api/mcp (aliased to /mcp via vercel.json).
//
// Plain ESM on purpose: Vercel's function builder transpiles api/*.ts with a
// bare tsc that neither compiles the ../mcp/src dependency graph nor rewrites
// .js specifiers to .ts, and Node ESM rejects un-attributed JSON imports
// (ERR_IMPORT_ATTRIBUTE_MISSING). A .mjs entry runs as-is:
//   - JSON snapshot imports carry `with { type: 'json' }` attributes and are
//     statically traced into the lambda (no filesystem reads at runtime);
//   - server code is imported from ../mcp/dist (compiled by build:mcp), which
//     is real JS and resolves normally.
import extensions from '../mcp/data/extensions-index.json' with { type: 'json' }
import mcpServers from '../mcp/data/mcp-index.json' with { type: 'json' }
import previews from '../mcp/data/site-previews.json' with { type: 'json' }
import sites from '../mcp/data/sites-index.json' with { type: 'json' }
import skills from '../mcp/data/skills-registry.json' with { type: 'json' }
import { setIndexSnapshot } from '../mcp/dist/data.js'
import { handleNodeRequest } from '../mcp/dist/http.js'

setIndexSnapshot({ sites, extensions, mcp: mcpServers, skills, previews })

export default async function handler(req, res) {
  await handleNodeRequest(req, res)
}
