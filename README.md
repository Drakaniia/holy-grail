# Holy Grail

A curated directory of development tools, AI platforms, and developer resources — built with Vue 3 and Tailwind.

## Tech Stack

- Vue 3 (Composition API + `<script setup>`)
- Vite 8
- TypeScript
- Tailwind CSS 4
- Pinia (state management)
- Vue Router 5
- Supabase (auth & submissions)
- MDX (markdown components)

## Prerequisites

- [Bun](https://bun.sh/) (package manager)
- Node.js 24.x
- Chrome or Edge (for site preview generation)

## Getting Started

```bash
bun install

bun dev
```

The dev server runs index generation scripts automatically before starting.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build (includes type-check) |
| `bun run preview` | Preview production build |
| `bun run type-check` | Run vue-tsc --noEmit |
| `bun lint` | Run oxlint then eslint |
| `bun run format` | Format with prettier |
| `bun run generate:skills` | Regenerate skills index |
| `bun run generate:previews` | Capture missing site previews |
| `bun run generate:previews:all` | Regenerate all previews |
| `bun run import:bookmarks` | Import bookmarks |

## Adding Sites

Sites are defined as `meta.yaml` files under `src/content/sites/`. After adding a new site:

```bash
bun run scripts/build/generate-sites-index.js
bun run scripts/previews/generate-site-previews.js --slug <your-slug>
```

See [docs/ADDING-SITES.md](docs/ADDING-SITES.md) for full details.

## Adding Skills

Skills are defined in `src/content/skills/`. After adding or editing:

```bash
bun run generate:skills
```

See [docs/ADDING-SKILLS.md](docs/ADDING-SKILLS.md) for full details.

## Site Previews

Previews are static WebP files generated with Puppeteer. Output goes to:

- `public/previews/<slug>.webp` — full size (960×600)
- `public/previews/<slug>-sm.webp` — thumbnail (480×300)
- `src/content/site-previews.json` — must be committed

Set `PREVIEW_BROWSER_PATH` to override the auto-detected Chrome/Edge path.

## Architecture

```
src/
├── components/       # Vue components
├── composables/      # Composition functions
├── content/
│   ├── sites/        # Site meta.yaml files
│   └── skills/       # Skill meta.yaml files
├── pages/            # Route components
├── stores/           # Pinia stores
│   ├── sites.ts
│   ├── skills.ts
│   ├── auth.ts       # Supabase auth
│   └── admin.ts      # Admin functionality
├── types/            # TypeScript interfaces
└── main.ts           # App entry
```

## Design

Inspired by Vercel's design language — stark black-and-ink on near-white canvas with multi-color mesh gradients. See [docs/DESIGN.md](docs/DESIGN.md) for full design system.

## Deployment

Deployed to Vercel as a SPA. All routes rewrite to `index.html`.

## CI/CD

CI runs on push/PR to the `grail` branch:

1. `type-check` — vue-tsc --noEmit
2. `lint` — oxlint then eslint
3. `build` — production build
