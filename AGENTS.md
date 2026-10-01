# HOLY GRAIL — Project Knowledge Base

**Generated:** 2026-08-21
**Branch:** grail

## OVERVIEW

Curated directory of developer tools, AI platforms, browser extensions, and learning resources. Vue 3 SPA with Vite 8, TypeScript 6, Tailwind CSS 4, Pinia 3, Vue Router 5, Supabase, PostHog. Hosted on Vercel. Content-driven via `meta.yaml` files.

Monorepo: **Bun workspaces** (`packages/*`) with a single lockfile, orchestrated by **Turborepo** (`turbo.json`). The web app is the workspace root package sibling — `packages/web` is the Vercel deployment root (vite root, `api/` functions, `public/` submodule).

## STRUCTURE

```
├── packages/
│   ├── web/            # Vue 3 SPA — deployment root for Vercel
│   │   ├── src/        #   components, pages, stores, composables, content
│   │   ├── public/     #   static assets + runtime JSON; previews submodule mounts here
│   │   ├── api/        #   Vercel serverless functions (/api/mcp → /mcp via vercel.json)
│   │   ├── scripts/    #   build generators, preview pipeline, enrichment (Bun + Python)
│   │   ├── tests/      #   Vitest tests
│   │   ├── index.html, vite.config.ts, tsconfig*.json, env.d.ts, vercel.json
│   │   └── package.json #  holy-grail-web (private)
│   ├── mcp/            # holy-grail-mcp — publishable npm package (MCP server)
│   ├── core/           # @holy-grail/core — private shared package (search scorer; build first)
│   ├── cli/            # grail-cli — publishable npm package (Rust+TS CLI)
│   ├── supabase/       # Edge Functions (Deno) + DB migrations — infra, no turbo tasks
│   └── docs/           # Documentation + AGENTS.md
├── turbo.json          # Task graph: build / type-check / dev (cargo + Deno NOT cached)
├── package.json        # Workspace root: workspaces + turbo + repo-wide lint/format scripts
├── .gitmodules         # Registers packages/web/public/previews → Drakaniia/holy-grail-assets
├── .githooks/          # Committed pre-commit hook (runs `bun run sync:previews`)
├── .github/            # CI workflows (type-check → lint → build → mcp tests → format:check)
├── .agents/            # OpenCode agent skills
├── .opencode/          # OpenCode runtime config
└── .vibe/              # Vibe config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a site | `packages/web/src/content/sites/<category>/<slug>/meta.yaml` | Run generator + preview after (preview lands in the submodule) |
| Add an extension | `packages/web/src/content/extensions/<category>/<slug>/meta.yaml` | Run generator after |
| Add MCP server | `packages/web/src/content/mcp/<slug>/meta.yaml` | Run generator after |
| Modify UI component | `packages/web/src/components/<feature>/` | Feature-grouped |
| Add a page | `packages/web/src/pages/` + `packages/web/src/router/index.ts` | Lazy-loaded |
| Modify store | `packages/web/src/stores/<domain>.ts` | Pinia |
| Add composable | `packages/web/src/composables/use*.ts` | |
| Modify CI | `.github/workflows/` | 6 workflows (ci, deploy-mcp, release, release-please, dependabot-auto-merge, update-skills-registry) |
| Modify deploy config | `packages/web/vercel.json` | Vercel SPA (deploys run from `packages/web`) |
| Edit CLI behavior | `packages/cli/src/main.rs` | Rust source |
| Edit MCP server | `packages/mcp/src/` | `bun run build:mcp` (tsc → data snapshot → bin bundle → Vercel function bundle) |
| Edit search scoring | `packages/core/src/index.ts` | Single shared scorer; both the SPA and MCP server import it. Consumers depend on its `dist/`, so build it first. |
| Add site preview | `bun run generate:previews --slug <slug>` | Puppeteer → WebP into `packages/web/public/previews/` (submodule worktree) |
| Fresh clone setup | `bun run setup` | Init previews submodule + install pre-commit hook |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `src/main.ts` | entry | `packages/web/src/main.ts` | Bootstraps PostHog, theme, Pinia, router |
| `src/App.vue` | component | `packages/web/src/App.vue` | Root layout shell (Navbar, Sidebar, RouterView) |
| `src/router/index.ts` | config | `packages/web/src/router/index.ts` | All routes + auth guard |
| `useSitesStore` | store | `packages/web/src/stores/sites.ts` | Site catalog state |
| `useSkillsStore` | store | `packages/web/src/stores/skills.ts` | Skill catalog state |
| `useExtensionsStore` | store | `packages/web/src/stores/extensions.ts` | Extension catalog state |
| `Site` | type | `packages/web/src/stores/sites.ts` | Core domain model (24 callers) |
| `useSmartSearch` | composable | `packages/web/src/composables/useSmartSearch.ts` | SPA cross-entity search; scoring delegated to `@holy-grail/core` |
| `generateSitePreviews` | script | `packages/web/scripts/previews/` | Puppeteer screenshot pipeline |
| `createServer` | MCP | `packages/mcp/src/server.ts` | Registers all 10 tools + resources |
| `searchCatalog` | MCP | `packages/mcp/src/search.ts` | MCP corpus + paginated search; scoring delegated to `@holy-grail/core` (same code as `useSmartSearch`) |
| `grail` | CLI | `packages/cli/src/main.rs` | Rust skill-management binary |

## CONVENTIONS

- **Bun only.** Never npm/yarn/pnpm. Node 24.x. Single root `bun.lock`; no per-package lockfiles.
- **Turborepo for the task graph**: `turbo run build|type-check|dev` (root `turbo.json`). `cargo` and Deno builds are **not** turbo tasks — `build:cli` shells to cargo directly, `packages/supabase` has no tasks.
- **Vue 3 Composition API + `<script setup lang="ts">`** mandatory.
- **`@/` path alias** → `./src/` (scoped to `packages/web`).
- **Content as YAML**: sites/extensions/mcp defined as `meta.yaml` files, flat-indexed to JSON at build.
- **3 generators run before every dev/build**: sites-index, extensions-index, mcp-index (`packages/web/scripts/build/`).
- **Previews are static .webp in a git submodule** — `packages/web/public/previews` mounts the public `Drakaniia/holy-grail-assets` repo. Generate after adding a site; the pre-commit hook commits + pushes the submodule and stages the gitlink.
- **Fresh clones must run `bun run setup`** (or clone with `--recurse-submodules`), or previews render as placeholders until the submodule is fetched.
- **Lint order**: oxlint (correctness) → eslint (Vue/TS rules). Both run repo-wide from the root.
- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`.
- **Conventional commits** on `grail` branch.
- **Deploys are CLI-only**: `git.deploymentEnabled: false` in `vercel.json`; the deploy workflow runs `vercel build/deploy` from `packages/web`. If git integration is ever re-enabled, set `rootDirectory: packages/web` in the Vercel project settings.

