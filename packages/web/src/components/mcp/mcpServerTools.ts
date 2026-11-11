/**
 * Static reference data for the "Connect via MCP" page. Mirrors what `holy-grail-mcp` registers
 * (packages/mcp/src/server.ts) — update both together when a tool, prompt or resource changes.
 */

export const MCP_SERVER_NAME = 'holy-grail'
export const MCP_NPM_PACKAGE = 'holy-grail-mcp'
export const MCP_FALLBACK_ENDPOINT = 'https://holy-grail-eta.vercel.app/mcp'

export interface McpServerTool {
  name: string
  description: string
  localOnly?: boolean
}

export interface McpServerToolGroup {
  id: string
  label: string
  description: string
  tools: McpServerTool[]
}

export interface McpServerPrompt {
  name: string
  description: string
}

export interface McpServerResource {
  uri: string
  description: string
}

export interface McpServerEnvVar {
  name: string
  description: string
}

export interface McpClientSnippet {
  label: string
  code: string
}

export interface McpClientConfig {
  id: string
  label: string
  /** Where the snippet goes: a CLI or a config file path. */
  location: string
  hosted: McpClientSnippet | null
  local: McpClientSnippet
  note?: string
}

export const mcpServerToolGroups: McpServerToolGroup[] = [
  {
    id: 'discover',
    label: 'Discover',
    description: 'Search and browse across every catalog.',
    tools: [
      { name: 'search', description: 'Ranked search across the whole catalog.' },
      { name: 'list_categories', description: 'Category tree with item counts.' },
      { name: 'list_tags', description: 'Most-used tags.' },
      { name: 'find_by_tags', description: 'Filter items by tags, matching any or all.' },
      { name: 'get_trending', description: 'Newest, most popular or featured items.' },
      { name: 'get_related', description: 'Items related to a given item.' },
    ],
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Fetch or list a single kind of item.',
    tools: [
      { name: 'get_site', description: 'Full details for one site.' },
      { name: 'list_sites', description: 'Paginated list of sites.' },
      { name: 'get_extension', description: 'Full details for one Chrome extension.' },
      { name: 'list_extensions', description: 'Paginated list of extensions.' },
      { name: 'get_mcp_server', description: 'Full details for one MCP server.' },
      { name: 'list_mcp_servers', description: 'Paginated list of MCP servers.' },
      { name: 'get_skill', description: 'Full details for one AI skill.' },
      { name: 'list_skills', description: 'Paginated list of skills.' },
      { name: 'get_stats', description: 'Catalog counts per type and category.' },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Pull agent skills straight into a project.',
    tools: [
      {
        name: 'get_skill_files',
        description: "Fetch a skill's files from GitHub with install instructions.",
      },
      {
        name: 'install_skill',
        description: 'Write a skill into .claude/skills or .agents/skills.',
        localOnly: true,
      },
    ],
  },
  {
    id: 'contribute',
    label: 'Contribute',
    description:
      'Suggest additions to the moderated review queue. No account needed; rate-limited.',
    tools: [
      { name: 'submit_site', description: 'Suggest a site for the catalog.' },
      { name: 'submit_mcp_server', description: 'Suggest an MCP server for the catalog.' },
    ],
  },
]

export const mcpServerPrompts: McpServerPrompt[] = [
  { name: 'recommend_tools', description: 'Recommend tools for a task.' },
  { name: 'compare_items', description: 'Compare catalog items side by side.' },
  { name: 'find_mcp_server', description: 'Find an MCP server for a job.' },
  { name: 'setup_skill', description: 'Walk through installing a skill.' },
  { name: 'submit_to_catalog', description: 'Prepare a catalog submission.' },
]

export const mcpServerResources: McpServerResource[] = [
  { uri: 'holygrail://sites/{slug}', description: 'A site entry.' },
  { uri: 'holygrail://extensions/{slug}', description: 'A Chrome extension entry.' },
  { uri: 'holygrail://mcp/{slug}', description: 'An MCP server entry.' },
  { uri: 'holygrail://skills/{slug}', description: 'An AI skill entry.' },
]

export const mcpServerEnvVars: McpServerEnvVar[] = [
  { name: 'HOLY_GRAIL_LIVE', description: 'Set to 0 to use the bundled snapshot only.' },
  { name: 'HOLY_GRAIL_BASE_URL', description: 'Site to fetch live catalog data from.' },
  { name: 'GITHUB_TOKEN', description: 'Raises GitHub rate limits when fetching skill files.' },
]

function json(value: unknown) {
  return JSON.stringify(value, null, 2)
}

const localStdioServer = { command: 'npx', args: ['-y', MCP_NPM_PACKAGE] }

/** Every client snippet, built against the endpoint resolved for the current origin. */
export function buildMcpClientConfigs(endpoint: string): McpClientConfig[] {
  const localMcpServers = json({ mcpServers: { [MCP_SERVER_NAME]: localStdioServer } })

  return [
    {
      id: 'claude-code',
      label: 'Claude Code',
      location: 'Terminal',
      hosted: {
        label: 'Hosted',
        code: `claude mcp add --transport http ${MCP_SERVER_NAME} ${endpoint}`,
      },
      local: {
        label: 'Local',
        code: `claude mcp add ${MCP_SERVER_NAME} -- npx -y ${MCP_NPM_PACKAGE}`,
      },
    },
    {
      id: 'claude-desktop',
      label: 'Claude Desktop',
      location: 'claude_desktop_config.json',
      hosted: null,
      local: { label: 'Local', code: localMcpServers },
      note: 'This config file launches local stdio servers only.',
    },
    {
      id: 'cursor',
      label: 'Cursor',
      location: '.cursor/mcp.json',
      hosted: {
        label: 'Hosted',
        code: json({ mcpServers: { [MCP_SERVER_NAME]: { url: endpoint } } }),
      },
      local: { label: 'Local', code: localMcpServers },
    },
    {
      id: 'vscode',
      label: 'VS Code',
      location: '.vscode/mcp.json',
      hosted: {
        label: 'Hosted',
        code: json({ servers: { [MCP_SERVER_NAME]: { type: 'http', url: endpoint } } }),
      },
      local: {
        label: 'Local',
        code: json({ servers: { [MCP_SERVER_NAME]: { type: 'stdio', ...localStdioServer } } }),
      },
    },
    {
      id: 'windsurf',
      label: 'Windsurf',
      location: '~/.codeium/windsurf/mcp_config.json',
      hosted: {
        label: 'Hosted',
        code: json({ mcpServers: { [MCP_SERVER_NAME]: { serverUrl: endpoint } } }),
      },
      local: { label: 'Local', code: localMcpServers },
    },
  ]
}
