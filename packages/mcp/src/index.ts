#!/usr/bin/env node
// Holy Grail MCP server entry. Defaults to stdio; TRANSPORT=http or --http
// serves streamable HTTP on PORT (default 3000).

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { serveHttp } from './http.js'
import { createServer } from './server.js'

const useHttp = process.env.TRANSPORT === 'http' || process.argv.includes('--http')

if (useHttp) {
  const port = Number(process.env.PORT ?? 3000)
  await serveHttp(port, process.env.HOST ?? '127.0.0.1')
} else {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('holy-grail-mcp-server running via stdio (TRANSPORT=http for streamable HTTP)')
}
