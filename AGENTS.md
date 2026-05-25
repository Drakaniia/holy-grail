HOLY GRAIL — Agent Guidelines

## Stack
Vue 3 (Composition API + `<script setup>`) · Vite 8 · TypeScript · Tailwind CSS 3 · Pinia · Vue Router 5

## Package Manager
**Bun only.** Never use npm/yarn/pnpm.

## Commands
```
bun install                      # install deps
bun dev                          # dev server (auto-runs generate scripts first)
bun run build                    # production build (auto-runs generate scripts + typecheck)
bun run preview                  # preview production build
bun run type-check               # vue-tsc --noEmit
bun lint                         # oxlint --fix then eslint --fix --cache (sequential)
bun run format                   # prettier --write --experimental-cli src/
bun run generate:skills          # regenerate skills-index.json only
bun run import:bookmarks         # import bookmarks via scripts/import-bookmarks.js
bun run generate:previews        # capture missing site previews only
bun run generate:previews:all    # regenerate every site preview
```

## Site Previews — Critical
After adding a new site, **always generate its preview** or it will show blank in the UI.

Previews are static `.webp` files — they are NOT fetched at runtime. The script uses a local Chrome/Edge install via Puppeteer.

```
# Capture only the new site (fastest)
bun run scripts/generate-site-previews.js --slug <slug>

# Capture all missing previews
bun run generate:previews

# Regenerate everything
bun run generate:previews:all
```

Output files written per site:
- `public/previews/<slug>.webp` — full size (960×600)
- `public/previews/<slug>-sm.webp` — thumbnail (480×300)
- `public/previews/manifest.json` — updated automatically
- `src/content/site-previews.json` — imported by the app, must be committed

If the live site blocks Puppeteer (timeout/bot protection), the script automatically writes a **fallback SVG preview** so the entry is never blank. Commit the fallback — it's better than nothing.

Chrome/Edge must be installed locally. Set `PREVIEW_BROWSER_PATH` env var to override the auto-detected executable path.

## CI Order (on push/PR to `grail` branch)
`type-check` → `lint` → `build`

## Build Prerequisites — Critical
Both `dev` and `build` run two generation scripts **before** Vite starts:
- `scripts/generate-skills-index.js` — reads `src/content/skills/*/meta.yaml` → writes `src/content/skills-index.json`
- `scripts/generate-sites-index.js` — reads `src/content/sites/*/meta.yaml` → writes `src/content/sites-index.json`

These JSON files are imported directly by Pinia stores. If you add/edit a skill or site, the corresponding `meta.yaml` must exist and the index will be regenerated on next `dev`/`build`.

## Architecture
- **Entry**: `src/main.ts`
- **Routes**: `/` → `/sites/platforms` (redirect), `/sites/:category/:subcategory?`, `/sites/:slug`, `/skills` → `/skills/skills` (redirect), `/skills/:category`, `/skills/:slug`
- **Stores**: `src/stores/sites.ts` and `src/stores/skills.ts` — both load from generated JSON indexes (not API calls)
- **Skills store** fetches remote `SKILL.md` content from GitHub repos at runtime with localStorage cache (24h TTL)
- **`src/stores/counter.ts`** is boilerplate — unused, safe to ignore
- **Path alias**: `@/` → `./src/`
- **Deploy**: Vercel SPA, all routes rewrite to `index.html`

## Content Model
Skills and sites are defined as directories under `src/content/skills/` and `src/content/sites/`, each containing a `meta.yaml`.

- **Adding sites**: see `docs/ADDING-SITES.md`
- **Adding skills**: see `docs/ADDING-SKILLS.md`

## Linting
- **oxlint** runs first (correctness category = error), then **eslint** (Vue essential rules)
- ESLint config imports oxlint config via `eslint-plugin-oxlint` — they share rules
- Prettier config disables conflicting ESLint rules via `eslint-config-prettier`
- Run `bun lint` after any code change

## TypeScript
Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Project references: `tsconfig.app.json` (app) + `tsconfig.node.json` (tooling).

## Testing
No test framework is configured. Do not introduce one without asking.

## Skills
Available opencode skills: `vue`, `vue-best-practices`, `vue-pinia-best-practices`, `vite`, `typescript-advanced-types`, `oxlint`, `frontend-design`, `bun`, `web-design-guidelines`, `vue-debug-guides`. Read relevant skills before implementing.
