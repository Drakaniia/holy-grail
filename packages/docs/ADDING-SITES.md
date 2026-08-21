# Adding Sites

Sites are stored as `meta.yaml` files under `packages/web/src/content/sites/`. The generated
`packages/web/src/content/sites-index.json` is imported directly by the Pinia sites store, so
metadata must be complete before committing content changes.

## Directory Structure

```txt
packages/web/src/content/sites/
+-- development/
|   +-- cloud-hosting/
|       +-- vercel/
|           +-- meta.yaml
+-- ai/
|   +-- automation/
|       +-- n8n/
|           +-- meta.yaml
+-- your-category/
    +-- your-site/
        +-- meta.yaml
```

## Manual Add Flow

1. Create a directory using the site slug.
2. Add `meta.yaml` using the schema below.
3. Include `coreFeatures`, `additionalFeatures`, and `similarTools` so the detail
   page is complete.
4. Run `bun run --cwd packages/web scripts/build/generate-sites-index.js`.
5. Run `bun run type-check`, `bun lint`, and `bun run build` before finishing.

## Bookmark Import Flow

Imported bookmark entries start with lightweight metadata. After importing, run
the enrichment scripts before regenerating the index:

```bash
bun run --cwd packages/web scripts/enrichment/import-bookmarks.js
bun run --cwd packages/web scripts/enrichment/enrich-site-metadata.js --apply
bun run --cwd packages/web scripts/enrichment/fill-site-detail-sections.js --apply
bun run --cwd packages/web scripts/build/generate-sites-index.js
```

`enrich-site-metadata.js` looks for public GitHub repos from the site/docs pages
and fills repo-backed fields such as stars, contributors, commits this year,
releases, latest release, and source code. It accepts:

```bash
bun run --cwd packages/web scripts/enrichment/enrich-site-metadata.js             # dry run, imported sites only
bun run --cwd packages/web scripts/enrichment/enrich-site-metadata.js --apply     # write changes
bun run --cwd packages/web scripts/enrichment/enrich-site-metadata.js --all       # include older entries
```

`fill-site-detail-sections.js` fills `coreFeatures`, `additionalFeatures`, and
`similarTools` for imported entries. It also accepts `--apply` and `--all`.

## `meta.yaml` Schema

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `slug` | string | Yes | URL-friendly id. |
| `name` | string | Yes | Display name. |
| `description` | string | Yes | Short card description. |
| `category` | string | Yes | Display category. |
| `parentCategory` | string | Yes | Top-level route/category, e.g. `ai`, `design`, `development`. |
| `subcategory` | string/null | Yes | Nested route category or `null`. |
| `stars` | number | Yes | GitHub stars if repo-backed, otherwise `0`. Hidden in UI when no source repo exists. |
| `watchers` | number | Yes | GitHub watchers/subscribers if repo-backed, otherwise `0`. |
| `addedDaysAgo` | number | Yes | Months since added. Imported entries use `0`. |
| `license` | string | Yes | SPDX license when known, otherwise `Unknown` or `Proprietary`. |
| `lastCommit` | string | Yes | Repo-backed relative date, otherwise `N/A`. |
| `lastRelease` | string | Yes | Repo-backed relative date, otherwise `N/A` or `No releases`. |
| `version` | string | Yes | Latest release tag if known, otherwise empty string. |
| `contributors` | number | Yes | GitHub contributor count if repo-backed, otherwise `0`. Hidden in UI when no source repo exists. |
| `commitsThisYear` | number | Yes | GitHub commit count for the current year if repo-backed, otherwise `0`. |
| `releases` | number | Yes | GitHub release count if repo-backed, otherwise `0`. |
| `platforms` | string[] | Yes | Example: `[Web, API, CLI]`. |
| `deployment` | string[] | Yes | Example: `[Cloud]`, `[Docker Compose]`, `[Self-hosted]`. |
| `website` | string | Yes | Primary URL. Used for favicon and screenshot fetching. |
| `docs` | string | Yes | Documentation URL. Use `website` when no separate docs page exists. |
| `sourceCode` | string | Yes | Public repo URL when available, otherwise empty string. |
| `icon` | string | No | Legacy/internal icon key. |
| `verified` | boolean | No | Shows the verified badge. Repo-backed enriched imports are marked true. |
| `featured` | boolean | No | Pins entry above normal sort. |
| `tags` | string[] | No | Search/filter tags. |
| `atGlance` | string | No | One-line detail page summary. |
| `fullDescription` | string | No | Longer detail page description. |
| `coreFeatures` | array | Yes | Rendered in the Core Features section. |
| `additionalFeatures` | array | Yes | Rendered in the Additional Features section. |
| `deployCompose` | string | No | Docker Compose YAML. Only add when accurate. |
| `installCommand` | string | No | CLI install/setup command. Rendered for Development > CLI Tools entries. |
| `similarTools` | array | Yes | Rendered in the Similar Tools section. |

