# grail-cli — AI Skill Manager

**The Holy Grail skill manager** — discover, install, and manage AI skills for your coding assistant. Available as an npm package and as a built-in CLI in the Holy Grail project.

```bash
npx grail add Drakaniia/skills --skill audit-codebase
```

## Quick Start

### From Anywhere (npm)

```bash
npx grail add <owner>/<repo> --skill <skill-name>
```

No installation required — `npx` downloads and runs the latest version. On first run, it downloads a prebuilt Rust binary for your platform, or builds from source if Rust is installed.

### From the Holy Grail Repository

```bash
bun run build:cli                              # Build the binary
cli/target/release/grail add <repo> --skill <name>   # Run directly
```

Or via the local wrapper:

```bash
grail add <repo> --skill <name>               # After npm link from cli/
```

## Commands

### `grail add <github-repo> [--skill <name>]`

Install a skill from a GitHub repository.

```bash
# Install a specific skill from a multi-skill repo
npx grail add Drakaniia/skills --skill audit-codebase

# Interactive picker for multi-skill repos (no --skill flag)
npx grail add midudev/autoskills

# Full GitHub URL also works
npx grail add https://github.com/midudev/autoskills --skill vue
```

**Behavior:**
- If `--skill` is provided, installs that specific skill
- If omitted and the repo has one skill, installs it automatically
- If omitted and the repo has multiple skills, shows an interactive picker
- Installs to `~/.grail/skills/<name>/`
- Regenerates the skills index automatically and writes to Holy Grail `public/content/` when inside the project

### `grail remove <skill-name>`

Uninstall a skill.

```bash
npx grail remove vue
```

Detects foreign skills (installed by `npx skills` or `npx openskills`) and warns before removal.

### `grail list`

List installed skills.

```bash
npx grail list
```

Shows all skills in `~/.grail/skills/` with foreign-tool markers when detected.

### `grail find [<query>]`

Search installed skills by name, description, or content.

```bash
npx grail find              # All installed skills
npx grail find vue          # Search by keyword
npx grail find typescript   # Find TypeScript-related skills
```

### `grail info <skill-name>`

Show detailed information about an installed skill.

```bash
npx grail info audit-codebase
```

Output includes: name, slug, description, category, author, repo, tags, featured status, install date.

### `grail update [<skill-name>]`

Update installed skills to their latest version.

```bash
npx grail update            # Update all installed skills
npx grail update vue        # Update a specific skill
```

Re-fetches `SKILL.md` from the remote GitHub repo and replaces the local copy.

### `grail index`

Regenerate the skills index.

```bash
npx grail index
```

Scans `~/.grail/skills/` for installed skills, reads `SKILL.md` frontmatter, and writes:
- `~/.grail/skills-index.json` (global index)
- `public/content/skills-index.json` (project index, when run inside a Holy Grail project)

Run this after manually copying files into `~/.grail/skills/` or to repair a corrupted index.

## What Are Skills?

Skills are reusable, self-contained instruction files (`SKILL.md`) that teach your AI coding assistant how to perform specific tasks. Examples include:

| Skill | Purpose |
|-------|---------|
| `audit-codebase` | Scan any codebase for structural health issues |
| `frontend-design` | Build production-grade frontend interfaces |
| `git-commit` | Create conventional commits with intelligent staging |
| `test-driven-development` | Write tests before implementation |
| `folder-architecture` | Enforce best-practice folder structures |

Each skill is a `SKILL.md` file with YAML frontmatter:

```markdown
---
title: audit-codebase
description: Scan any codebase for structural health issues
category: code-quality
tags:
  - codebase-audit
  - refactoring
author: Drakaniia
---

# Audit Codebase

Instructions for the AI...
```

## File System Layout

### Global Directory (`~/.grail/`)

```
~/.grail/
├── skills/
│   ├── audit-codebase/
│   │   └── SKILL.md
│   ├── frontend-design/
│   │   └── SKILL.md
│   └── ...
└── skills-index.json      ← Generated index (consumed by frontend)
```

### Project Directory (when inside Holy Grail)

```
<project>/.agents/skills/
├── audit-codebase/
│   └── SKILL.md
└── ...
```

## How It Works

`grail-cli` is a **hybrid Rust + TypeScript** CLI:

1. **TypeScript wrapper** (`cli/grail.ts`) — npm bin entry point, locates and spawns the Rust binary
2. **Rust binary** (`cli/src/main.rs`) — actual CLI logic using `clap`, `reqwest`, `serde_yaml`
3. **Postinstall script** (`cli/install.ts`) — on `npm install` or `npx grail`:
   - Downloads a prebuilt binary from GitHub Releases for your platform, OR
   - Falls back to `cargo build --release` (requires Rust)

Skills are fetched from GitHub repositories using the GitHub Contents API, then cached locally.

## Installing from Another Computer

```bash
# One command — works anywhere with Node.js installed
npx grail add Drakaniia/skills --skill audit-codebase
```

The postinstall script handles binary installation automatically:
- ✅ Windows (win32-x64)
- ✅ macOS Intel (darwin-x64)
- ✅ macOS Apple Silicon (darwin-arm64)
- ✅ Linux x64
- ✅ Linux ARM64

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GRAIL_HOME` | Override the global skills directory | `~/.grail/` |
| `GRAIL_GITHUB_API` | Override the GitHub API base URL | `https://api.github.com` |

## Interop with Other Tools

The CLI detects skills installed by other tools to prevent conflicts:

| Tool | Detection Method |
|------|-----------------|
| `npx skills` | `.skills-manifest.json` |
| `npx openskills` | `openskills.json` |

When a foreign skill is detected during removal, grail warns before proceeding.

## Development

### Prerequisites

- Rust toolchain (rustc + cargo)
- Node.js >= 18
- Bun (for Holy Grail project commands)

### Building

```bash
# From the Holy Grail root
bun run build:cli        # tsc + cargo build --release

# From cli/ directory
cd cli
tsc && cargo build --release
```

### Testing

```bash
cd cli && cargo test
```

### npm Publishing

```bash
cd cli
npm login                                # Authenticate with npm
npm version patch                        # Bump version
npm publish                              # Publish to npm registry
git push grail grail --tags              # Push tag to trigger binary build
```

## License

MIT — see the Holy Grail repository for details.
