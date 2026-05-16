# Adding a New Site

## Directory Structure

```
src/content/sites/
├── vercel/
│   └── meta.yaml          ← Site metadata
├── v0/
│   └── meta.yaml
└── your-new-site/         ← Create this directory
    └── meta.yaml          ← Add this file
```

## Steps to Add a Site

1. **Create a directory** under `src/content/sites/` using the site's slug (lowercase, hyphenated)
2. **Create `meta.yaml`** inside that directory with the fields below
3. **Run `bun dev`** — the generation script runs automatically and rebuilds the index

## `meta.yaml` Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | URL-friendly identifier (e.g. `my-tool`) |
| `name` | string | Yes | Display name |
| `description` | string | Yes | Short description (shown in card) |
| `category` | string | Yes | Category label (e.g. `Deployment`, `Backend`) |
| `stars` | number | Yes | GitHub stars count |
| `watchers` | number | Yes | GitHub watchers count |
| `addedDaysAgo` | number | Yes | Months since added (for "Added Xmo ago" label) |
| `license` | string | Yes | License type (e.g. `MIT`, `Apache-2.0`) |
| `lastCommit` | string | Yes | Human-readable date (e.g. `2 days ago`) |
| `lastRelease` | string | Yes | Human-readable date (e.g. `1 week ago`) |
| `version` | string | Yes | Latest version tag |
| `contributors` | number | Yes | Number of contributors |
| `commitsThisYear` | number | Yes | Commit count this year |
| `releases` | number | Yes | Total release count |
| `platforms` | string[] | Yes | Array of platforms (e.g. `[Web, API, CLI]`) |
| `deployment` | string[] | Yes | Deployment methods (e.g. `[Cloud, Self-hosted]`) |
| `website` | string | Yes | Full URL — **used for favicon fetching** |
| `docs` | string | Yes | Documentation URL |
| `sourceCode` | string | Yes | GitHub/GitLab repo URL |
| `icon` | string | No | Legacy field, not used for display |
| `verified` | boolean | No | Shows green checkmark badge |
| `featured` | boolean | No | Pinned to top of list |
| `atGlance` | string | No | One-line summary (blue highlighted box) |
| `fullDescription` | string | No | Longer description paragraph |
| `coreFeatures` | array | No | 2-4 key features (see format below) |
| `additionalFeatures` | array | No | Extra features (see format below) |
| `deployCompose` | string | No | Docker compose YAML content (code block) |
| `similarTools` | array | No | Array of `{slug, name, description, stars, addedDaysAgo, verified, website}` |

### Feature Object Format

```yaml
coreFeatures:
  - name: Feature Name
    description: Short description
    icon: icon-name          # legacy, not rendered
additionalFeatures:
  - name: Extra Feature
    description: Short description
    icon: icon-name
```

### similarTools Object Format

```yaml
similarTools:
  - slug: other-tool
    name: Other Tool
    description: Brief description
    stars: 5000
    addedDaysAgo: 3
    verified: true
    website: https://other-tool.dev
```

## Example

```yaml
slug: my-tool
name: My Tool
description: A powerful tool for building things
category: Development
stars: 8500
watchers: 320
addedDaysAgo: 1
license: MIT
lastCommit: "3 days ago"
lastRelease: "2 weeks ago"
version: "2.1.0"
contributors: 89
commitsThisYear: 650
releases: 18
platforms:
  - Web
  - CLI
deployment:
  - Cloud
  - Self-hosted
website: https://mytool.dev
docs: https://mytool.dev/docs
sourceCode: https://github.com/example/my-tool
verified: true
featured: false
atGlance: Build faster with AI-powered workflows
fullDescription: My Tool is a modern development platform that streamlines your workflow with intelligent automation and real-time collaboration features.
coreFeatures:
  - name: AI Assistant
    description: Built-in AI helps you write code faster
    icon: sparkles
  - name: Real-time Sync
    description: Collaborate with your team in real time
    icon: users
additionalFeatures:
  - name: Dark Mode
    description: Easy on the eyes
    icon: moon
deployCompose: |
  services:
    my-tool:
      image: mytool:latest
      ports:
        - "3000:3000"
```

## Screenshot Preview

Site detail pages automatically fetch and display screenshots using `https://image.thum.io/get/width/800/crop/600/noanimate/{website}`. **Clicking the screenshot opens the live site in a new tab.** No manual screenshot upload needed. Falls back to a placeholder message if the image fails to load.

## Favicon

Favicons are fetched automatically from `https://www.google.com/s2/favicons?domain=DOMAIN&sz=64` using the `website` URL. No manual image upload needed. Falls back to first-letter placeholder if fetch fails.

## Sorting

Sites are sorted by:
1. `featured: true` items first
2. Then by `stars` descending

## Regeneration

The index is auto-regenerated on every `bun dev` or `bun run build`. To regenerate manually:

```bash
bun run scripts/generate-sites-index.js
```

Output: `src/content/sites-index.json` (imported by Pinia store)
