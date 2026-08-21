HOLY GRAIL — Docs Knowledge Base

**Root AGENTS.md at project root supersedes this file for project-wide rules.**

## What's in docs/

| File | Purpose |
|------|---------|
| `AGENTS.md` | [This file] Docs-specific knowledge |
| `DESIGN.md` | Design system, branding, UI tokens |
| `TODO.md` | Active task list / backlog |
| `packages/web/CHANGELOG.md` | Generated release changelog |
| `ADDING-SITES.md` | Guide for adding sites to the catalog |
| `ADDING-EXTENSIONS.md` | Guide for adding extensions to the catalog |
| `GRAIL-CLI.md` | Usage guide for the grail CLI tool |
| `SUPABASE-SUBMISSIONS.md` | Submission flow via Supabase |
| `.env.example` | Required env vars template |
| `RELEASE-v0.1.0.md` | Historical release notes |
| `skills.md` / `skills-lock.json` | Skills metadata |
| `superpowers/` | Specs + plans |

## IMPORTANT

- **Preview pipeline is critical** — after adding a site, run `bun run generate:previews --slug <slug>` or it shows blank in UI.
- **Content generators** run before every `dev` and `build`. Never hand-edit `*-index.json`.
- **Skills are loaded at runtime** from `skills-registry.json` — no build step needed.
- See `DESIGN.md` for design tokens, layout rules, and color palette.
- See `TODO.md` before starting any new feature to check for duplications.