## Feature Objects

```yaml
coreFeatures:
  - name: AI Workflow Support
    description: Helps automate AI-assisted work from a browser-based interface.
    icon: check
additionalFeatures:
  - name: Cloud Access
    description: Designed to run through a hosted web experience.
    icon: check
```

`icon` is currently a legacy metadata field. The UI renders a standard icon for
these feature cards.

## Similar Tools

```yaml
similarTools:
  - slug: activepieces
    name: Activepieces
    description: Open-source automation platform for AI workflows.
    stars: 22267
    addedDaysAgo: 0
    verified: true
    website: https://www.activepieces.com/
```

Use tools from the same parent category/subcategory when possible.

## Deployment Display

The detail page always shows an Installation & Deployment section when the entry
has a website, docs, source code, or `deployCompose`.

- With `deployCompose`: renders a Docker Compose block with copy support.
- Without `deployCompose`: renders cloud/web actions for Website, Docs, and
  Source Code when those links exist.

Do not add placeholder Compose YAML just to make the section appear.

## Images

Production previews are static files generated from the site index:

```bash
bun run generate:previews         # capture missing previews only
bun run generate:previews:missing # explicit missing-only alias
bun run generate:previews:all     # regenerate every public preview
bun run review:previews           # audit missing, broken, stale, or fallback previews
```

The generator writes:

```txt
packages/web/public/previews/{slug}.webp
packages/web/public/previews/{slug}-sm.webp
packages/web/public/previews/manifest.json
packages/web/src/content/site-previews.json
```

The app imports `packages/web/src/content/site-previews.json`, so run the generator before a
production build when previews have changed. The generated images live under
`packages/web/public/`, so Vercel serves them as static assets with no screenshot API call at
runtime.

The image files live in the `holy-grail-assets` git submodule mounted at
`packages/web/public/previews` — they are not tracked in this repo's history. New clones must run
`bun run setup` (or `git clone --recurse-submodules`) once to fetch them. When you
commit, the pre-commit hook runs `bun run sync:previews`, which commits and pushes any
changed previews to the submodule repo and stages the updated gitlink, so previews
stay in sync with the parent automatically. If you prefer to skip the hook for a
commit, `git commit --no-verify` is available — but only do this when previews are
unchanged.

Favicons use `https://www.google.com/s2/favicons?domain=DOMAIN&sz=64` and fall
back gracefully when loading fails.

If curated images are added later, prefer optional metadata fields with fallback
to generated previews and favicons.

Run the preview review when images look wrong in the UI or before a cleanup
pass. Use `bun run review:previews -- --report public/previews/review-report.json`
to save the full JSON report, or `bun run review:previews -- --fail-on error`
when a strict check is needed.

## Example

```yaml
slug: n8n
name: n8n
description: Workflow automation platform for technical teams
category: AI Automation
parentCategory: ai
subcategory: automation
stars: 188794
watchers: 1093
addedDaysAgo: 0
license: Unknown
lastCommit: 10 minutes ago
lastRelease: 20 hours ago
version: n8n@2.21.4
contributors: 641
commitsThisYear: 2816
releases: 630
platforms:
  - Web
deployment:
  - Cloud
website: https://n8n.io/
docs: https://n8n.io/
sourceCode: https://github.com/n8n-io/n8n
icon: n8n
verified: true
featured: false
tags:
  - bookmark
  - ai
  - automation
atGlance: Workflow automation platform for technical teams
fullDescription: n8n is tracked as an AI automation resource.
coreFeatures:
  - name: AI Workflow Support
    description: n8n is tracked as an AI automation resource for AI-assisted workflows.
    icon: check
  - name: Direct Web Launch
    description: The live product is available from the saved website link.
    icon: check
additionalFeatures:
  - name: Cloud Access
    description: Designed to be used through a hosted web experience.
    icon: check
  - name: Documentation Shortcut
    description: Keeps the primary reference URL beside the tool.
    icon: check
similarTools:
  - slug: activepieces
    name: Activepieces
    description: AI-first automation platform.
    stars: 22267
    addedDaysAgo: 0
    verified: true
    website: https://www.activepieces.com/
```

## Sorting

Sites are sorted by:

1. `featured: true`
2. `stars` descending

## Regeneration

`bun dev` and `bun run build` regenerate the index automatically. To regenerate
manually:

```bash
bun run --cwd packages/web scripts/build/generate-sites-index.js
```

Output: `packages/web/src/content/sites-index.json`.
