// get_stats tool — entity counts + per-parent-category breakdown (mirrors the
// SPA sidebar counts).

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { loadExtensions, loadMcpServers, loadSites, loadSkills } from '../data.js'
import { formatStats } from '../format.js'
import { buildResponse } from './common.js'

const StatsInputSchema = z
  .object({
    response_format: z
      .enum(['markdown', 'json'])
      .default('markdown')
      .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
  })
  .strict()

export function registerStatsTool(server: SdkMcpServer): void {
  server.registerTool(
    'get_stats',
    {
      title: 'Get Catalog Statistics',
      description: `Return catalog size: counts per entity kind (sites, extensions, MCP servers, skills) and a per-parent-category breakdown mirroring the SPA sidebar counts. Takes no arguments besides response_format.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "counts": { "sites": number, "extensions": number, "mcp": number, "skills": number }, "total": number, "byParentCategory": { [parent]: { "sites": number, "extensions": number, "mcp": number, "skills": number } } }

Examples:
  - "How many MCP servers are in the catalog?" -> get_stats then read counts.mcp
  - "What are the biggest parent categories?" -> get_stats then inspect byParentCategory`,
      inputSchema: StatsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const sites = loadSites()
      const extensions = loadExtensions()
      const servers = loadMcpServers()
      const skills = loadSkills()

      const byParentCategory: Record<
        string,
        { sites: number; extensions: number; mcp: number; skills: number }
      > = {}
      const bump = (parent: string, kind: 'sites' | 'extensions' | 'mcp' | 'skills') => {
        const key = parent || '(uncategorized)'
        const entry = byParentCategory[key] ?? { sites: 0, extensions: 0, mcp: 0, skills: 0 }
        entry[kind] += 1
        byParentCategory[key] = entry
      }
      for (const site of sites) bump(site.parentCategory, 'sites')
      for (const ext of extensions) bump(ext.parentCategory, 'extensions')
      for (const server of servers) bump(server.parentCategory, 'mcp')
      for (const skill of skills) bump(skill.parentCategory, 'skills')

      const counts = {
        sites: sites.length,
        extensions: extensions.length,
        mcp: servers.length,
        skills: skills.length,
      }
      const total = sites.length + extensions.length + servers.length + skills.length
      const sortedParents = Object.keys(byParentCategory).sort()
      const payload = {
        counts,
        total,
        byParentCategory: Object.fromEntries(
          sortedParents.map((parent) => [parent, byParentCategory[parent]]),
        ),
      }
      return buildResponse(params.response_format, formatStats(payload), payload)
    },
  )
}
