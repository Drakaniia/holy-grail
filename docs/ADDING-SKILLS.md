# Adding a New Skill

## Directory Structure

```
src/content/skills/
├── ui-design-system/
│   └── meta.yaml          ← Skill metadata
├── threejs-animation/
│   └── meta.yaml
└── your-new-skill/        ← Create this directory
    └── meta.yaml          ← Add this file
```

## Steps to Add a Skill

1. **Create a directory** under `src/content/skills/` using the skill's slug (lowercase, hyphenated)
2. **Create `meta.yaml`** inside that directory with the fields below
3. **Run `bun dev`** — the generation script runs automatically and rebuilds the index

## `meta.yaml` Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Display title (e.g. `UI Design System`) |
| `slug` | string | Yes | URL-friendly identifier (e.g. `ui-design-system`) |
| `description` | string | Yes | Short description (shown in card) |
| `category` | string | Yes | Category label (e.g. `Design`, `Development`) |
| `tags` | string[] | Yes | Array of keyword tags |
| `views` | number | Yes | View count |
| `uses` | number | Yes | Usage count |
| `author` | string | Yes | GitHub username of the skill author |
| `authorName` | string | Yes | Display name of the author |
| `repoLink` | string | Yes | GitHub repo path (e.g. `owner/repo-name`) |
| `skillPath` | string | Yes | Path inside the repo to the skill directory (e.g. `skills/ui-design-system`) |
| `branch` | string | No | Git branch name (default: `main`) |
| `addedBy` | string | No | Name of person who added this skill |
| `featured` | boolean | No | Pinned to top of list |
| `dateAdded` | string | No | ISO date string (e.g. `2026-05-10`) |

## Example

```yaml
title: My Awesome Skill
slug: my-awesome-skill
description: A powerful skill for doing amazing things with AI assistance
category: Development
tags:
  - ai
  - automation
  - workflow
views: 5000
uses: 350
author: octocat
authorName: Octocat
repoLink: octocat/my-skills
skillPath: skills/my-awesome-skill
branch: main
addedBy: Admin
featured: false
dateAdded: '2026-05-17'
```

## How Skills Work

The skills store fetches the actual `SKILL.md` content from GitHub at runtime:

```
https://raw.githubusercontent.com/{repoLink}/{branch}/{skillPath}/SKILL.md
```

The `meta.yaml` only stores metadata — the skill instructions live in the remote GitHub repo. The fetched content is cached in `localStorage` with a 24-hour TTL.

## Sorting

Skills are sorted by:
1. `featured: true` items first
2. Then by `views` descending

## Regeneration

The index is auto-regenerated on every `bun dev` or `bun run build`. To regenerate manually:

```bash
bun run scripts/build/generate-skills-index.js
```

Output: `src/content/skills-index.json` (imported by Pinia store)
