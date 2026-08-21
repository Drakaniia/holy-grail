// Shared tool-response helpers: structured results, actionable errors, and
// CHARACTER_LIMIT handling for both markdown and JSON response formats.

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CHARACTER_LIMIT } from '../constants.js'
import { applyTruncation } from '../format.js'

export type ResponseFormat = 'markdown' | 'json'

export function ok(text: string, structuredContent?: unknown): CallToolResult {
  const result: CallToolResult = { content: [{ type: 'text', text }] }
  if (structuredContent !== undefined) {
    result.structuredContent = structuredContent as Record<string, unknown>
  }
  return result
}

export function fail(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] }
}

export type KindLabel = 'site' | 'extension' | 'MCP server' | 'skill'

export function notFound(kind: KindLabel, slug: string): CallToolResult {
  const listTool =
    kind === 'site'
      ? 'list_sites'
      : kind === 'extension'
        ? 'list_extensions'
        : kind === 'MCP server'
          ? 'list_mcp_servers'
          : 'list_skills'
  return fail(`No ${kind} with slug '${slug}'. Use search or ${listTool} to find valid slugs.`)
}

/** Drops verbose fields (deployCompose, fullDescription) so JSON stays valid and bounded. */
function slimPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map(slimPayload)
  if (payload !== null && typeof payload === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (key === 'deployCompose' || key === 'fullDescription') continue
      out[key] = slimPayload(value)
    }
    return out
  }
  return payload
}

export function buildJsonResponse(payload: unknown): CallToolResult {
  let text = JSON.stringify(payload, null, 2)
  let trimmed = payload
  if (text.length > CHARACTER_LIMIT) {
    trimmed = slimPayload(payload)
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
  return ok(applyTruncation(markdownText).text, payload)
}
