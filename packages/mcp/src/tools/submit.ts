// submit_site + submit_mcp_server — anonymous catalog suggestions.
//
// Submissions go to the public `submit-tool` Supabase Edge Function (the same
// endpoint the SPA's /publish page uses). It validates the payload, rate-limits
// per client IP and stores a `pending` row for moderators; nothing is published
// automatically. No credentials are involved: the function is deployed with
// --no-verify-jwt and anonymous submissions are allowed.
//
// Config: HOLY_GRAIL_SUPABASE_URL (project URL), HOLY_GRAIL_SUPABASE_KEY
// (optional publishable key), HOLY_GRAIL_SUBMIT_ORIGIN (site origin the
// function's allowlist expects; defaults to the public site).

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { catalogEntries, type CatalogEntry } from '../catalog.js'
import { DEFAULT_SITE_URL, DEFAULT_SUPABASE_URL, SUBMIT_TIMEOUT_MS } from '../constants.js'
import { ensureCatalog } from '../data.js'
import { fail, ok } from './common.js'

/** Must stay in sync with CATEGORIES in packages/supabase/functions/submit-tool/index.ts. */
export const SUBMISSION_CATEGORIES = [
  'Platforms',
  'Development - Cloud & Hosting',
  'Development - CLI Tools',
  'Development - Learning',
  'Development - References',
  'Development - Tooling',
  'Development - UI Libraries',
  'Development - Repositories',
  'Development - MCP',
  'Development - Monitoring',
  'AI - Image',
  'AI - API',
  'AI - Automation',
  'AI - Chat',
  'AI - Video',
  'AI - Other',
  'Design - Inspiration',
  'Design - Fonts',
  'Design - Icons/SVG',
  'Design - Tools',
  'CLI Tools',
  'UI Libraries',
  'Skills',
  'Skills - Agent workflow',
  'Skills - Frontend/UI',
  'Skills - Backend/API',
  'Skills - Data/ML',
  'Skills - DevOps/Deploy',
  'Skills - Security/Review',
  'Skills - Research/Writing',
  'Skills - Other',
  'Other',
] as const

const MCP_CATEGORY = 'Development - MCP'
const NOTE_PREFIX = '[via holy-grail-mcp]'
const NOTE_MAX = 1000

const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const

interface Submission {
  name: string
  url: string
  description: string
  category: string
  submitter_note: string
}

const httpUrl = z
  .string()
  .min(4)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, 'Must be a full http:// or https:// URL')

const commonFields = {
  name: z.string().trim().min(1).max(120).describe('Display name, e.g. "Pocketbase"'),
  url: httpUrl.describe('Website or repository URL (http/https)'),
  description: z
    .string()
    .trim()
    .min(10)
    .max(600)
    .describe('One or two sentences on what it is and who it is for (max 600 chars)'),
  note: z
    .string()
    .trim()
    .max(800)
    .optional()
    .describe('Optional context for reviewers (pricing, why it belongs, related entries)'),
  dry_run: z
    .boolean()
    .default(false)
    .describe('true = validate and duplicate-check only, return the payload without sending it'),
}

function comparableUrl(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    const path = url.pathname.replace(/\/+$/, '').toLowerCase()
    return `${host}${path}`
  } catch {
    return null
  }
}

function findDuplicate(name: string, url: string): CatalogEntry | null {
  const target = comparableUrl(url)
  const lowerName = name.trim().toLowerCase()
  for (const entry of catalogEntries()) {
    if (entry.kind === 'skill') continue
    if (target && comparableUrl(entry.website) === target) return entry
    if (entry.name.trim().toLowerCase() === lowerName) return entry
  }
  return null
}

function supabaseUrl(): string {
  return (process.env.HOLY_GRAIL_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL).replace(/\/+$/, '')
}

async function sendSubmission(submission: Submission): Promise<CallToolResult> {
  const endpoint = `${supabaseUrl()}/functions/v1/submit-tool`
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    // The function's CORS allowlist is keyed on the site origin; server-side
    // callers present the public site's origin (no browser is involved).
    origin: process.env.HOLY_GRAIL_SUBMIT_ORIGIN?.trim() || DEFAULT_SITE_URL,
    'x-client-info': 'holy-grail-mcp',
  }
  const key = process.env.HOLY_GRAIL_SUPABASE_KEY?.trim()
  if (key) {
    headers.apikey = key
    headers.authorization = `Bearer ${key}`
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ submission }),
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    })
  } catch (error) {
    return fail(
      `Could not reach the Holy Grail submission service (${endpoint}): ${error instanceof Error ? error.message : String(error)}. ` +
        'Try again later, or submit through the website at /publish.',
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    // non-JSON error page; fall through with an empty body
  }

  if (response.status === 201 || (response.ok && body.ok === true)) {
    const payload = { ok: true, id: body.id ?? null, status: 'pending', submission }
    return ok(
      `Submitted "${submission.name}" for review (id: ${String(body.id ?? 'n/a')}). ` +
        'A moderator will review it before it appears in the catalog.',
      payload,
    )
  }
  if (response.status === 429) {
    const retry = response.headers.get('retry-after')
    return fail(
      `Submission rate limit reached${retry ? ` — retry in about ${Math.ceil(Number(retry) / 60)} min` : ''}. Do not retry immediately.`,
    )
  }
  const message = typeof body.error === 'string' ? body.error : `HTTP ${response.status}`
  if (response.status === 403) {
    return fail(
      `The submission service rejected this client (${message}). Set HOLY_GRAIL_SUBMIT_ORIGIN to an allowed site origin, or submit via the website.`,
    )
  }
  return fail(`Submission rejected: ${message}`)
}

