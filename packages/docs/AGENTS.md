HOLY GRAIL — Docs Knowledge Base

**Root AGENTS.md at project root supersedes this file for project-wide rules.**

## What's in docs/

| File | Purpose |
|------|---------|
| `AGENTS.md` | [This file] Docs-specific knowledge |
| `DESIGN.md` | Design system, branding, UI tokens |
| `TODO.md` | Active task list / backlog |
| `ADDING-SITES.md` | Guide for adding sites to the catalog |
| `ADDING-EXTENSIONS.md` | Guide for adding extensions to the catalog |
| `GRAIL-CLI.md` | Usage guide for the grail CLI tool |
| `MCP-INTEGRATION.md` | MCP client setup + transport/troubleshooting |
| `holy-grail-mcp-spec.md` | Design spec for the MCP server package |
| `21ST-DEV-SIDEBAR.md` | Sidebar 21st.dev design notes |
| `.env.example` | Required env vars template |
| `skills.md` / `skills-lock.json` | Local agent skills metadata |

Release changelogs live outside this directory: `CHANGELOG.md` (repo root) and
`packages/web/CHANGELOG.md`.

## IMPORTANT

- **Preview pipeline is critical** — after adding a site, run `bun run generate:previews --slug <slug>` or it shows blank in UI.
- **Content generators** run before every `dev` and `build`. Never hand-edit `*-index.json`.
- **Skills are loaded at runtime** from `skills-registry.json` — no build step needed.
- See `DESIGN.md` for design tokens, layout rules, and color palette.
- See `TODO.md` before starting any new feature to check for duplications.
