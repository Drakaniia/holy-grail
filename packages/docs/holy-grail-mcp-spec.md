# Holy Grail MCP Server — Specification

**Status:** Draft — interview captured, no code written yet
**Date:** 2026-08-21
**Repo:** `holy-grail` (branch `grail`)

---

## 1. Goal

Build **our own MCP server** that exposes the Holy Grail catalog — sites, Chrome
extensions, MCP servers, and skills — to AI agents as MCP tools and resources.
Agenets can search the catalog, fetch full entries by slug, list by category, and
read entry resources, with the same quality of search the SPA provides.

This is a dogfooding play: the project catalogs MCP servers, so it ships one.

## 2. Decisions (captured from interview)

| Decision | Choice |
|---|---|
| Meaning | MCP server exposing Holy Grail's catalog data |
| Audience | Both — our own agents (Claude Code / opencode) and public developers |
| Location | New package in this repo, sibling to `packages/cli/` → `packages/mcp/` |
| Stack | TypeScript + official MCP SDK (`@modelcontextprotocol/sdk`), run under **Bun** (repo convention: Bun only, Node 24) |
| Transport | **Both** — stdio (local) and streamable HTTP (remote) |
| Capability surface | Tools + resources |
| Read/write | **Read-only** — catalog is public content; agents never mutate anything |
| Data source | Generated JSON indexes (same data the SPA serves) |
| Tool design | Hybrid — one cross-entity search tool + per-entity getters/lists |
| HTTP hosting | Vercel serverless function (project already on Vercel) |
| Auth | None — public read-only, same stance as the public site |
| Dogfood | Yes — add the server as its own catalog entry (`meta.yaml` + regenerated index) |
| npm | Yes — publish as `@holy-grail/mcp`, install via `bunx @holy-grail/mcp` |
| Resources | Entries (slug-addressed) + preview image **URLs** (never binary blobs) |
| Evals | Yes — 10-question read-only evaluation set + runner (mcp-builder Phase 4) |
| Search match fields | name, description, tags, category, website |

## 3. Data Sources (read-only, generated JSON)

All indexes are flat JSON generated from `meta.yaml` before every `dev`/`build`
(`packages/web/scripts/build/generate-{sites,extensions,mcp}-index.js`). The MCP server reads
these — never parses YAML at runtime.

| Index | Location | Record shape (relevant fields) |
|---|---|---|
| Sites | `packages/web/src/content/sites-index.json` | `slug, name, description, category, parentCategory, subcategory, stars, watchers, addedDaysAgo, license, lastCommit, lastRelease, version, contributors, commitsThisYear, releases, platforms, deployment, website, docs, sourceCode, icon, verified, featured, tags, atGlance, fullDescription, coreFeatures, additionalFeatures, deployCompose, installCommand, similarTools` |
| Extensions | `packages/web/src/content/extensions-index.json` | `slug, name, description, category, parentCategory, subcategory, version, addedDaysAgo, license, website, docs, sourceCode, icon, verified, featured, tags, atGlance, fullDescription` |
| MCP servers | `packages/web/src/content/mcp-index.json` | `slug, name, description, category, parentCategory, icon, verified, featured, tags, website, docs, sourceCode, installCommand, transport ('stdio'\|'http'\|'websocket'), tools[{name,description}], connections` |
| Skills | `packages/web/public/content/skills-registry.json` | `slug, title, description, category, parentCategory, tags, views, uses, author, authorName, repoLink, skillPath, branch, addedBy, featured, dateAdded, hasLocalContent` |
| Previews | `packages/web/src/content/site-previews.json` | `slug → { image, small, sourceUrl, capturedAt, width, height }` (paths like `/previews/needmcp.webp`) |

**Loader resolution order** (`src/data.ts`):
1. `HOLY_GRAIL_DATA_DIR` env var (explicit override).
2. Repo content dir relative to package location (dev/monorepo mode).
3. Bundled snapshot copied into the package at publish time (see §8 staleness tradeoff).

**Payload note:** `sites-index.json` is large and includes `deployCompose`
(full docker-compose YAML strings). Apply `CHARACTER_LIMIT` truncation (see §5.4).

## 4. Package Layout (`packages/mcp/`)

