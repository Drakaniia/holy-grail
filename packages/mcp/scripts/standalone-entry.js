// Vercel function bundle entry — NOT executed directly.
//
// esbuild (via `bun run bundle` in this package) inlines this module's whole
// import graph — the MCP SDK, the compiled server (../dist), and the catalog
// snapshot JSON — into a single self-contained ESM file,
// dist/http-bundle.mjs, which packages/web/api/mcp.mjs imports.
//
// Why: when the Vercel function imported ../dist/*.js directly, @vercel/node's
// dependency trace recorded bun's per-package SDK symlink
// (packages/mcp/node_modules/@modelcontextprotocol/sdk) in the lambda's
// filePathMap. `vercel deploy --prebuilt` validates every filePathMap entry
// against the repo root at deploy time, and that symlink only exists in some
// bun install layouts — breaking deploys with
// "File does not exist: packages/mcp/node_modules/@modelcontextprotocol/sdk".
// Bundling removes every node_modules reference from the trace, so the deploy
// no longer depends on the package-manager install layout.
import extensions from '../data/extensions-index.json' with { type: 'json' }
import mcpServers from '../data/mcp-index.json' with { type: 'json' }
import previews from '../data/site-previews.json' with { type: 'json' }
import sites from '../data/sites-index.json' with { type: 'json' }
import skills from '../data/skills-registry.json' with { type: 'json' }
import { SNAPSHOT } from './data-files.mjs'
import { setIndexSnapshot } from '../dist/data.js'
import { handleNodeRequest } from '../dist/http.js'

const imported = { extensions, mcp: mcpServers, previews, sites, skills }
for (const [, fileName, key] of SNAPSHOT) {
  if (!(key in imported)) {
    throw new Error(
      `data-files.mjs expects ${fileName} as "${key}", but this entry does not import it`,
    )
  }
}

setIndexSnapshot(imported)

export { handleNodeRequest }
