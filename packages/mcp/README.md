# Holy Grail MCP

MCP server exposing the [Holy Grail](https://holy-grail-eta.vercel.app) catalog — sites,
Chrome extensions, MCP servers, and AI skills — to AI agents as tools, resources
and prompts. Same search quality as the SPA (the scoring engine is shared with
`useSmartSearch` via `@holy-grail/core`).

Agents can search and browse the live catalog, fetch full records, download and
install skills, and suggest new entries. Suggestions go to a moderated queue, so
nothing in the catalog changes without review. No account or API key is needed.

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
bun packages/mcp/dist/index.js              # stdio
TRANSPORT=http bun packages/mcp/dist/index.js  # HTTP on :3000
```

No auth, no API key — public data, same stance as the site. A visual setup page
with per-client snippets lives at `/mcp-server` on the site.

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
Inspector): [packages/docs/MCP-INTEGRATION.md](https://github.com/Drakaniia/holy-grail/blob/grail/packages/docs/MCP-INTEGRATION.md).

## Tools

| Tool | Description |
|---|---|
| `search` | Cross-entity search (sites, extensions, MCP servers, skills) with SPA-identical scoring. Params: `query`, `kind`, `limit`, `offset`, `response_format` |
| `get_site` | Full site record by slug, incl. preview image URLs |
| `get_extension` | Full Chrome extension record by slug |
| `get_mcp_server` | Full MCP server record by slug, incl. tools and connections |
| `get_skill` | Full skill record by slug, incl. `installHint` (`npx grail add <repo> --skill <slug>`) |
| `list_sites` | Paged site list, filters `parentCategory`/`category`, sorted by stars |
| `list_extensions` | Paged extension list, filters `parentCategory`/`category` |
| `list_mcp_servers` | Paged MCP server list, filters `category`/`transport`, tool counts |
| `list_skills` | Paged skill list, filters `category`/`parentCategory` |
| `get_stats` | Counts per entity kind and per parent category, plus the data source (live/snapshot) |
| `list_categories` | Category tree (parent → category → subcategory) with counts, per kind |
| `list_tags` | Most-used tags with per-kind counts |
| `find_by_tags` | Items carrying the given tags (`match: all \| any`), paged |
| `get_trending` | Newest, most popular or featured items |
| `get_related` | Alternatives/complements for an item (similar tools, category, tags, description) |
| `get_skill_files` | A skill's SKILL.md + supporting files from GitHub, with install instructions |
| `install_skill` | **stdio only.** Writes a skill into `.claude/skills` / `.agents/skills` (project or user) or a custom dir |
| `submit_site` | Suggest a site for the catalog (moderated queue, duplicate-checked, `dry_run` preview) |
| `submit_mcp_server` | Suggest an MCP server for the catalog (same queue) |

The hosted endpoint registers every tool except `install_skill` (it cannot
write to the caller's disk). `get_*` tools accept `response_format: "json"` for
the complete record. Read tools return both markdown `text` (default) and
`structuredContent`, are annotated read-only/idempotent, and paginate with
`offset` + `has_more`/`next_offset`. Responses over `CHARACTER_LIMIT` (25,000)
truncate with a pointer to filters (`get_skill_files` allows 100,000 and lists
the rest as `omitted`).

Submissions go to the site's `submit-tool` Edge Function: validated,
rate-limited per IP and stored as `pending` for moderators. On the hosted
endpoint all callers share the function's per-IP limit.

## Prompts

| Prompt | Arguments | What it does |
|---|---|---|
| `recommend_tools` | `task`, `kind?` | Pre-searches the catalog and asks for 3–5 justified picks |
| `compare_items` | `kind`, `slugs` | Attaches up to 5 full records for a side-by-side comparison |
| `find_mcp_server` | `capability` | Shortlists MCP servers and asks for an install command + config |
| `setup_skill` | `slug` | Walks through installing a skill (uses `install_skill` locally) |
| `submit_to_catalog` | `url`, `notes?` | Duplicate-checks, drafts and (after confirmation) sends a suggestion |

`kind` and slug arguments support `completion/complete`.

## Resources

URI scheme `holygrail://{kind}/{slug}` with `kind ∈ sites | extensions | mcp | skills`:

- `holygrail://sites/appwrite` — full site JSON with preview image URLs
- `holygrail://mcp/playwright-mcp` — full MCP server JSON
- `holygrail://skills/audit-codebase` — full skill JSON with `installHint`

`resources/list` enumerates the full catalog (slug → name/description). Preview
images are URLs only — never binary blobs.

## Data & staleness

The server reads generated flat JSON — never YAML at runtime. Base data:

1. Repo content dirs relative to the package — `../web/public/content/` (dev/monorepo mode)
2. Bundled snapshot (`data/*.json`) copied at publish time (the Vercel function inlines it)

**Live mode** (default outside the monorepo, including the hosted endpoint):
the sites/extensions/MCP/skills indexes are re-fetched from the deployed site
at most every 5 minutes. The first request waits for the fetch (8 s timeout);
later refreshes run in the background. Any failure keeps serving the current
data. `get_stats` reports `data.source`, `fetchedAt` and `lastError`.

| Env var | Effect |
|---|---|
| `HOLY_GRAIL_LIVE` | `0` = snapshot/repo data only, `1` = force live (default: live unless running in the monorepo) |
| `HOLY_GRAIL_BASE_URL` | Site to fetch live data from (default: the public site); also absolutizes preview URLs |
| `GITHUB_TOKEN` / `GH_TOKEN` | Raises GitHub API limits for `get_skill_files` / `install_skill` |
| `HOLY_GRAIL_PROJECT_DIR` | Project dir for `install_skill` project scope (default: server cwd) |
| `HOLY_GRAIL_SUPABASE_URL` | Supabase project hosting `submit-tool` |
| `HOLY_GRAIL_SUPABASE_KEY` | Optional publishable key sent with submissions |
| `HOLY_GRAIL_SUBMIT_ORIGIN` | Origin presented to `submit-tool`'s allowlist (default: the public site) |

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
bun run --cwd packages/mcp build        # tsc → dist/ + data snapshot + bundles
bun run --cwd packages/mcp snapshot     # copy generated indexes into data/ (needs dist/)
bun test packages/mcp/evals/search-corpus.test.ts   # pinned search corpus (port fidelity)
bun run --cwd packages/web test:mcp-mirror          # SPA useSmartSearch vs port parity
bun packages/mcp/evals/run-evals.ts     # 10-question read-only eval suite
```

Repo scripts: `bun run build:mcp`, `bun run test:mcp-search`,
`bun run test:mcp-mirror`, `bun run test:mcp-evals`.

## Publishing

```bash
bun run build:mcp          # build + snapshot data
cd packages/mcp && npm publish      # publishes holy-grail-mcp (bin: holy-grail-mcp)
```

The `prepublishOnly` hook re-runs build + snapshot. Published unscoped (the
`@holy-grail` npm scope is unclaimed); switch to a scoped name once the org
exists.