```
packages/mcp/
├── package.json          # name @holy-grail/mcp, type: module, bin { "holy-grail-mcp": "dist/index.js" }
├── tsconfig.json         # strict, module/moduleResolution Node16, outDir dist
├── README.md             # install, transport config, tool list, client examples
├── src/
│   ├── index.ts          # entry — picks transport (stdio default; TRANSPORT=http or --http)
│   ├── server.ts         # McpServer init; registers tools + resources
│   ├── data.ts           # index loaders (resolution order above)
│   ├── search.ts         # ported pure scoring functions (from useSmartSearch)
│   ├── types.ts          # Site, Extension, McpServer, Skill, Preview interfaces
│   ├── format.ts         # markdown/json formatting, CHARACTER_LIMIT truncation
│   ├── constants.ts      # data dirs, API URLs, limits
│   ├── tools/            # search.ts, sites.ts, extensions.ts, mcp.ts, skills.ts, stats.ts
│   └── resources/        # resource registration + URI handlers
└── evals/
    ├── questions.xml     # 10 read-only QA pairs
    └── run-evals.ts      # runner (spawns server, calls tools, compares answers)
```

## 5. MCP Surface

### 5.1 Server identity

- Server name (SDK `McpServer`): `holy-grail-mcp-server` (per mcp-builder naming
  convention `{service}-mcp-server`).
- npm package: `@holy-grail/mcp`; bin name `holy-grail-mcp`.
- Version: `1.0.0` (aligns with repo).

### 5.2 Tools (snake_case, service-prefixed where needed)

All tools: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`,
`openWorldHint: true`; Zod `.strict()` schemas; explicit `title` + `description`
with args/returns/examples; return both `text` (markdown by default) and
`structuredContent`.

| Tool | Params | Returns |
|---|---|---|
| `search` | `query` (min 2, max 200), `limit` (1–50, default 10), `offset` (default 0), `response_format` (markdown\|json, default markdown) | Cross-entity results: `kind` (site/extension/mcp/skill), `slug`, `name`, `description`, `score`, `matchStrength`, `route`; `total`, `has_more`, `next_offset` |
| `get_site` | `slug` (required) | Full site record incl. `similarTools`, preview URLs |
| `get_extension` | `slug` (required) | Full extension record |
| `get_mcp_server` | `slug` (required) | Full MCP server record incl. `tools`, `connections` |
| `get_skill` | `slug` (required) | Full skill record incl. `repoLink`, `skillPath`, `installHint` |
| `list_sites` | `parentCategory?`, `category?`, `limit` (1–100, default 20), `offset`, `response_format` | Paged site list (compact: slug, name, category, stars) |
| `list_extensions` | `parentCategory?`, `category?`, `limit`, `offset`, `response_format` | Paged extension list |
| `list_mcp_servers` | `category?`, `transport?`, `limit`, `offset`, `response_format` | Paged MCP server list incl. `tools` count |
| `list_skills` | `category?`, `parentCategory?`, `limit`, `offset`, `response_format` | Paged skill list |
| `get_stats` | — | Counts per entity kind and per parent category (mirrors sidebar counts) |

**Search behavior** (§3 decision): matches name, description, tags, category, website.
Scoring must mirror the SPA (see §6). `MAX_RESULTS` default 10; `limit` caps 50.

### 5.3 Resources

URI scheme: `holygrail://{kind}/{slug}` where kind ∈ `sites | extensions | mcp | skills`.

- `registerResource` for each template:
  - `holygrail://sites/{slug}` — full site JSON, `mimeType: application/json`
  - `holygrail://extensions/{slug}`
  - `holygrail://mcp/{slug}`
  - `holygrail://skills/{slug}`
- `registerResourceList` enumerates all resources (slug → name/description), paged.
- Preview images: included in resource payloads as URLs only (`image`, `small`,
  `width`, `height`, `capturedAt` from `site-previews.json`), absolutized with
  `HOLY_GRAIL_BASE_URL` if set, else relative paths. Never fetched or embedded as blobs.

### 5.4 Formatting & limits

- `CHARACTER_LIMIT = 25000` in `constants.ts`; oversized responses truncate with
  `truncated: true` + message directing to `offset`/filters.