async function submit(submission: Submission, dryRun: boolean): Promise<CallToolResult> {
  await ensureCatalog()
  const duplicate = findDuplicate(submission.name, submission.url)
  if (duplicate) {
    return fail(
      `"${submission.name}" looks like it is already in the catalog as ${duplicate.kind} '${duplicate.slug}' (${duplicate.name}). ` +
        'Nothing was submitted. If this is a different tool, adjust the name or URL.',
    )
  }
  if (dryRun) {
    return ok(
      `Dry run OK — no duplicate found. This would be submitted:\n\n${JSON.stringify(submission, null, 2)}\n\nCall again with dry_run=false to send it.`,
      { ok: true, dry_run: true, submission },
    )
  }
  return sendSubmission(submission)
}

function buildNote(parts: Array<string | undefined>): string {
  return [NOTE_PREFIX, ...parts.filter((p): p is string => Boolean(p?.trim()))]
    .join('\n')
    .slice(0, NOTE_MAX)
}

export function registerSubmitTools(server: SdkMcpServer): void {
  server.registerTool(
    'submit_site',
    {
      title: 'Suggest a Site for the Catalog',
      description: `Suggest a website, platform, library or tool for the Holy Grail catalog. The suggestion goes to a moderated review queue — nothing is published automatically. No account needed; submissions are rate-limited per client.

Always confirm the details with the user before sending (dry_run=true previews), and never submit the same tool twice. Duplicates already in the catalog are rejected automatically. Use submit_mcp_server for MCP servers.

Args:
  - name (string): Display name, max 120 chars
  - url (string): Website or repository URL
  - description (string): 10-600 chars
  - category (enum): One of the catalog submission categories, e.g. "Development - Tooling", "AI - Chat", "Design - Tools"
  - note (string, optional): Context for reviewers
  - dry_run (boolean): Validate + duplicate-check without sending (default: false)

Returns:
  Success: { "ok": true, "id": string, "status": "pending", "submission": {...} }
  Errors: duplicate entry, rate limit (do not retry immediately), validation error`,
      inputSchema: z
        .object({
          ...commonFields,
          category: z
            .enum(SUBMISSION_CATEGORIES)
            .describe('Best-fitting catalog category, e.g. "Development - Tooling"'),
        })
        .strict(),
      annotations: { ...WRITE_ANNOTATIONS, title: 'Suggest a Site' },
    },
    async (params) =>
      submit(
        {
          name: params.name,
          url: params.url,
          description: params.description,
          category: params.category,
          submitter_note: buildNote([params.note]),
        },
        params.dry_run,
      ),
  )

  server.registerTool(
    'submit_mcp_server',
    {
      title: 'Suggest an MCP Server for the Catalog',
      description: `Suggest an MCP server for the Holy Grail catalog. Goes to a moderated review queue — nothing is published automatically. No account needed; submissions are rate-limited per client.

Always confirm the details with the user before sending (dry_run=true previews). Servers already in the catalog are rejected automatically.

Args:
  - name (string): Server name, max 120 chars
  - url (string): Repository or documentation URL
  - description (string): 10-600 chars — what the server lets an agent do
  - install_command (string, optional): e.g. "npx -y @acme/mcp-server"
  - transport ('stdio' | 'http' | 'sse' | 'websocket', optional)
  - tools (string[], optional): Notable tool names the server exposes
  - note (string, optional): Context for reviewers
  - dry_run (boolean): Validate + duplicate-check without sending (default: false)

Returns:
  Success: { "ok": true, "id": string, "status": "pending", "submission": {...} }`,
      inputSchema: z
        .object({
          ...commonFields,
          install_command: z.string().trim().max(300).optional().describe('Install/run command'),
          transport: z
            .enum(['stdio', 'http', 'sse', 'websocket'])
            .optional()
            .describe('Transport the server speaks'),
          tools: z
            .array(z.string().trim().min(1).max(80))
            .max(30)
            .optional()
            .describe('Notable tool names, e.g. ["query", "list_tables"]'),
        })
        .strict(),
      annotations: { ...WRITE_ANNOTATIONS, title: 'Suggest an MCP Server' },
    },
    async (params) =>
      submit(
        {
          name: params.name,
          url: params.url,
          description: params.description,
          category: MCP_CATEGORY,
          submitter_note: buildNote([
            params.install_command && `Install: ${params.install_command}`,
            params.transport && `Transport: ${params.transport}`,
            params.tools?.length ? `Tools: ${params.tools.join(', ')}` : undefined,
            params.note,
          ]),
        },
        params.dry_run,
      ),
  )
}
