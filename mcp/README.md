# Holy Grail MCP

MCP server exposing the [Holy Grail](https://holy-grail-eta.vercel.app) catalog — sites,
Chrome extensions, MCP servers, and AI skills — to AI agents as read-only tools
and resources. Same search quality as the SPA (the scoring engine is a verbatim
port of `useSmartSearch`).

Read-only by design: agents can search, fetch, and list catalog entries; nothing
is ever mutated.

## Install & run

```bash
# stdio (default — Claude Code, opencode, MCP Inspector, Cursor, Windsurf)
bunx holy-grail-mcp

# streamable HTTP on http://127.0.0.1:3000/mcp
TRANSPORT=http bunx holy-grail-mcp
PORT=3000 HOST=127.0.0.1 TRANSPORT=http bunx holy-grail-mcp
```

From this repo (dev mode):

```bash
bun run build:mcp          # tsc build + snapshot the generated indexes
bun mcp/dist/index.js              # stdio
TRANSPORT=http bun mcp/dist/index.js  # HTTP on :3000
```

No auth, no API key — public read-only data, same stance as the site.

## Client config

Claude Code (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "holy-grail": {
      "command": "bunx",
      "args": ["holy-grail-mcp"]
    }
  }
}
```

opencode (`opencode.json`):

```json
{
  "mcp": {
    "holy-grail": {
      "type": "local",
      "command": ["bunx", "holy-grail-mcp"]
    }
  }
}
```

Remote (streamable HTTP, no sessions — each POST is independent):

```json
{
  "mcp": {
    "holy-grail": {
      "type": "remote",
      "url": "https://holy-grail-eta.vercel.app/mcp"
    }
  }
}
```

Supported clients: stdio works everywhere; remote streamable HTTP is verified
with the official TS SDK client and MCP Inspector. Claude web Custom Connectors
may expect OAuth — the endpoint is intentionally unauthenticated, so verify
manually before relying on it.

Per-client setup (Claude Code, Cursor, Windsurf, opencode, Claude Desktop, MCP
Inspector): [docs/MCP-INTEGRATION.md](https://github.com/Drakaniia/holy-grail/blob/grail/docs/MCP-INTEGRATION.md).

## Tools

| Tool | Description |
|---|---|
| `search` | Cross-entity search (sites, extensions, MCP servers, skills) with SPA-identical scoring. Params: `query`, `limit`, `offset`, `response_format` |
| `get_site` | Full site record by slug, incl. preview image URLs |
| `get_extension` | Full Chrome extension record by slug |
| `get_mcp_server` | Full MCP server record by slug, incl. tools and connections |
| `get_skill` | Full skill record by slug, incl. `installHint` (`npx grail add <repo> --skill <slug>`) |
| `list_sites` | Paged site list, filters `parentCategory`/`category`, sorted by stars |
| `list_extensions` | Paged extension list, filters `parentCategory`/`category` |
| `list_mcp_servers` | Paged MCP server list, filters `category`/`transport`, tool counts |
| `list_skills` | Paged skill list, filters `category`/`parentCategory` |
| `get_stats` | Counts per entity kind and per parent category |

All tools return both markdown `text` (default) and `structuredContent` (JSON),
are read-only/idempotent, and paginate with `offset` + `has_more`/`next_offset`.
Responses over `CHARACTER_LIMIT` (25,000) truncate with a pointer to filters.

## Resources

URI scheme `holygrail://{kind}/{slug}` with `kind ∈ sites | extensions | mcp | skills`:

- `holygrail://sites/appwrite` — full site JSON with preview image URLs
- `holygrail://mcp/playwright-mcp` — full MCP server JSON
- `holygrail://skills/audit-codebase` — full skill JSON with `installHint`

`resources/list` enumerates the full catalog (slug → name/description). Preview
images are URLs only — never binary blobs.

## Data & staleness

The server reads generated flat JSON — never YAML at runtime. Resolution order:

1. `HOLY_GRAIL_DATA_DIR` env var (explicit override)
2. Repo content dirs relative to the package (dev/monorepo mode)
3. Bundled snapshot (`data/*.json`) copied at publish time

The npm-distributed copy lags the live site until the next publish; repo/dev
mode and `HOLY_GRAIL_DATA_DIR` always read the current generated indexes.
Preview URLs are absolute when `HOLY_GRAIL_BASE_URL` is set, else relative paths.

## HTTP transport details

- One POST endpoint (`/mcp`); every request is an independent stateless
  JSON-RPC exchange — no sessions, no `initialize` handshake required.
- Required headers: `MCP-Protocol-Version` (except `initialize`, whose version
  lives in the body — the official SDK client sends no header on the first
  POST) and `Accept: application/json, text/event-stream`.
- `Mcp-Method` / `Mcp-Name` are validated when present (forward-compat with the
  2026-07-28 spec revision; the official SDK client does not emit them).
- Origin allowlist (DNS-rebinding protection): absent Origin → allow; unknown
  Origin → `403`. Defaults to `https://holy-grail-eta.vercel.app` + localhost; override with
  `HOLY_GRAIL_ALLOWED_ORIGINS` (comma-separated, `*` to allow all).
- Unknown RPC methods → `404` JSON-RPC `-32601`; non-POST → `405`.

## Development

```bash
bun run --cwd mcp build        # tsc → dist/
bun run --cwd mcp snapshot     # copy generated indexes into data/
bun test mcp/evals/search-corpus.test.ts   # pinned search corpus (port fidelity)
bunx vitest run tests/mcp-search-mirror.test.ts  # SPA useSmartSearch vs port parity
bun mcp/evals/run-evals.ts     # 10-question read-only eval suite
```

Repo scripts: `bun run build:mcp`, `bun run test:mcp-search`,
`bun run test:mcp-mirror`, `bun run test:mcp-evals`.

## Publishing

```bash
bun run build:mcp          # build + snapshot data
cd mcp && npm publish      # publishes holy-grail-mcp (bin: holy-grail-mcp)
```

The `prepublishOnly` hook re-runs build + snapshot. Published unscoped (the
`@holy-grail` npm scope is unclaimed); switch to a scoped name once the org
exists.