## ANTI-PATTERNS (THIS PROJECT)

- **Do not introduce a test framework** without asking. The only Vitest test is the SPA/MCP search-parity mirror, and it is wired into CI.
- **Do not use npm/yarn/pnpm.** Bun only.
- **Do not hand-edit `packages/mcp/data/`** — generated snapshot; regenerate via `bun run build:mcp`.
- **Do not edit `*-index.json` by hand.** Run the generator.
- **Do not skip preview generation** after adding a site — blank in UI otherwise.
- **Do not hand-edit files under `packages/web/public/previews/`** — submodule content; regenerate via the preview generator.
- **Do not commit with `--no-verify` while previews are dirty** — the parent commit would reference an unpushed submodule SHA and break clones/Vercel.
- **Do not add `packages/web` as a dependency of `packages/mcp`/`packages/cli`** — they are publishable npm packages; workspace deps on a private app break `npm publish`.
- **Keep `packages/core` `private`.** `packages/mcp`'s npm entry is esbuild-bundled (`bundle:bin`), so `@holy-grail/core` never needs to be published; flipping it to publishable would drag an unscoped private dep into the registry for no gain.

## COMMANDS

```bash
bun install                               # install all workspace deps (single lockfile)
bun dev                                   # turbo run dev → web dev (generators first + vite)
bun run build                             # generate + turbo run build (web vue-tsc+vite, core tsc, mcp tsc+snapshot+bundles, cli tsc)
bun run type-check                        # turbo run type-check (vue-tsc / tsc --noEmit per package)
bun lint                                  # oxlint --fix → eslint --fix (repo-wide)
bun run format                            # prettier --write (repo-wide)
bun run setup                             # git submodule update --init + git config core.hooksPath .githooks
bun run sync:previews                     # commit + push previews submodule, stage gitlink (runs in pre-commit hook)
bun run generate:previews --slug <slug>   # single site preview (writes into submodule worktree)
bun run build:cli                         # packages/cli: tsc + cargo build --release
bun run build:mcp                         # packages/mcp: tsc → snapshot → bin bundle → Vercel function bundle
turbo run build --filter=holy-grail-mcp   # build only the mcp package
bun run test:mcp-search  # pinned search corpus (ported scorer fidelity)
bun run test:mcp-mirror  # SPA useSmartSearch vs ported scorer parity
bun run test:mcp-evals   # 10-question read-only eval suite (stdio)

# Commit order: `git commit` first (hook pushes the submodule), then `git push` (parent only).
# Never edit *-index.json by hand and never commit preview .webp files directly into the parent.
```

`build:mcp` order matters: the snapshot step reads `INDEX_FILES` from `dist/constants.js`,
so `tsc` must run before `snapshot`. It never runs standalone.

## NOTES

- `vue-router` declared as `^5.3.1` — verify this resolves correctly (Vue 3 line is 4.x).
- Vite 8, TypeScript 6, Node 24 are bleeding-edge pins.
- Skills are NOT committed — loaded at runtime from `skills-registry.json`.
- `packages/mcp` (`holy-grail-mcp`) and `packages/cli` (`grail-cli`) are separate publishable npm packages. `packages/core` (`@holy-grail/core`) is private and shared by both `packages/web` and `packages/mcp`.
- Content under `packages/web/public/content/` and `packages/web/public/previews/` is noindexed via Vercel headers.
- Preview images (~19 MB, ~900 files) live in the separate public `holy-grail-assets` repo — they are NOT in main repo history, so `.git` no longer grows with binary assets.
- Supabase CLI operates on `packages/supabase` — run with `--workdir packages/supabase` (or `cd packages/supabase`).
- Project AGENTS.md was previously at `docs/AGENTS.md` — root supersedes; docs now live at `packages/docs/`.
