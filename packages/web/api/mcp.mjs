// Vercel Function (Node runtime) exposing the Holy Grail MCP endpoint at
// /api/mcp (aliased to /mcp via vercel.json).
//
// Delegates to the self-contained bundle built by `bun run build:mcp`
// (packages/mcp/dist/http-bundle.mjs): esbuild inlines the MCP SDK, the
// compiled server, and the catalog snapshot JSON into one module, so the
// function trace contains no node_modules paths.
//
// A plain import of ../../mcp/dist/*.js used to make the trace record bun's
// per-package SDK symlink (packages/mcp/node_modules/@modelcontextprotocol/sdk)
// in the lambda's filePathMap. `vercel deploy --prebuilt` validates every
// filePathMap entry against the repo root at deploy time, and that symlink
// only exists in some bun install layouts — breaking deploys with
// "File does not exist: ...". Bundling removes that dependency entirely.
import { handleNodeRequest } from '../../mcp/dist/http-bundle.mjs'

export default async function handler(req, res) {
  await handleNodeRequest(req, res)
}
