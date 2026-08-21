// search tool — cross-entity catalog search (sites, extensions, MCP servers,
// skills) using the same scoring the SPA's useSmartSearch produces.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  SEARCH_DEFAULT_LIMIT,
  SEARCH_MAX_LIMIT,
} from '../constants.js'
import { formatSearchResults } from '../format.js'
import { searchCatalog } from '../search.js'
import { buildResponse } from './common.js'

export const SearchInputSchema = z
  .object({
    query: z
      .string()
      .min(MIN_QUERY_LENGTH, `Query must be at least ${MIN_QUERY_LENGTH} characters`)
      .max(MAX_QUERY_LENGTH, `Query must not exceed ${MAX_QUERY_LENGTH} characters`)
      .describe('Search string matched against name, description, tags, category, and website'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(SEARCH_MAX_LIMIT)
      .default(SEARCH_DEFAULT_LIMIT)
      .describe(
        `Maximum results to return, 1-${SEARCH_MAX_LIMIT} (default: ${SEARCH_DEFAULT_LIMIT})`,
      ),
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

export function registerSearchTool(server: SdkMcpServer): void {
  server.registerTool(
    'search',
    {
      title: 'Search Holy Grail Catalog',
      description: `Search the Holy Grail catalog across sites, Chrome extensions, MCP servers, and skills.

Matches against name, description, tags, category, and website using the same scoring as the holygrail.dev SPA. Results are ranked by relevance, then popularity.

Args:
  - query (string): Search string, 2-200 characters. Examples: "browser automation", "postgres database", "ad blocker"
  - limit (number): Maximum results to return, 1-50 (default: 10)
  - offset (number): Results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "results": [{ "kind": "site"|"extension"|"mcp"|"skill", "slug": string, "name": string, "description": string, "score": number, "matchStrength": "Direct"|"Close"|"Nearest", "route": string }],
    "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset": number|null
  }

Examples:
  - "Which MCP server automates browser testing?" -> query="browser automation" (top result: playwright-mcp)
  - "Find a backend platform" -> query="backend platform" (top result: appwrite)
  - Don't use for fetching full records — use get_site / get_mcp_server / get_skill / get_extension instead.`,
      inputSchema: SearchInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const page = searchCatalog(params.query, params.limit, params.offset)
      const payload = {
        results: page.results,
        total: page.total,
        count: page.count,
        offset: page.offset,
        has_more: page.has_more,
        next_offset: page.next_offset,
      }
      const markdown = formatSearchResults(params.query, page)
      return buildResponse(params.response_format, markdown, payload)
    },
  )
}