- Markdown format: compact human-readable (headers, bullet lists, omit verbose
  fields like `deployCompose`, `fullDescription` truncated). JSON format: complete
  record. `response_format` defaults to markdown for agent context efficiency.
- Missing slug → actionable error: "No site with slug 'X'. Use search or list_sites
  to find valid slugs." Never an empty throw.

## 6. Search Port (`useSmartSearch` → `search.ts`)

Port only the **pure** functions from `packages/web/src/composables/useSmartSearch.ts`:

- `normalizeText`, `tokenize`, `compactText`
- `scoreSearchItem`, `getExactTokenBoost`, `getTextSimilarity`, `getTextSimilarityCompact`
- `getOrderedCharacterScore`, `getNearestWordScore`, `levenshtein`, `getMatchStrength`
- Scoring constants: `DIRECT_MATCH_SCORE = 205`, `CLOSE_MATCH_SCORE = 118`

**Do not** port Vue/store-dependent pieces (`useSmartSearch` composable itself,
`createNavigationItem`, favicon helpers, cache — replace the cache with a simple
module-level `Map` keyed `query → slug → score`, cleared when data reloads).

**Coupling decision:** `packages/mcp/` is a standalone publishable package; do **not** import
from `packages/web/src/` (SPA code). Port the functions verbatim into `mcp/src/search.ts` and add
a mirrored-behavior test comparing a fixed corpus of queries against expected SPA
results to catch drift. A shared `shared/` package is over-engineering for now —
revisit only if the SPA search changes materially.

**Field weights (verbatim from SPA `createSearchFields`, `useSmartSearch.ts:126-146`):**

| Field | Weight |
|---|---|
| title | 118 |
| titleWithDomain (name + domain label; sites/extensions/MCP only) | 126 |
| domain (labels derived from website/docs/sourceCode URLs) | 112 |
| tags | 96 |
| category (category path + parentCategory + subcategory) | 84 |
| description | 62 |
| source (website/docs/sourceCode URLs + domain text) | 38 |

Thresholds: `DIRECT_MATCH_SCORE = 205`, `CLOSE_MATCH_SCORE = 118`; `MAX_RESULTS = 10`.

**Per-kind field layout** — all kinds use the same weights; only the field set varies:

| Kind | Fields | Popularity (tie-break) |
|---|---|---|
| site | title, titleWithDomain, domain, tags, category, description, source — identical to SPA `siteToSearchItem` (`useSmartSearch.ts:374-407`) | `stars + watchers` |
| extension | same layout as site (name, description, category, tags, website/docs/sourceCode) | 0 (no metric in index) |
| mcp server | same as extension, plus tool names + connections appended to the description field — improves discoverability (query "navigate" should hit playwright-mcp) | 0 |
| skill | title, tags, category, description, source — identical to SPA `skillToSearchItem` (`useSmartSearch.ts:409-433`); no domain fields | `views + uses` |

Match fields stay within the interview decision (name/description/tags/category/
website); tool names ride in via `description`, no extra match fields.

### 6.1 Search-drift corpus (pinned fixture)

`evals/search-corpus.json` — query → expected top-1 slug. Draft expectations based
on real catalog entries sampled 2026-08-21; **validate every row against the live
SPA during implementation** and adjust any ambiguous one.

| Query | Expected top-1 | Kind |
|---|---|---|
| browser automation | playwright-mcp | mcp |
| postgres database | supabase-mcp | mcp |
| backend platform | appwrite | site |
| workflow automation | n8n | site |
| full page screenshot | gofullpage | extension |
| ad blocker | ublock-origin | extension |
| markdown webpage | md-this-page | extension |
| codebase audit | audit-codebase | skill |
| machine learning | tensorflow | site |
| deployment platform | vercel | site |
| opencode | opencode-cli | site |
| download video | video-download-helper | extension |

Mirrored-behavior test asserts: top-1 slug matches expected for every row, and for
site/skill rows the ported scorer's top-1 also matches `useSmartSearch` run on the
same corpus (extensions/MCP have no SPA counterpart — the port is the reference).

## 7. Transport

### 7.1 stdio (default)

`bunx @holy-grail/mcp` → `StdioServerTransport`. Zero config; used by Claude Code
and opencode via their MCP client configs. Errors to stderr.

