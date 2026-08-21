// McpServer factory — registers all tools and resources.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SERVER_NAME, SERVER_VERSION } from './constants.js'
import { registerResources } from './resources.js'
import { registerExtensionTools } from './tools/extensions.js'
import { registerMcpTools } from './tools/mcp.js'
import { registerSearchTool } from './tools/search.js'
import { registerSiteTools } from './tools/sites.js'
import { registerSkillTools } from './tools/skills.js'
import { registerStatsTool } from './tools/stats.js'

/**
 * Creates a fully-registered server. Stateless HTTP transports need one
 * instance per request (Protocol binds a single transport); stdio uses one for
 * the process lifetime. Registration is cheap and index loading is lazy, so
 * per-request creation is fine.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION })
  registerSearchTool(server)
  registerSiteTools(server)
  registerExtensionTools(server)
  registerMcpTools(server)
  registerSkillTools(server)
  registerStatsTool(server)
  registerResources(server)
  return server
}
