# meta.yaml Schema Reference

Each site in the Holy Grail catalog is defined by a `meta.yaml` file at:
```
src/content/sites/{parentCategory}/{subcategory}/{slug}/meta.yaml
```

This file is read by `scripts/build/generate-sites-index.js` to produce `src/content/sites-index.json`.

## Field Reference

### Identity Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | **Yes** | URL-friendly identifier. Must match the directory name. Lowercase with hyphens for multi-word names. Example: `holygrid-studio` |
| `name` | string | **Yes** | Display name shown in cards, headers, and search results. Should be clean and human-readable. Example: `Holy Grid Studio - Framer Templates for Creatives` |
| `description` | string | **Yes** | Short description used in card views and meta tags. 80-120 characters ideal. Example: `Premium and free Framer website templates for portfolios, landing pages, and brand sites.` |

### Categorization Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | **Yes** | Display category label shown in the UI. Examples: `Icons/SVG`, `Design Tools`, `Website Development`, `AI CLI`, `UI Library` |
| `parentCategory` | string | **Yes** | Top-level folder name under `src/content/sites/`. Must match an actual directory. Values: `ai`, `design`, `development`, `downloads`, `watch` |
| `subcategory` | string or null | **Yes** | Nested folder name or `null`. Examples: `icons-svg`, `design-tools`, `wb`, `cli-tools`, `automation` |
| `tags` | string[] | No | Search/filter tags. At minimum include `bookmark` plus the category path tags. Example: `[bookmark, design, icons-svg, icons, svg]` |

### Repository Statistics Fields

These fields are populated by `scripts/enrichment/enrich-site-metadata.js` when a GitHub repo is detected. For manual entries without a repo, use default values.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `stars` | number | **Yes** | `0` | GitHub star count. Hidden in UI when no source repo exists. |
| `watchers` | number | **Yes** | `0` | GitHub watcher/subscriber count. |
| `addedDaysAgo` | number | **Yes** | `0` | Days since the site was added to the catalog. |
| `license` | string | **Yes** | `Proprietary` | SPDX license identifier. Use `Unknown` for repos, `Proprietary` for closed-source services. |
| `lastCommit` | string | **Yes** | `N/A` | Relative time since last commit (e.g., `3 days ago`). `N/A` if no repo. |
| `lastRelease` | string | **Yes** | `N/A` | Relative time since last release. `No releases` if repo has no releases. |
| `version` | string | **Yes** | `""` | Latest release tag (e.g., `v2.8.0`, `n8n@2.21.4`). Empty string if unknown. |
| `contributors` | number | **Yes** | `0` | GitHub contributor count. Hidden in UI when no source repo. |
| `commitsThisYear` | number | **Yes** | `0` | GitHub commits in the current calendar year. |
| `releases` | number | **Yes** | `0` | Total GitHub release count. |

### Link Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platforms` | string[] | **Yes** | Supported platforms. Common values: `Web`, `CLI`, `Desktop`, `API`, `Figma`, `Mobile` |
| `deployment` | string[] | **Yes** | Deployment method. Common values: `Cloud`, `Local CLI`, `Docker Compose`, `Self-hosted`, `Desktop`, `npm` |
| `website` | string | **Yes** | Primary URL. Used for favicon fetching and link generation. |
| `docs` | string | **Yes** | Documentation URL. Use same as `website` when no separate docs page exists. |
| `sourceCode` | string | **Yes` | Public source repository URL. Empty string if not open source. |

### Display Flags

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `icon` | string | No | — | Internal icon key. Usually matches the slug. Maps to the favicon fallback. |
| `verified` | boolean | No | `false` | Shows a verified badge on the detail page. Typically `true` for sites with confirmed GitHub repos after enrichment. |
| `featured` | boolean | No | `false` | Pins the entry above normal sort order in listings. |

### Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `atGlance` | string | No | One-line summary shown at the top of the detail page. 50-80 chars. |
| `fullDescription` | string | No | 2-4 sentence description for the detail page body. Should explain what the site does and who it's for. |

### Feature Section Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `coreFeatures` | object[] | **Yes** | 2-3 key features rendered in the Core Features section. Each has `name`, `description`, `icon`. |
| `additionalFeatures` | object[] | **Yes** | 2-3 supplementary features. Same structure as `coreFeatures`. |
| `deployCompose` | string | No | Docker Compose YAML content. Only include when it's accurate and tested. Do not add placeholder content. |
| `installCommand` | string | No | CLI install or setup command. Rendered for `development > cli-tools` entries. |
| `similarTools` | object[] | **Yes** | 3 related tools from the catalog. Each references an existing slug. |

## Feature Object Format

```yaml
coreFeatures:
  - name: AI Code Generation
    description: Build apps from natural language prompts.
    icon: sparkles
  - name: Full-Stack Support
    description: Frontend and backend in one platform.
    icon: layers