### 7.2 Streamable HTTP (remote) — protocol facts (spec 2026-07-28)

Selected via `TRANSPORT=http` or `--http`. The 2026-07-28 spec revision **removed
protocol-level sessions and the `initialize` handshake** — every request is an
independent POST answered with a single JSON object or a request-scoped SSE stream.
This is exactly the stateless model a serverless function wants; no session store
needed. Verified from the spec page
(`/specification/2026-07-28/basic/transports/streamable-http`):

- Server exposes ONE POST endpoint (e.g. `/mcp` or `/api/mcp`).
- REQUIRED on every POST: `Accept: application/json, text/event-stream`, and the
  `MCP-Protocol-Version` header (must match the body's
  `_meta.io.modelcontextprotocol/protocolVersion`). Spec also requires
  `Mcp-Method` (all requests) and `Mcp-Name` (`tools/call`, `resources/read`,
  `prompts/get`).
- Version mismatch → `400` `HeaderMismatch`; unsupported version → `400`
  `UnsupportedProtocolVersionError`; unknown RPC method → `404` JSON-RPC `-32601`.
- Server MUST validate `Origin` (invalid → `403`) — DNS-rebinding protection.
- Cancellation = client closes the SSE response stream; `notifications/cancelled`
  is stdio-only.
- SSE responses SHOULD send `X-Accel-Buffering: no`.

**SDK note:** verify the pinned `@modelcontextprotocol/sdk` handles the 2026-07-28
header requirements and Origin validation out of the box; add a thin middleware for
anything missing. Local dev runs under Bun; **Vercel functions run Node** — the
server code must be runtime-agnostic (the TS SDK is).

### 7.3 Vercel function shape (decision)

- `packages/web/api/mcp.mjs` — Vercel Function (Node runtime) exporting the MCP endpoint at
  `/api/mcp` via `StreamableHTTPServerTransport`.
- Optional friendly path: add rewrite `{ "source": "/mcp", "destination": "/api/mcp" }`
  BEFORE the existing `/(.*)` catch-all in `vercel.json`. Functions resolve before
  fallback rewrites, so the catch-all never hijacks `/api/mcp`; the ordered rewrite
  adds the `/mcp` alias.
- `Origin` allowlist: absent/empty Origin → allow (curl, Inspector, non-browser
  clients); present + unknown → `403`; allowlist = the site domain + MCP Inspector.
- No auth (interview decision) — README documents the endpoint as a public
  read-only API.
- Cold start: lazy-load each index on first use with a module-level cache per
  function instance; bump `maxDuration` only if real traffic shows timeouts.
- The global `/(.*)` CSP header also applies to `/api/mcp` responses — harmless for
  JSON/SSE bodies (no browser page context); leave as-is.

### 7.4 Client support matrix (verify at implementation)

| Client | Local stdio | Remote streamable HTTP | Notes |
|---|---|---|---|
| Claude Code | ✅ — our primary self-use path | ⚠️ | stdio via MCP config; remote support varies by version |
| opencode | ✅ | ⚠️ | stdio via `opencode.json` `mcp` config; remote server type exists |
| Claude Desktop / Claude web | — | ✅ via Custom Connectors | connector flow may expect OAuth ("most remote servers require authentication") — no-auth server needs manual verification |
| MCP Inspector | ✅ | ✅ | official verification tool for both transports |
| Cursor / Windsurf | ✅ | ✅ | remote streamable HTTP in current versions |

Since 2026-07-28 removed sessions, the old "clients require sessions" risk is gone;
the remaining unknown is per-client remote support and auth-optionality — hence
"verify at implementation" for the remote column. stdio is the safe default for
our own agents.

## 8. Publishing & Dogfooding

### 8.1 npm publish

- Package `@holy-grail/mcp`, publishable like `packages/cli/` (which already publishes a
  package wrapping the Rust binary).
- **Name availability (verified 2026-08-21):** `@holy-grail/mcp` and the fallback
  `holy-grail-mcp` are both unclaimed on npmjs (registry returns 404 for both).
  Publishing under `@holy-grail` requires claiming that scope as an npm org at
  npmjs.com — if scope claiming is friction, publish unscoped `holy-grail-mcp`
  instead. Try `@holy-grail/mcp` first.
