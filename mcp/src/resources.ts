// Resource registration: one URI template per entity kind
// (holygrail://{kind}/{slug}) with a list callback enumerating every resource,
// so resources/list returns the full catalog and resources/read resolves any
// slug. Payloads are JSON; preview images are URLs only, never blobs.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { loadExtensions, loadMcpServers, loadPreviews, loadSites, loadSkills } from './data.js'
import { previewToPayload } from './format.js'
import type { CatalogKind } from './types.js'

function entityPayload(kind: CatalogKind, slug: string): unknown | null {
  if (kind === 'site') {
    const site = loadSites().find((s) => s.slug === slug)
    if (!site) return null
    return { ...site, preview: previewToPayload(loadPreviews()[slug]) }
  }
  if (kind === 'extension') {
    const extension = loadExtensions().find((e) => e.slug === slug)
    return extension ? { ...extension } : null
  }
  if (kind === 'mcp') {
    const server = loadMcpServers().find((m) => m.slug === slug)
    return server ? { ...server } : null
  }
  const skill = loadSkills().find((s) => s.slug === slug)
  if (!skill) return null
  return { ...skill, installHint: `npx grail add ${skill.repoLink} --skill ${skill.slug}` }
}

interface ResourceSpec {
  kind: CatalogKind
  name: string
  description: string
  uri: string
  listResources: () => Array<{ uri: string; name: string; description: string }>
}

function kindFromUri(uri: string): CatalogKind {
  if (uri.startsWith('holygrail://sites/')) return 'site'
  if (uri.startsWith('holygrail://extensions/')) return 'extension'
  if (uri.startsWith('holygrail://mcp/')) return 'mcp'
  return 'skill'
}

export function registerResources(server: SdkMcpServer): void {
  const specs: ResourceSpec[] = [
    {
      kind: 'site',
      name: 'Holy Grail Site',
      description: 'Full Holy Grail site catalog record as JSON (includes preview image URLs)',
      uri: 'holygrail://sites/{slug}',
      listResources: () =>
        loadSites().map((s) => ({
          uri: `holygrail://sites/${s.slug}`,
          name: s.name,
          description: s.description,
        })),
    },
    {
      kind: 'extension',
      name: 'Holy Grail Extension',
      description: 'Full Holy Grail Chrome extension catalog record as JSON',
      uri: 'holygrail://extensions/{slug}',
      listResources: () =>
        loadExtensions().map((e) => ({
          uri: `holygrail://extensions/${e.slug}`,
          name: e.name,
          description: e.description,
        })),
    },
    {
      kind: 'mcp',
      name: 'Holy Grail MCP Server',
      description:
        'Full Holy Grail MCP server catalog record as JSON (tools, connections, transport)',
      uri: 'holygrail://mcp/{slug}',
      listResources: () =>
        loadMcpServers().map((m) => ({
          uri: `holygrail://mcp/${m.slug}`,
          name: m.name,
          description: m.description,
        })),
    },
    {
      kind: 'skill',
      name: 'Holy Grail Skill',
      description: 'Full Holy Grail skill catalog record as JSON (includes installHint)',
      uri: 'holygrail://skills/{slug}',
      listResources: () =>
        loadSkills().map((s) => ({
          uri: `holygrail://skills/${s.slug}`,
          name: s.title,
          description: s.description,
        })),
    },
  ]

  for (const spec of specs) {
    const template = new ResourceTemplate(spec.uri, {
      list: async () => ({ resources: spec.listResources() }),
    })
    server.registerResource(
      spec.name,
      template,
      { mimeType: 'application/json', description: spec.description },
      async (uri) => {
        const slugMatch = /\/([^/]+)$/.exec(uri.toString())
        const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : ''
        const payload = entityPayload(kindFromUri(uri.toString()), slug)
        if (payload === null) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `No ${spec.kind} resource with slug '${slug}'`,
          )
        }
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(payload, null, 2),
            },
          ],
        }
      },
    )
  }
}