additionalFeatures:
  - name: Database Integration
    description: Connect to Supabase and other databases.
    icon: database
  - name: One-Click Deploy
    description: Deploy to Vercel, Netlify, or custom domains.
    icon: rocket
```

**Icon values**: Use `check` for generic features. Use descriptive names like `sparkles`, `layers`, `database`, `rocket`, `wind`, `palette`, `layout`, `refresh-cw` for standout features. The UI maps these to Lucide icons.

## Similar Tools Format

```yaml
similarTools:
  - slug: lovable
    name: Lovable
    description: AI-powered full-stack web app builder that turns ideas into production-ready applications.
    stars: 8900
    addedDaysAgo: 0
    verified: true
    website: https://lovable.dev
```

Use tools from the **same parent category/subcategory** when possible. The `slug` must match an existing entry in the catalog — verify with:

```bash
find src/content/sites -type d -name "lovable"
```

## Complete Example

```yaml
slug: orchids
name: Orchids - AI App Builder and IDE
description: AI-powered IDE for building and deploying full-stack applications from natural language prompts.
category: Website Development
parentCategory: ai
subcategory: wb
stars: 0
watchers: 0
addedDaysAgo: 0
license: Proprietary
lastCommit: N/A
lastRelease: N/A
version: ""
contributors: 0
commitsThisYear: 0
releases: 0
platforms:
  - Web
  - Desktop
deployment:
  - Cloud
  - Desktop
website: https://www.orchids.app
docs: https://www.orchids.app
sourceCode: ""
icon: orchids
verified: false
featured: false
tags:
  - bookmark
  - ai
  - development
  - app-builder
  - ide
atGlance: AI-powered IDE for building full-stack apps with natural language.
fullDescription: >-
  Orchids is an AI-powered integrated development environment that lets you build
  and deploy full-stack applications from natural language descriptions. Supports
  mobile apps, Chrome extensions, Slack bots, AI agents, and diverse software stacks.
  Features a built-in VS Code editor and connects to existing AI subscriptions.
coreFeatures:
  - name: AI Code Generation
    description: Build apps from natural language prompts.
    icon: sparkles
  - name: Built-in Editor
    description: Integrated VS Code editor for manual code adjustments.
    icon: check
  - name: Cross-Platform
    description: Available as desktop app (macOS, Windows, Linux) and web.
    icon: check
additionalFeatures:
  - name: Diverse App Support
    description: Build mobile apps, extensions, bots, and agents.
    icon: layers
  - name: Deployment
    description: Deploy applications directly from the platform.
    icon: rocket
similarTools:
  - slug: lovable
    name: Lovable
    description: AI-powered full-stack web app builder.
    stars: 8900
    addedDaysAgo: 0
    verified: true
    website: https://lovable.dev
  - slug: bolt
    name: Bolt
    description: AI-powered web app builder from prompt to deployment.
    stars: 0
    addedDaysAgo: 0
    verified: false
    website: https://bolt.new/
  - slug: v0
    name: v0
    description: Generative UI system by Vercel that creates React components from text prompts.
    stars: 15200
    addedDaysAgo: 0
    verified: true
    website: https://v0.dev
```

## Category → Folder Mapping Reference

| parentCategory | subcategory | display category | Example sites |
|---------------|-------------|-----------------|---------------|
| `ai` | `automation` | `AI Automation` | n8n, activepieces |
| `ai` | `wb` | `Website Development` | v0, lovable, orchids |
| `ai` | `others` | `AI` | everydev, locofy |
| `ai` | `chat` | `Chat` | chatgpt, claude |
| `ai` | `image` | `Image` | leonardo, ideogram |
| `ai` | `ml` | `Machine Learning` | tensorflow, pytorch |
| `design` | `icons-svg` | `Icons/SVG` | thesvg, iconly, iconinspo |
| `design` | `design-tools` | `Design Tools` | jitter, animos, holygrid-studio |
| `design` | `fonts` | `Fonts` | fontofweb, ifonts |
| `design` | `inspiration` | `Inspiration` | dribbble, godly |
| `development` | `cli-tools` | `AI CLI` | codebuff, aider, claude-code |
| `development` | `cloud-hosting` | `Hosting` | vercel, supabase, coolify |
| `development` | `ui-libraries` | `UI Library` | shadcn/ui, heroui, chakra-ui |
| `development` | `repositories` | `Repositories` | n8n, github repos |
| `development` | `learning` | `Learning` | roadmap.sh, freecodecamp |

## Validation

After creating or updating meta.yaml files, always run:

```bash
# Regenerate the index from all meta.yaml files
node scripts/build/generate-sites-index.js

# Type-check
npx vue-tsc --noEmit
```

The index generator reads all `meta.yaml` files recursively from `src/content/sites/` and produces sorted JSON. Sites are sorted by:
1. `featured: true` entries first
2. `stars` descending
