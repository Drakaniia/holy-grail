// get_extension + list_extensions tools.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT } from '../constants.js'
import { loadExtensions } from '../data.js'
import { formatExtension, formatExtensionList } from '../format.js'
import { buildResponse, notFound } from './common.js'

const GetExtensionInputSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .describe(
        'Extension slug, e.g. "ublock-origin". Find valid slugs via search or list_extensions',
      ),
  })
  .strict()

const ListExtensionsInputSchema = z
  .object({
    parentCategory: z
      .string()
      .optional()
      .describe('Filter by parent category (lowercase), e.g. "developer-tools" or "privacy"'),
    category: z.string().optional().describe('Filter by exact category, e.g. "Chrome Extensions"'),
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

export function registerExtensionTools(server: SdkMcpServer): void {
  server.registerTool(
    'get_extension',
    {
      title: 'Get Extension Details',
      description: `Fetch the full catalog record for one Chrome extension, including license, version, tags, features, and store links.

Args:
  - slug (string): Extension slug, e.g. "ublock-origin"

Returns:
  Full extension record (JSON) — slug, name, description, category, parentCategory, version, license, website, docs, sourceCode, tags, verified, featured, atGlance, fullDescription, coreFeatures, additionalFeatures, chromeWebStoreId, permissions, manifestVersion

Examples:
  - "Tell me about the GoFullPage extension" -> slug="gofullpage"
  - Don't use for finding slugs — use search or list_extensions first.

Error Handling:
  - "No extension with slug 'X'. Use search or list_extensions to find valid slugs."`,
      inputSchema: GetExtensionInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const extension = loadExtensions().find((e) => e.slug === params.slug)
      if (!extension) return notFound('extension', params.slug)
      return buildResponse('markdown', formatExtension(extension), extension)
    },
  )

  server.registerTool(
    'list_extensions',
    {
      title: 'List Chrome Extensions',
      description: `List catalog Chrome extensions with optional category filters, sorted by name. Paged with offset.

Args:
  - parentCategory (string, optional): Filter by parent category, e.g. "developer-tools" or "privacy"
  - category (string, optional): Filter by exact category, e.g. "Chrome Extensions"
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset": number|null, "items": [{ "slug", "name", "category" }] }

Examples:
  - "List ad blocker extensions" -> search query="ad blocker" or list and inspect
  - "What extensions are for developers?" -> parentCategory="developer-tools"
  - Use get_extension for full record details.`,
      inputSchema: ListExtensionsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const lowerCategory = params.category?.toLowerCase()
      const lowerParent = params.parentCategory?.toLowerCase()
      let extensions = loadExtensions()
      if (lowerParent) {
        extensions = extensions.filter((e) => e.parentCategory.toLowerCase() === lowerParent)
      }
      if (lowerCategory) {
        extensions = extensions.filter((e) => e.category.toLowerCase() === lowerCategory)
      }
      const sorted = [...extensions].sort((a, b) => a.name.localeCompare(b.name))
      const page = sorted.slice(params.offset, params.offset + params.limit)
      const meta = {
        total: sorted.length,
        count: page.length,
        offset: params.offset,
        has_more: sorted.length > params.offset + page.length,
        next_offset:
          sorted.length > params.offset + page.length ? params.offset + page.length : null,
      }
      const items = page.map((e) => ({ slug: e.slug, name: e.name, category: e.category }))
      const payload = { ...meta, items }
      const markdown = formatExtensionList(page, meta, {
        parentCategory: params.parentCategory,
        category: params.category,
      })
      return buildResponse(params.response_format, markdown, payload)
    },
  )
}