- Pre-publish step (`bun run build:mcp` → tsc, then a copy step bundling the current
  generated indexes into the package as `data/*.json` snapshot — satisfies the
  loader's fallback path). Staleness of the snapshot vs. live site is a documented
  tradeoff: npm-distributed copy lags until the next publish; repo/dev mode and
  `HOLY_GRAIL_DATA_DIR` always read live generated indexes.

### 8.2 Catalog entry (dogfood)

New file `packages/web/src/content/mcp/development/holy-grail-mcp/meta.yaml` following the
existing entry schema (see `playwright-mcp/meta.yaml`):

- `slug: holy-grail-mcp`, `name: Holy Grail MCP`, `category: Development`,
  `parentCategory: development`
- `installCommand: bunx @holy-grail/mcp`, `transport: stdio`
- `sourceCode` → repo URL; `website`/`docs` → repo README
- `tools:` list mirroring §5.2 (name + one-line description each)
- Then run `bun run generate:mcp` (regenerates `mcp-index.json` + public mirror).
  No preview generation — previews are site-only.

### 8.3 Repo hygiene

- Add `mcp/` to the prettier `format`/`format:check` globs in `package.json`.
- oxlint covers `.` already; ensure `mcp/tsconfig.json` passes `vue-tsc`-style
  strict checks via its own `tsc` build (`bun run build:mcp`).
- Conventional commit on `grail` branch; no `--no-verify`.

## 9. Evaluations (mcp-builder Phase 4)

- `evals/questions.xml`: 10 QA pairs, each — independent, read-only, requires
  multiple tool calls / deep exploration, realistic, single verifiable answer,
  stable over time. Examples: "Which MCP server in the catalog automates browser
  testing?" → playwright-mcp; "Find a site whose license is BSD-3-Clause and
  category is Backend" → appwrite; "How many skills are authored by Drakaniia?".
- `evals/run-evals.ts`: spawns the server (stdio), answers each question by calling
  tools, compares against expected answer, exits non-zero on mismatch.
- Runs in CI? Recommend a `test:mcp-evals` script; add to CI only if cheap enough —
  otherwise local pre-publish gate.

## 10. Verification & Acceptance Criteria

1. `bun run build:mcp` compiles clean (strict TS).
2. `bunx @holy-grail/mcp` serves stdio; connect from Claude Code / opencode config
   and call `search` + `get_site` successfully (MCP Inspector as backup:
   `npx @modelcontextprotocol/inspector`).
3. `TRANSPORT=http bunx @holy-grail/mcp` serves `POST /mcp` locally; same calls
   succeed over HTTP.
4. Search results for representative queries match the SPA's `useSmartSearch`
   behavior (mirrored-behavior test, §6).
5. Resources `holygrail://sites/{slug}` etc. resolve with JSON payloads; preview
   URLs present.
6. Catalog entry visible: `mcp-index.json` regenerated, SPA MCP section lists
   `holy-grail-mcp` after `bun dev`.
7. `npm publish --dry-run` passes; name not taken.
8. Eval suite: 10/10 pass.
9. README documents install, transports, supported clients, data staleness.

## 11. Open Questions / Risks

- SDK version: confirm the pinned `@modelcontextprotocol/sdk` implements the
  2026-07-28 header requirements (`MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`)
  and Origin validation; add middleware for gaps (§7.2).
- Claude Custom Connectors with a no-auth server: the connector flow may expect
  OAuth — manual verification required before advertising the remote endpoint for
  Claude (§7.4).
- npm scope claim: `@holy-grail` org must be claimed at npmjs.com, or fall back to
  unscoped `holy-grail-mcp` (both verified unclaimed 2026-08-21, §8.1).
- Search drift between ported `search.ts` and future SPA changes — mitigated by the
  pinned corpus test (§6.1), needs a maintenance owner.
- `sites-index.json` payload size vs. function cold start / memory limits —
  mitigated by lazy per-kind loading + `CHARACTER_LIMIT` truncation.
- Search-drift corpus rows are draft expectations; validate top-1 slugs against the
  live SPA during implementation (§6.1).
