// Prompt templates. Each prompt pre-loads the relevant catalog data (search
// hits or full records) into the conversation and tells the model which tools
// to use next, so a client can start a useful workflow in one click. Slug and
// kind arguments support completion/complete.

import { completable } from '@modelcontextprotocol/sdk/server/completable.js'
import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { CATALOG_KINDS, catalogEntries, findEntry } from './catalog.js'
import {
  ensureCatalog,
  loadExtensions,
  loadMcpServers,
  loadPreviews,
  loadSites,
  loadSkills,
} from './data.js'
import { installHint, previewToPayload } from './format.js'
import { searchCatalog, type SearchHit } from './search.js'
import type { CatalogKind } from './types.js'

const MAX_COMPLETIONS = 50
const MAX_COMPARE = 5

const URI_SEGMENT: Record<CatalogKind, string> = {
  site: 'sites',
  extension: 'extensions',
  mcp: 'mcp',
  skill: 'skills',
}

function isKind(value: string | undefined): value is CatalogKind {
  return value !== undefined && (CATALOG_KINDS as readonly string[]).includes(value)
}

async function completeSlug(value: string, kind?: string): Promise<string[]> {
  await ensureCatalog()
  const needle = value.trim().toLowerCase()
  const entries = catalogEntries(isKind(kind) ? kind : undefined)
  const starts = entries.filter((e) => e.slug.startsWith(needle))
  const contains = needle
    ? entries.filter((e) => !e.slug.startsWith(needle) && e.slug.includes(needle))
    : []
  return [...new Set([...starts, ...contains].map((e) => e.slug))].slice(0, MAX_COMPLETIONS)
}

function fullRecord(kind: CatalogKind, slug: string): unknown | null {
  if (kind === 'site') {
    const site = loadSites().find((s) => s.slug === slug)
    return site
      ? { ...site, deployCompose: undefined, preview: previewToPayload(loadPreviews()[slug]) }
      : null
  }
  if (kind === 'extension') return loadExtensions().find((e) => e.slug === slug) ?? null
  if (kind === 'mcp') return loadMcpServers().find((m) => m.slug === slug) ?? null
  const skill = loadSkills().find((s) => s.slug === slug)
  return skill ? { ...skill, installHint: installHint(skill) } : null
}

function recordResource(kind: CatalogKind, slug: string, record: unknown) {
  return {
    type: 'resource' as const,
    resource: {
      uri: `holygrail://${URI_SEGMENT[kind]}/${slug}`,
      mimeType: 'application/json',
      text: JSON.stringify(record, null, 2),
    },
  }
}

function hitLines(hits: SearchHit[]): string {
  if (hits.length === 0) return '(no direct matches in the catalog)'
  return hits
    .map(
      (h) =>
        `- ${h.name} [kind=${h.kind}, slug=${h.slug}, match=${h.matchStrength}] — ${h.description}`,
    )
    .join('\n')
}

function userText(text: string): GetPromptResult['messages'][number] {
  return { role: 'user', content: { type: 'text', text } }
}

