// get_skill + list_skills tools.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT } from '../constants.js'
import { loadSkills } from '../data.js'
import { formatSkill, formatSkillList } from '../format.js'
import type { Skill } from '../types.js'
import { buildResponse, notFound } from './common.js'

const GetSkillInputSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .describe('Skill slug, e.g. "audit-codebase". Find valid slugs via search or list_skills'),
  })
  .strict()

const ListSkillsInputSchema = z
  .object({
    category: z
      .string()
      .optional()
      .describe('Filter by exact category, e.g. "AI" or "quality-release"'),
    parentCategory: z
      .string()
      .optional()
      .describe('Filter by parent category (lowercase), e.g. "skills"'),
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

function withInstallHint(skill: Skill) {
  return {
    ...skill,
    installHint: `npx grail add ${skill.repoLink} --skill ${skill.slug}`,
  }
}

export function registerSkillTools(server: SdkMcpServer): void {
  server.registerTool(
    'get_skill',
    {
      title: 'Get Skill Details',
      description: `Fetch the full catalog record for one AI skill, including repo, skill path, branch, author, and the install command.

Args:
  - slug (string): Skill slug, e.g. "audit-codebase"

Returns:
  Full skill record (JSON) — slug, title, description, category, parentCategory, tags, views, uses, author, authorName, repoLink, skillPath, branch, addedBy, featured, dateAdded, hasLocalContent, installHint

Examples:
  - "How do I install the folder-architecture skill?" -> slug="folder-architecture" (installHint: npx grail add <repo> --skill <slug>)
  - Don't use for finding slugs — use search or list_skills first.

Error Handling:
  - "No skill with slug 'X'. Use search or list_skills to find valid slugs."`,
      inputSchema: GetSkillInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      const skill = loadSkills().find((s) => s.slug === params.slug)
      if (!skill) return notFound('skill', params.slug)
      const payload = withInstallHint(skill)
      return buildResponse('markdown', formatSkill(skill), payload)
    },
  )

  server.registerTool(
    'list_skills',
    {
      title: 'List Skills',
      description: `List catalog AI skills with optional category filters, sorted by name. Paged with offset.

Args:
  - category (string, optional): Filter by exact category, e.g. "AI"
  - parentCategory (string, optional): Filter by parent category, e.g. "skills"
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset": number|null, "items": [{ "slug", "title", "category" }] }

Examples:
  - "What skills are available?" -> list with limit=50
  - "List skills in category AI" -> category="AI"
  - Use get_skill for full details including the install command.`,
      inputSchema: ListSkillsInputSchema,
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
      let skills = loadSkills()
      if (lowerCategory) skills = skills.filter((s) => s.category.toLowerCase() === lowerCategory)
      if (lowerParent) {
        skills = skills.filter((s) => s.parentCategory.toLowerCase() === lowerParent)
      }
      const sorted = [...skills].sort((a, b) => a.title.localeCompare(b.title))
      const page = sorted.slice(params.offset, params.offset + params.limit)
      const meta = {
        total: sorted.length,
        count: page.length,
        offset: params.offset,
        has_more: sorted.length > params.offset + page.length,
        next_offset:
          sorted.length > params.offset + page.length ? params.offset + page.length : null,
      }
      const items = page.map((s) => ({ slug: s.slug, title: s.title, category: s.category }))
      const payload = { ...meta, items }
      const markdown = formatSkillList(page, meta, {
        category: params.category,
        parentCategory: params.parentCategory,
      })
      return buildResponse(params.response_format, markdown, payload)
    },
  )
}
