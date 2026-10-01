// Shared tool-response helpers: structured results, actionable errors, and
// CHARACTER_LIMIT handling for both markdown and JSON response formats.

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CHARACTER_LIMIT } from '../constants.js'
import { truncate, type PageMeta } from '../format.js'

type ResponseFormat = 'markdown' | 'json'

function ok(text: string, structuredContent?: unknown): CallToolResult {
  const result: CallToolResult = { content: [{ type: 'text', text }] }
  if (structuredContent !== undefined) {
    result.structuredContent = structuredContent as Record<string, unknown>
  }
  return result
}

function fail(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] }
}

type KindLabel = 'site' | 'extension' | 'MCP server' | 'skill'

const LIST_TOOL: Record<KindLabel, string> = {
  site: 'list_sites',
  extension: 'list_extensions',
  'MCP server': 'list_mcp_servers',
  skill: 'list_skills',
}

export function notFound(kind: KindLabel, slug: string): CallToolResult {
  return fail(
    `No ${kind} with slug '${slug}'. Use search or ${LIST_TOOL[kind]} to find valid slugs.`,
  )
}

/** Pagination metadata for one page of `sorted`, windowed at `offset`/`limit`. */
export function page<T>(sorted: T[], offset: number, limit: number): PageMeta {
  const count = Math.min(limit, Math.max(0, sorted.length - offset))
  const hasMore = offset + count < sorted.length
  return {
    total: sorted.length,
    count,
    offset,
    has_more: hasMore,
    next_offset: hasMore ? offset + count : null,
  }
}

/** Drops verbose fields (deployCompose, fullDescription) so JSON stays valid and bounded. */
const SLIM_REPLACER = (key: string, value: unknown): unknown =>
  key === 'deployCompose' || key === 'fullDescription' ? undefined : value

function buildJsonResponse(payload: unknown): CallToolResult {
  let text = JSON.stringify(payload, null, 2)
  let trimmed = payload
  if (text.length > CHARACTER_LIMIT) {
    trimmed = JSON.parse(JSON.stringify(payload, SLIM_REPLACER))
    text = JSON.stringify(trimmed, null, 2)
  }
  return ok(text, trimmed)
}

/** Builds the final tool result for the requested response format. */
export function buildResponse(
  format: ResponseFormat,
  markdownText: string,
  payload: unknown,
): CallToolResult {
  if (format === 'json') return buildJsonResponse(payload)
  return ok(truncate(markdownText), payload)
}
