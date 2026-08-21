// get_mcp_server + list_mcp_servers tools.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT } from '../constants.js'
import { loadMcpServers } from '../data.js'
import { formatMcpServer, formatMcpServerList } from '../format.js'
import { buildResponse, notFound } from './common.js'

const GetMcpServerInputSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .describe(
        'MCP server slug, e.g. "playwright-mcp". Find valid slugs via search or list_mcp_servers',
      ),
  })
  .strict()

const ListMcpServersInputSchema = z
  .object({
    category: z
      .string()
      .optional()
      .describe('Filter by exact category, e.g. "Browser Automation" or "Database"'),
    transport: z
      .string()
      .optional()
      .describe("Filter by transport: 'stdio', 'http', or 'websocket'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(LIST_MAX_LIMIT)
      .default(LIST_DEFAULT_LIMIT)
      .describe(`Maximum results to return, 1-${LIST_MAX_LIMIT} (default: ${LIST_DEFAULT_LIMIT})`),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe('Number of results to skip for pagination (default: 0)'),
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
  })
  .strict()

export function registerMcpTools(server: SdkMcpServer): void {
  server.registerTool(
    'get_mcp_server',
    {
      title: 'Get MCP Server Details',
      description: `Fetch the full catalog record for one MCP server, including its tools, connections, transport, and install command.

Args:
  - slug (string): MCP server slug, e.g. "playwright-mcp"

Returns:
  Full MCP server record (JSON) — slug, name, description, category, parentCategory, icon, verified, featured, tags, website, docs, sourceCode, installCommand, transport, tools [{ name, description }], connections

Examples:
  - "What tools does the Supabase MCP server expose?" -> slug="supabase-mcp"
  - Don't use for finding slugs — use search or list_mcp_servers first.

Error Handling:
  - "No MCP server with slug 'X'. Use search or list_mcp_servers to find valid slugs."`,
      inputSchema: GetMcpServerInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const server = loadMcpServers().find((m) => m.slug === params.slug)
      if (!server) return notFound('MCP server', params.slug)
      return buildResponse('markdown', formatMcpServer(server), server)
    },
  )

  server.registerTool(
    'list_mcp_servers',
    {
      title: 'List MCP Servers',
      description: `List catalog MCP servers with optional category/transport filters, sorted by name. Paged with offset. Each item includes the server's tool count.

Args:
  - category (string, optional): Filter by exact category, e.g. "Browser Automation"
  - transport (string, optional): Filter by transport: 'stdio', 'http', or 'websocket'
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset": number|null, "items": [{ "slug", "name", "category", "transport", "tools_count" }] }

Examples:
  - "Which MCP servers speak HTTP?" -> transport="http"
  - "List all database MCP servers" -> category="Database"
  - Use get_mcp_server for the full tool list and install command.`,
      inputSchema: ListMcpServersInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const lowerCategory = params.category?.toLowerCase()
      const lowerTransport = params.transport?.toLowerCase()
      let servers = loadMcpServers()
      if (lowerCategory) {
        servers = servers.filter((m) => m.category.toLowerCase() === lowerCategory)
      }
      if (lowerTransport) {
        servers = servers.filter((m) => m.transport.toLowerCase() === lowerTransport)
      }
      const sorted = [...servers].sort((a, b) => a.name.localeCompare(b.name))
      const page = sorted.slice(params.offset, params.offset + params.limit)
      const meta = {
        total: sorted.length,
        count: page.length,
        offset: params.offset,
        has_more: sorted.length > params.offset + page.length,
        next_offset:
          sorted.length > params.offset + page.length ? params.offset + page.length : null,
      }
      const items = page.map((m) => ({
        slug: m.slug,
        name: m.name,
        category: m.category,
        transport: m.transport,
        tools_count: m.tools.length,
      }))
      const payload = { ...meta, items }
      const markdown = formatMcpServerList(page, meta, {
        category: params.category,
        transport: params.transport,
      })
      return buildResponse(params.response_format, markdown, payload)
    },
  )
}