export function registerPrompts(
  server: SdkMcpServer,
  options: { canInstallSkills: boolean },
): void {
  server.registerPrompt(
    'recommend_tools',
    {
      title: 'Recommend tools for a task',
      description:
        'Recommend the best Holy Grail catalog items (sites, extensions, MCP servers, skills) for a task, with reasons and trade-offs.',
      argsSchema: {
        task: z
          .string()
          .min(2)
          .describe('What you are trying to do, e.g. "self-host a postgres backend"'),
        // describe() must wrap the inner schema: describing the completable
        // result returns a copy without the completer.
        kind: completable(
          z
            .string()
            .optional()
            .describe("Optional: only recommend one kind ('site', 'extension', 'mcp' or 'skill')"),
          (value) => CATALOG_KINDS.filter((k) => k.startsWith(value ?? '')),
        ),
      },
    },
    async ({ task, kind }) => {
      await ensureCatalog()
      const kinds = isKind(kind) ? [kind] : undefined
      const hits = searchCatalog(task.slice(0, 200), 15, 0, kinds).results
      return {
        description: `Recommendations for: ${task}`,
        messages: [
          userText(
            [
              `I need tool recommendations from the Holy Grail catalog for this task:`,
              '',
              `> ${task}`,
              '',
              `Initial catalog search results:`,
              hitLines(hits),
              '',
              'Please:',
              '1. Refine the search if needed (search with other phrasings, find_by_tags, list_categories, get_trending).',
              '2. Open the strongest candidates with get_site / get_extension / get_mcp_server / get_skill and use get_related to find alternatives.',
              '3. Recommend the top 3–5 items. For each: why it fits, notable trade-offs (license, self-hosting, maturity), and how to get started (link or install command).',
              '4. Only recommend items that exist in the catalog; say so if nothing fits well.',
            ].join('\n'),
          ),
        ],
      }
    },
  )

  server.registerPrompt(
    'compare_items',
    {
      title: 'Compare catalog items',
      description: `Compare 2–${MAX_COMPARE} catalog items of the same kind side by side (their full records are attached).`,
      argsSchema: {
        kind: completable(
          z.string().describe("Kind of the items: 'site', 'extension', 'mcp' or 'skill'"),
          (value) => CATALOG_KINDS.filter((k) => k.startsWith(value)),
        ),
        slugs: completable(
          z.string().describe('Comma-separated slugs, e.g. "supabase, appwrite, pocketbase"'),
          async (value, context) => {
            // Complete the last comma-separated slug, keeping the earlier ones.
            const parts = value.split(',')
            const last = parts.pop() ?? ''
            const prefix = parts.map((p) => p.trim()).filter(Boolean)
            const options = await completeSlug(last, context?.arguments?.kind)
            return options
              .filter((slug) => !prefix.includes(slug))
              .map((slug) => [...prefix, slug].join(', '))
          },
        ),
      },
    },
    async ({ kind, slugs }) => {
      await ensureCatalog()
      if (!isKind(kind)) {
        throw new Error(`Unknown kind '${kind}'. Use one of: ${CATALOG_KINDS.join(', ')}`)
      }
      const wanted = [
        ...new Set(
          slugs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ].slice(0, MAX_COMPARE)
      const found: Array<{ slug: string; record: unknown }> = []
      const missing: string[] = []
      for (const slug of wanted) {
        const record = fullRecord(kind, slug)
        if (record) found.push({ slug, record })
        else missing.push(slug)
      }
      if (found.length === 0) {
        throw new Error(`None of the slugs exist for kind '${kind}': ${wanted.join(', ')}`)
      }
      const intro = [
        `Compare these ${kind} entries from the Holy Grail catalog: ${found.map((f) => f.slug).join(', ')}.`,
        ...(missing.length > 0 ? [`(Not found in the catalog: ${missing.join(', ')}.)`] : []),
        '',
        'Their full records are attached. Produce a concise comparison covering purpose, standout features, licensing / pricing signals, self-hosting or platform support, maturity (stars, releases, recent activity where available) and who each one is best for. Finish with a clear recommendation by use case.',
      ].join('\n')
      return {
        description: `Comparison of ${found.length} ${kind} entries`,
        messages: [
          userText(intro),
          ...found.map((f) => ({
            role: 'user' as const,
            content: recordResource(kind, f.slug, f.record),
          })),
        ],
      }
    },
  )

  server.registerPrompt(
    'find_mcp_server',
    {
      title: 'Find an MCP server for a job',
      description:
        'Find catalog MCP servers that give an agent a capability, check their tools, and explain how to install one.',
      argsSchema: {
        capability: z
          .string()
          .min(2)
          .describe(
            'Capability the agent needs, e.g. "query a postgres database" or "control a browser"',
          ),
      },
    },
    async ({ capability }) => {
      await ensureCatalog()
      const hits = searchCatalog(capability.slice(0, 200), 10, 0, ['mcp']).results
      return {
        description: `MCP servers for: ${capability}`,
        messages: [
          userText(
            [
              `I want my AI agent to be able to: ${capability}`,
              '',
              'Candidate MCP servers from the Holy Grail catalog:',
              hitLines(hits),
              '',
              'Please inspect the best candidates with get_mcp_server (look at their tools, transport and connections), pick the best fit, and give me the exact install command and a client config snippet. Mention a runner-up if there is a meaningful trade-off.',
            ].join('\n'),
          ),
        ],
      }
    },
  )

  server.registerPrompt(
    'setup_skill',
    {
      title: 'Set up an AI skill',
      description:
        'Walk through installing a catalog skill into this project or your user skills directory.',
      argsSchema: {
        slug: completable(z.string().describe('Skill slug, e.g. "audit-codebase"'), (value) =>
          completeSlug(value, 'skill'),
        ),
      },
    },
    async ({ slug }) => {
      await ensureCatalog()
      const entry = findEntry('skill', slug)
      if (!entry) throw new Error(`No skill with slug '${slug}'. Use search with kind="skill".`)
      const record = fullRecord('skill', slug)
      const steps = options.canInstallSkills
        ? [
            `1. Call install_skill with slug="${slug}". Ask me whether to install for this project (.claude/skills or .agents/skills) or for my user account, and which agent I use, before writing anything.`,
            '2. Report the installed path and the files written.',
            '3. Summarize what the skill does and when it triggers, based on its SKILL.md.',
          ]
        : [
            `1. Call get_skill_files with slug="${slug}" to fetch SKILL.md and its supporting files.`,
            `2. Write the files into the skills directory of my agent (for Claude Code: .claude/skills/${slug}/ in the project or ~/.claude/skills/${slug}/), preserving relative paths. Ask me which location before writing.`,
            `3. Alternatively, I can run: ${installHint({ repoLink: (record as { repoLink: string }).repoLink, slug })}`,
            '4. Summarize what the skill does and when it triggers, based on its SKILL.md.',
          ]
      return {
        description: `Install the ${slug} skill`,
        messages: [
          userText(
            [
              `Help me set up the "${entry.name}" skill from the Holy Grail catalog.`,
              '',
              ...steps,
            ].join('\n'),
          ),
          { role: 'user', content: recordResource('skill', slug, record) },
        ],
      }
    },
  )

  server.registerPrompt(
    'submit_to_catalog',
    {
      title: 'Suggest a tool for the catalog',
      description:
        'Prepare and send a suggestion for a site or MCP server to the Holy Grail moderation queue.',
      argsSchema: {
        url: z.string().min(4).describe('Website or repository URL of the tool to suggest'),
        notes: z.string().optional().describe('Optional: anything reviewers should know'),
      },
    },
    async ({ url, notes }) => {
      await ensureCatalog()
      let host = url
      try {
        host = new URL(url.includes('://') ? url : `https://${url}`).hostname.replace(/^www\./, '')
      } catch {
        // keep the raw value for the duplicate search
      }
      const hits = searchCatalog(host.slice(0, 200), 5, 0).results
      return {
        description: `Catalog suggestion for ${url}`,
        messages: [
          userText(
            [
              `I want to suggest this tool for the Holy Grail catalog: ${url}`,
              ...(notes ? [`Notes for reviewers: ${notes}`] : []),
              '',
              'Possible existing entries (check for duplicates first):',
              hitLines(hits),
              '',
              'Please:',
              '1. If it is already in the catalog, tell me and stop.',
              '2. Otherwise work out its name, a one-sentence description (max 600 chars) and the best category. If it is an MCP server use submit_mcp_server, otherwise submit_site.',
              '3. Show me the exact submission and ask for confirmation. Then call the tool once with dry_run=false.',
            ].join('\n'),
          ),
        ],
      }
    },
  )
}
