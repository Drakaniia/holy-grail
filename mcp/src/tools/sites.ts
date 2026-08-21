// get_site + list_sites tools.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT } from '../constants.js'
import { loadPreviews, loadSites } from '../data.js'
import { formatSite, formatSiteList, previewToPayload } from '../format.js'
import { buildResponse, notFound } from './common.js'

const GetSiteInputSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .describe('Site slug, e.g. "appwrite". Find valid slugs via search or list_sites'),
  })
  .strict()

const ListSitesInputSchema = z
  .object({
    parentCategory: z
      .string()
      .optional()
      .describe('Filter by parent category (lowercase), e.g. "development" or "ai"'),
    category: z
      .string()
      .optional()
      .describe('Filter by exact category, e.g. "Backend" or "Cloud & Hosting"'),
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

export function registerSiteTools(server: SdkMcpServer): void {
  server.registerTool(
    'get_site',
    {
      title: 'Get Site Details',
      description: `Fetch the full catalog record for one site, including stars, license, links, features, similar tools, and preview image URLs.

Args:
  - slug (string): Site slug, e.g. "appwrite"

Returns:
  Full site record (JSON) — slug, name, description, category, parentCategory, stars, watchers, license, version, platforms, deployment, website, docs, sourceCode, tags, verified, featured, atGlance, fullDescription, coreFeatures, additionalFeatures, installCommand, similarTools, preview { image, small, width, height, capturedAt }

Examples:
  - "Get details on Vercel" -> slug="vercel"
  - Don't use for finding slugs — use search or list_sites first.

Error Handling:
  - "No site with slug 'X'. Use search or list_sites to find valid slugs."`,
      inputSchema: GetSiteInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const site = loadSites().find((s) => s.slug === params.slug)
      if (!site) return notFound('site', params.slug)
      const preview = loadPreviews()[site.slug]
      const payload = { ...site, preview: previewToPayload(preview) }
      return buildResponse('markdown', formatSite(site, preview), payload)
    },
  )

  server.registerTool(
    'list_sites',
    {
      title: 'List Sites',
      description: `List catalog sites with optional category filters, sorted by stars (descending). Paged with offset.

Args:
  - parentCategory (string, optional): Filter by parent category, e.g. "development" or "ai"
  - category (string, optional): Filter by exact category, e.g. "Backend"
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset": number|null, "items": [{ "slug", "name", "category", "stars" }] }

Examples:
  - "List database sites" -> category="Database"
  - "What sites are under AI?" -> parentCategory="ai"
  - Use get_site for full record details.`,
      inputSchema: ListSitesInputSchema,
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
      let sites = loadSites()
      if (lowerParent) sites = sites.filter((s) => s.parentCategory.toLowerCase() === lowerParent)
      if (lowerCategory) sites = sites.filter((s) => s.category.toLowerCase() === lowerCategory)
      const sorted = [...sites].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
      const page = sorted.slice(params.offset, params.offset + params.limit)
      const meta = {
        total: sorted.length,
        count: page.length,
        offset: params.offset,
        has_more: sorted.length > params.offset + page.length,
        next_offset:
          sorted.length > params.offset + page.length ? params.offset + page.length : null,
      }
      const items = page.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
        stars: s.stars,
      }))
      const payload = { ...meta, items }
      const markdown = formatSiteList(page, meta, {
        parentCategory: params.parentCategory,
        category: params.category,
      })
      return buildResponse(params.response_format, markdown, payload)
    },
  )
}
