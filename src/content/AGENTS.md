# src/content/ — Content Data Model

YAML-as-source-of-truth for sites, extensions, and MCP entries. Flat-indexed to JSON at build time.

## STRUCTURE

```
content/
├── sites/           # Site catalog
│   ├── ai/          #   agent-skills/, api/, audio/, automation/, cerebras/, chat/,
│   │                #   detector/, image/, ml/, napkin/, opal/, others/, ppt/,
│   │                #   prompts/, research/, video/, wb/
│   ├── design/      #   3d/, design-tools/, fonts/, icons-svg/, inspiration/,
│   │                #   md/, prompts/
│   ├── development/ #   cli-tools/, cloud-hosting/, learning/, mcp/, monitoring/,
│   │                #   references/, repositories/, tooling/, ui-libraries/
│   ├── downloads/   #   game-download/, movies/, software-download/, torrents/,
│   │                #   vfx-download/
│   └── watch/       #   anime/, movies/
├── extensions/      # Chrome extensions
│   ├── design/
│   ├── developer-tools/
│   ├── privacy/
│   ├── productivity/
│   └── writing/
├── mcp/             # MCP server entries
│   └── development/
├── sites-index.json      # GENERATED — do not hand-edit
├── extensions-index.json # GENERATED — do not hand-edit
├── mcp-index.json        # GENERATED — do not hand-edit
└── site-previews.json    # GENERATED — do not hand-edit
```

## CONTENT MODEL

Each entry = `<category>/<subcategory>/<slug>/meta.yaml`. Required fields per type vary but all include name, description, url, and category.

## INDEX GENERATION

- `scripts/build/generate-sites-index.js` → `sites-index.json`
- `scripts/build/generate-extensions-index.js` → `extensions-index.json`
- `scripts/build/generate-mcp-index.js` → `mcp-index.json`
- Indexes run before every `dev` and `build` — always up to date.
- **Never edit `*-index.json` by hand.** Edit `meta.yaml` and re-run the generator.

## IMPORTANT

- **Skills are NOT in this directory.** Skills are loaded dynamically from `public/content/skills-registry.json` at runtime — no `meta.yaml` or build step.
- `site-previews.json` is updated by the preview pipeline (`generate-site-previews.js`). Updating it separately will be overwritten.
- After adding a site/extension/mcp entry, always run `bun run generate:previews --slug <slug>` for sites (or the appropriate generator for extensions/MCP).
