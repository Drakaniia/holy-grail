# Holy Grail MCP — AI Client Integration Guide

Connect AI coding tools to the [Holy Grail](https://holy-grail-eta.vercel.app) catalog:
search sites, Chrome extensions, MCP servers, and AI skills; fetch full entries by
slug; list by category; read entry resources. Read-only, no auth.

**Package:** `holy-grail-mcp` (npm, `@holy-grail/mcp` is unclaimed — do **not** use the scoped name)
**Remote endpoint:** `https://holy-grail-eta.vercel.app/mcp` (streamable HTTP, stateless)

Two transports:

| Transport | When | Command / URL |
|---|---|---|
| stdio (local) | Claude Code, Cursor, Windsurf, opencode, Claude Desktop | `npx -y holy-grail-mcp` |
| Streamable HTTP (remote) | any client with a remote/HTTP MCP config | `https://holy-grail-eta.vercel.app/mcp` |

---

## Quick start (local stdio)

```bash
npx -y holy-grail-mcp
```

The server waits on stdio. Verify it with the official Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: stdio
# Command: npx -y holy-grail-mcp
```

Expect 10 tools (`search`, `get_site`, `get_extension`, `get_mcp_server`, `get_skill`,
`list_sites`, `list_extensions`, `list_mcp_servers`, `list_skills`, `get_stats`) and
`holygrail://{sites|extensions|mcp|skills}/{slug}` resources.

---

## Claude Code

### CLI (user scope, one command)

```bash
claude mcp add --scope user holy-grail -- npx -y holy-grail-mcp
```

### Project config (`.mcp.json` at repo root, committed)

```json
{
  "mcpServers": {
    "holy-grail": {
      "command": "npx",
      "args": ["-y", "holy-grail-mcp"]
    }
  }
}
```

Then `/mcp` in Claude Code lists the tools; ask e.g. "search the Holy Grail catalog
for browser automation tools".

---

## Cursor

### Settings UI

`Cursor Settings → MCP → + Add new MCP server`:

- Type: **command** (stdio)
- Name: `holy-grail`
- Command: `npx -y holy-grail-mcp`

Or Type: **sse/http** → URL: `https://holy-grail-eta.vercel.app/mcp`.

### Project config (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "holy-grail": {
      "command": "npx",
      "args": ["-y", "holy-grail-mcp"]
    }
  }
}
```

---

## Windsurf

Windsurf settings → MCP → add server:

- Name: `holy-grail`
- Command: `npx -y holy-grail-mcp` (stdio)
- or URL: `https://holy-grail-eta.vercel.app/mcp` (HTTP)

---

## opencode

`opencode.json` (project or global):

```json
{
  "mcp": {
    "holy-grail": {
      "type": "local",
      "command": ["npx", "-y", "holy-grail-mcp"]
    }
  }
}
```

For the remote endpoint use `"type": "remote", "url": "https://holy-grail-eta.vercel.app/mcp"`.

---

## Claude Desktop / Claude web

### Claude Desktop (config file)

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "holy-grail": {
      "command": "npx",
      "args": ["-y", "holy-grail-mcp"]
    }
  }
}
```

### Claude web (Custom Connectors)

Add the remote endpoint `https://holy-grail-eta.vercel.app/mcp` as a connector.
Note: the server is intentionally unauthenticated; the connector flow may expect
OAuth — verify manually before relying on it.

---

## Remote endpoint details

Any client with an HTTP/remote MCP config can point at
`https://holy-grail-eta.vercel.app/mcp`:

- Stateless: every POST is an independent JSON-RPC exchange; no sessions, no
  `initialize` handshake required.
- Required headers: `MCP-Protocol-Version` (`2025-11-25` or older supported) and
  `Accept: application/json, text/event-stream`.
- `Mcp-Method` / `Mcp-Name` are validated when present (the official SDK client
  doesn't send them).
- Origin allowlist (browser clients): `https://holy-grail-eta.vercel.app` +
  `https://holy-grail-drakaniias-projects.vercel.app` + localhost. Unknown Origin
  → `403`; absent Origin → allowed (curl, Inspector, non-browser clients).

---

## Verification

```bash
# local stdio
bunx holy-grail-mcp                       # blocks on stdio — drive with a client
npx @modelcontextprotocol/inspector       # GUI verification, both transports

# remote endpoint
bun mcp/scripts/verify-remote.mjs https://holy-grail-eta.vercel.app/mcp
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `404` on `bunx @holy-grail/mcp` | The `@holy-grail` npm scope is unclaimed. Use `npx -y holy-grail-mcp` (unscoped). |
| No tools in Claude Code | Server died — check with `/mcp` and run the command manually; Bun/Node ≥ 18 required. |
| `403 Forbidden: unknown Origin` | Browser client sending an Origin outside the allowlist (custom domain). Set `HOLY_GRAIL_ALLOWED_ORIGINS` or use a non-browser client. |
| Stale data | npm copy carries a snapshot taken at publish time. Repo/dev mode and `HOLY_GRAIL_DATA_DIR` read live indexes. |
