# Contributing to Holy Grail

Thanks for your interest in contributing! Holy Grail is an open-source directory of developer tools, AI platforms, browser extensions, and learning resources.

<br/>

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Adding Content](#adding-content)
- [Code Style & Quality](#code-style--quality)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

<br/>

## Code of Conduct

Be respectful, constructive, and inclusive. This project is maintained by [Drakaniia](https://github.com/Drakaniia) and contributors.

<br/>

## Getting Started

### Prerequisites

- **Bun** (required) — Install from [bun.sh](https://bun.sh)
- **Node.js** 24.x (pinned in `.nvmrc` / `engines` in `package.json`)
- **Supabase keys** (optional) — The app runs without them; auth and submissions are gracefully disabled.

### Setup

```bash
# Clone the repository
git clone https://github.com/Drakaniia/holy-grail.git
cd holy-grail

# Install dependencies
bun install

# Fetch the previews submodule + install the pre-commit hook
bun run setup

# Copy environment variables (optional — only needed for Supabase features)
cp docs/.env.example .env.local

# Start the dev server
bun dev
```

`bun run setup` runs `git submodule update --init --recursive` (populates the
`holy-grail-assets` submodule at `public/previews`) and sets `core.hooksPath` so the
committed pre-commit hook keeps the submodule in sync with every commit. You can also
clone once with `git clone --recurse-submodules` to skip the `setup` fetch step.

The dev server runs at `http://localhost:5173` by default.

<br/>

## Project Structure

```txt
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Vue 3 components
├── composables/         # Shared Vue composables
├── content/             # Content definitions (sites, skills, extensions)
│   ├── sites/           #   meta.yaml files for each site
│   ├── skills/          #   meta.yaml files for each skill
│   └── extensions/      #   meta.yaml files for each extension
├── router/              # Vue Router configuration
├── stores/              # Pinia stores
├── utils/               # Utility functions
├── views/               # Page-level Vue components
└── App.vue              # Root component

scripts/
├── build/               # Index generation scripts
├── enrichment/          # Metadata enrichment scripts
└── previews/            # Screenshot generation scripts

docs/                    # Documentation (adding content, design, etc.)
.github/                 # CI workflows, issue/PR templates
```

<br/>

## Development Workflow

### Branching

- The main development branch is `grail`.
- Create feature branches from `grail`:

```bash
git checkout grail
git pull
git checkout -b feat/my-feature
```

### Commits

We follow [conventional commits](https://www.conventionalcommits.org/):

```
feat: add dark mode toggle
fix: correct site preview aspect ratio
docs: update README with new contributing section
refactor: extract Navbar search into composable
chore: bump dependencies
```

### CI Pipeline

Every push and pull request to `grail` runs:

```
type-check → lint → build → format:check
```

Make sure all steps pass before requesting a review:

```bash
bun run type-check
bun lint
bun run build
bun run format:check
```

<br/>

## Adding Content

The project has three content types, each defined as `meta.yaml` files:

| Content Type | Location | Index Command |
|---|---|---|
| Sites | `src/content/sites/<category>/<slug>/meta.yaml` | `bun run generate:previews` |
| Skills | `src/content/skills/<slug>/meta.yaml` | `bun run generate:skills` |
| Extensions | `src/content/extensions/<category>/<slug>/meta.yaml` | `bun run generate:extensions` |

For detailed instructions, see the dedicated guides:

- [Adding Sites](docs/ADDING-SITES.md) — Covers manual add flow, bookmark import, meta.yaml schema, feature objects, similar tools, images/previews, and enrichment scripts.
- [Adding Skills](docs/ADDING-SKILLS.md) — Covers directory structure, meta.yaml schema, and how skills are fetched from remote GitHub repos.
- [Adding Extensions](docs/ADDING-EXTENSIONS.md) — Covers directory structure, meta.yaml schema, extension-specific fields (Chrome Web Store metadata), routes, and the manual add flow.

### Quick Checklist for Content Contributors

- [ ] Created the correct directory structure
- [ ] `meta.yaml` follows the schema (all required fields present)
- [ ] `coreFeatures` and `additionalFeatures` are populated
- [ ] `similarTools` references existing entries from the same category
- [ ] Index regenerated (`bun run generate:previews`, `generate:skills`, or `generate:extensions`)
- [ ] `bun run type-check` and `bun lint` pass
- [ ] `bun run build` succeeds

<br/>

## Code Style & Quality

### Linting

We use both **oxlint** (fast Rust-based linter) and **ESLint** with Vue and TypeScript rules:

```bash
bun lint                # runs both linters
bun run lint:oxlint     # oxlint only
bun run lint:eslint     # ESLint only
```

### Formatting

[Prettier](https://prettier.io/) handles all formatting:

```bash
bun run format          # format everything
bun run format:check    # check without writing
```

### TypeScript

The project uses TypeScript with strict mode enabled. Run the type checker:

```bash
bun run type-check
```

### Tests

Tests use [Vitest](https://vitest.dev/) with [happy-dom](https://github.com/capricorn86/happy-dom):

```bash
bun test                # run all tests
bun test --run          # single run (no watch)
bun test --coverage     # with coverage report
```

### Vue Conventions

- Use **Composition API** with `<script setup>` and TypeScript
- Follow the existing component patterns in `src/components/`
- Use **Pinia** for state management — see `src/stores/`
- Use **Tailwind CSS 4** for styling — avoid inline styles

<br/>

## Pull Request Process

1. Ensure your branch is up to date with `grail`.
2. **For larger changes, open an issue first** to discuss the approach before investing time in code.
3. Run all quality checks locally (`type-check`, `lint`, `build`, `format:check`, `test`).
4. Open a pull request against the `grail` branch.
5. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely — the checklist there covers everything.
6. A maintainer will review your changes. Address any feedback.
7. Once approved, your PR will be squash-merged.

<br/>

## Issue Reporting

Found a bug or have a feature idea? We use GitHub Issues with templates:

- [🐛 Bug Report](.github/ISSUE_TEMPLATE/bug-report.yml) — For reproducible bugs
- [✨ Feature Request](.github/ISSUE_TEMPLATE/feature-request.yml) — For new features or enhancements
- [💬 Other](.github/ISSUE_TEMPLATE/other.yml) — For questions, discussions, feedback, or anything else

For open-ended questions or community discussion, use [GitHub Discussions](https://github.com/Drakaniia/holy-grail/discussions) instead.

<br/>

---

<p align="center">
  <a href="https://github.com/Drakaniia/holy-grail">← Back to README</a>
</p>
