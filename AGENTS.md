# HOLY GRAIL — Project Knowledge Base

**Generated:** 2026-07-27
**Commit:** c15cbd9
**Branch:** grail

## OVERVIEW

Curated directory of developer tools, AI platforms, browser extensions, and learning resources. Vue 3 SPA with Vite 8, TypeScript 6, Tailwind CSS 4, Pinia 3, Vue Router 5, Supabase, PostHog. Hosted on Vercel. Content-driven via `meta.yaml` files.

## STRUCTURE

```
├── src/              # Vue 3 SPA (components, pages, stores, composables, content)
├── cli/              # Rust+TS CLI tool ("grail") — separate publishable package
├── scripts/          # Build generators, preview pipeline (Bun + Python)
├── supabase/         # Edge Functions + DB migrations
├── public/           # Static assets + generated previews
├── tests/            # Vitest tests (orphaned — not in CI or package.json scripts)
├── docs/             # Documentation + AGENTS.md
├── .github/          # CI workflows (type-check → lint → build → format:check)
├── .agents/          # OpenCode agent skills
├── .opencode/        # OpenCode runtime config
└── .vibe/            # Vibe config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a site | `src/content/sites/<category>/<slug>/meta.yaml` | Run generator + preview after |
| Add an extension | `src/content/extensions/<category>/<slug>/meta.yaml` | Run generator after |
| Add MCP server | `src/content/mcp/<slug>/meta.yaml` | Run generator after |
| Modify UI component | `src/components/<feature>/` | Feature-grouped |
| Add a page | `src/pages/` + `src/router/index.ts` | Lazy-loaded |
| Modify store | `src/stores/<domain>.ts` | Pinia |
| Add composable | `src/composables/use*.ts` | |
| Modify CI | `.github/workflows/` | 4 workflows |
| Modify deploy config | `vercel.json` | Vercel SPA |
| Edit CLI behavior | `cli/src/main.rs` | Rust source |
| Add site preview | `bun run generate:previews --slug <slug>` | Puppeteer → WebP |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `src/main.ts` | entry | Bootstraps PostHog, theme, Pinia, router | App mount |
| `src/App.vue` | component | Root layout shell | Navbar, Sidebar, RouterView |
| `src/router/index.ts` | config | All routes + auth guard | SPA routing |
| `useSitesStore` | store | `src/stores/sites.ts` | Site catalog state |
| `useSkillsStore` | store | `src/stores/skills.ts` | Skill catalog state |
| `useExtensionsStore` | store | `src/stores/extensions.ts` | Extension catalog state |
| `Site` | type | `src/stores/sites.ts` | Core domain model (24 callers) |
| `useSmartSearch` | composable | `src/composables/useSmartSearch.ts` | Cross-entity search |
| `generateSitePreviews` | script | `scripts/previews/` | Puppeteer screenshot pipeline |
| `grail` | CLI | `cli/src/main.rs` | Rust skill-management binary |

## CONVENTIONS

- **Bun only.** Never npm/yarn/pnpm. Node 24.x.
- **Vue 3 Composition API + `<script setup lang="ts">`** mandatory.
- **`@/` path alias** → `./src/`.
- **Content as YAML**: sites/extensions/mcp defined as `meta.yaml` files, flat-indexed to JSON at build.
- **3 generators run before every dev/build**: sites-index, extensions-index, mcp-index.
- **Previews are static .webp** — not fetched at runtime. Generate after adding a site.
- **Lint order**: oxlint (correctness) → eslint (Vue/TS rules).
- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`.
- **Conventional commits** on `grail` branch.

## ANTI-PATTERNS (THIS PROJECT)

- **Do not introduce a test framework** without asking. (Existing Vitest tests are orphaned.)
- **Do not use npm/yarn/pnpm.** Bun only.
- **Do not edit `*-index.json` by hand.** Run the generator.
- **Do not skip preview generation** after adding a site — blank in UI otherwise.
- **`src/stores/counter.ts`** is dead boilerplate. Safe to ignore/delete.

## COMMANDS

```bash
bun install                               # install deps
bun dev                                   # dev server (runs generators first)
bun run build                             # production build (generators + typecheck + vite)
bun run type-check                        # vue-tsc --noEmit
bun lint                                  # oxlint --fix → eslint --fix
bun run format                            # prettier --write
bun run generate:previews --slug <slug>    # single site preview
bun run build:cli                         # tsc + cargo build --release
```

## NOTES

- `vue-router` declared as `^5.2.0` — verify this resolves correctly (Vue 3 line is 4.x).
- Vite 8, TypeScript 6, Node 24 are bleeding-edge pins.
- Skills are NOT committed — loaded at runtime from `skills-registry.json`.
- The `cli/` is a separate publishable npm package (`grail`) wrapping a Rust binary.
- Content under `public/content/` and `public/previews/` is noindexed via Vercel headers.
- Project AGENTS.md was previously at `docs/AGENTS.md` — root supersedes.
