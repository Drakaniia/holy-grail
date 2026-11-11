// McpServer factory — registers all tools, resources and prompts.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SERVER_NAME, SERVER_VERSION } from './constants.js'
import { registerPrompts } from './prompts.js'
import { registerResources } from './resources.js'
import { registerDiscoveryTools } from './tools/discover.js'
import { registerExtensionTools } from './tools/extensions.js'
import { registerMcpTools } from './tools/mcp.js'
import { registerSearchTool } from './tools/search.js'
import { registerSiteTools } from './tools/sites.js'
import { registerSkillFileTools } from './tools/skill-files.js'
import { registerSkillTools } from './tools/skills.js'
import { registerStatsTool } from './tools/stats.js'
import { registerSubmitTools } from './tools/submit.js'

export interface CreateServerOptions {
  /**
   * 'stdio' runs on the user's machine and additionally gets install_skill
   * (writes to local disk). 'http' is the hosted endpoint; otherwise identical.
   */
  transport?: 'stdio' | 'http'
}

const INSTRUCTIONS = `Holy Grail is a curated catalog of developer tools and sites, Chrome extensions, MCP servers and AI agent skills.

- Start with search (free text, optional kind filter). Browse with list_categories, list_tags, find_by_tags and get_trending; use get_related for alternatives.
- Fetch full records with get_site, get_extension, get_mcp_server or get_skill (response_format="json" returns every field).
- Skills: get_skill_files returns SKILL.md and supporting files; install_skill (local server only) writes them to disk.
- submit_site / submit_mcp_server send suggestions to a moderated queue. Confirm with the user first (dry_run=true previews) and never submit duplicates.
- Catalog data is refreshed from the live site every few minutes; get_stats reports the data source.`

/**
 * Creates a fully-registered server. Stateless HTTP transports need one
 * instance per request (Protocol binds a single transport); stdio uses one for
 * the process lifetime. Registration is cheap and index loading is lazy, so
 * per-request creation is fine.
 */
export function createServer(options: CreateServerOptions = {}): McpServer {
  const canInstallSkills = (options.transport ?? 'stdio') === 'stdio'
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  )
  registerSearchTool(server)
  registerSiteTools(server)
  registerExtensionTools(server)
  registerMcpTools(server)
  registerSkillTools(server)
  registerStatsTool(server)
  registerDiscoveryTools(server)
  registerSkillFileTools(server, { canInstallSkills })
  registerSubmitTools(server)
  registerResources(server)
  registerPrompts(server, { canInstallSkills })
  return server
}
