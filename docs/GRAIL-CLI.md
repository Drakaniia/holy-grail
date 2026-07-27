# Grail CLI — Skill Manager

> **Replaces** the legacy `meta.yaml`-based skill system.

The `grail` CLI is a Rust-based tool for discovering, installing, and managing AI agent skills. Skills follow the open `SKILL.md` convention and are fetched from GitHub repositories.

## Quick Start

```bash
# Build the CLI (one-time)
bun run build:cli

# Run via the Node.js wrapper
npx tsx cli/grail.ts --help
```

Or use the built binary directly:

```bash
cli/target/release/grail --help
```

## Commands

### `grail add <github-repo> [--skill <name>]`

Install a skill from a GitHub repository.

```bash
# Install a single-skill repo
grail add midudev/autoskills --skill vue

# Interactive picker for multi-skill repos
grail add midudev/autoskills

# Full GitHub URL also works
grail add https://github.com/midudev/autoskills --skill vue
```

**Behavior:**
- If `--skill` is provided, installs that specific skill
- If omitted and the repo has one skill, installs it automatically
- If omitted and the repo has multiple skills, shows an interactive picker
- Installs to `~/.grail/skills/<name>/` (global) and `./.agents/skills/<name>/` (local)
- Regenerates the index automatically

### `grail remove <skill-name>`

Uninstall a skill.

```bash
grail remove vue
```

Removes from both global and local directories. Detects foreign skills (installed by `npx skills` or other tools) and warns before removal.

### `grail list [--local|--global]`

List installed skills.

```bash
grail list          # All installed skills
grail list --local  # Project-local only (.agents/skills/)
grail list --global # Global only (~/.grail/skills/)
```

### `grail find [<query>]`

Search installed and discoverable skills.

```bash
grail find              # All known skills
grail find vue          # Search by name, description, or tags
grail find typescript   # Finds matching skills
```

Shows both installed skills and discoverable (not yet installed) skills from the built-in registry.

### `grail update [<skill-name>]`

Update installed skills to their latest version.

```bash
grail update            # Update all installed skills
grail update vue        # Update a specific skill
```

Re-fetches `SKILL.md` from the remote GitHub repo and replaces the local copy.

### `grail info <skill-name>`

Show detailed information about an installed skill.

```bash
grail info vue
```

Output includes name, slug, description, category, author, repo, tags, featured status, and install date.

### `grail index`

Regenerate the skills index.

```bash
grail index
```

Scans `~/.grail/skills/` for installed skills, reads `SKILL.md` frontmatter, and writes:
- `~/.grail/skills-index.json` (global index)
- `public/content/skills-index.json` (project index, when run inside a Holy Grail project)

Run this after manually copying files into `~/.grail/skills/` or to repair a corrupted index.

## File System Layout

### Global Directory (`~/.grail/`)

```
~/.grail/
├── skills/
│   ├── vue/
│   │   └── SKILL.md
│   ├── frontend-design/
│   │   └── SKILL.md
│   └── ...
└── skills-index.json      ← Generated index (consumed by frontend)
```

### Project-Local Directory (`./.agents/skills/`)

```
<project>/.agents/skills/
├── vue/
│   └── SKILL.md
├── frontend-design/
│   └── SKILL.md
└── ...
```

## How Skills Work

A skill is a `SKILL.md` file that follows the open skill convention. The file contains YAML frontmatter with metadata and Markdown content with the skill instructions.

```markdown
---
title: Vue
slug: vue
description: Vue 3 Composition API...
category: AI
tags:
  - autoskills
  - vue
author: midudev
authorName: midudev
branch: main
featured: false
---

# Skill Instructions

...
```

The Holy Grail frontend loads skills from the CLI-generated index and fetches the raw `SKILL.md` content from GitHub at runtime (with 24-hour localStorage caching).

## Global vs Local Install

| Scope | Directory | Purpose |
|-------|-----------|---------|
| Global | `~/.grail/skills/` | Skills available to all projects |
| Local | `<project>/.agents/skills/` | Skills scoped to a specific project |

When you run `grail add`, the skill is installed to both locations (if inside a project directory). When you run `grail list`, both scopes are shown.

## Interop with Other Tools

The CLI detects skills installed by other tools:

| Tool | Detection Method |
|------|-----------------|
| `npx skills` | `.skills-manifest.json` |
| `npx openskills` | `openskills.json` |
| Manual install | No marker — detected during `list`/`remove` |

When a foreign skill is detected, grail prints a warning before removal but does not manage foreign skills directly.

## Built-In Registry

The CLI ships with a registry of well-known skill repositories:

| Source | Repo | Skills |
|--------|------|--------|
| midudev/autoskills | `midudev/autoskills` | 100+ skills |
| mattpocock/skills | `mattpocock/skills` | 10+ productivity skills |
| Imbad0202/academic-research-skills | `Imbad0202/academic-research-skills` | Academic skills |
| Leonxlnx/taste-skill | `Leonxlnx/taste-skill` | Design/brand skills |

Add any repo following the `SKILL.md` convention via `grail add <other/repo>`.

## Development

### Prerequisites

- Rust toolchain (rustc + cargo)
- Node.js + Bun

### Building

```bash
# Build TypeScript wrapper and Rust binary
bun run build:cli

# Or build only the Rust binary
cd cli && cargo build --release
```

### Testing

```bash
cd cli && cargo test
```

## Skills Registry (No Build Step)

Skills are now loaded **dynamically at runtime** — no build step needed. The system is modeled after LobeHub's approach:

| Source | File | How it's populated |
|--------|------|-------------------|
| Community Registry | `public/content/skills-registry.json` | PR-driven, committed to git, fetched at runtime |
| Local CLI Install | `/skills-index.json` | Written by `grail index`, optional |
| Project-Level | `.agents/skills/` | Scanned at runtime, local only |

### Updating the Registry

To add new skill sources to the community registry:

1. Add the repo to `REGISTRY_SOURCES` in `scripts/build/update-registry.js`
2. Run `bun run update:registry`
3. Commit the updated `public/content/skills-registry.json`

No hardcoded lists, no build-time GitHub API calls in the normal dev/build flow.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GRAIL_HOME` | Override the global directory (default: `~/.grail/`) |
| `GRAIL_GITHUB_API` | Override the GitHub API base URL (default: `https://api.github.com`) |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (repo not found, network issue) |
| 2 | Invalid arguments |
| 3 | Skill not found (for `remove`, `info`, `update`) |
| 4 | Conflict (skill already installed) |
