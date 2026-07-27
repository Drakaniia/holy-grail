<p align="center">
  <img src="src/assets/readme.png" alt="Holy Grail" width="100%" />
</p>
<p align="center">
  <a href="holy-grail-eta.vercel.app/sites"><strong>Visit the site »</strong></a>
  <br />
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#adding-content"><strong>Adding Content</strong></a> ·
  <a href="docs/DESIGN.md"><strong>Design System</strong></a> ·
  <a href="CHANGELOG.md"><strong>Changelog</strong></a>
</p>

<p align="center">
  <a href="https://github.com/Drakaniia/holy-grail/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/Drakaniia/holy-grail/ci.yml?branch=grail&style=flat&label=build&color=f59e0b" alt="Build status" />
  </a>
  <a href="https://github.com/Drakaniia/holy-grail/LICENSE">
    <img src="https://img.shields.io/github/license/Drakaniia/holy-grail?style=flat&color=f59e0b" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat&logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Bun-required-fbf0df?style=flat&logo=bun&logoColor=black" alt="Bun" />
</p>

<br />

## Introduction

Holy Grail is an open-source, handpicked directory of developer tools, AI platforms, browser extensions, and learning resources. Every entry is reviewed and enriched with live screenshots — built for developers who value signal over noise.

Built with Vue 3, Vite 8, TypeScript, Tailwind CSS 4, Pinia, and Supabase.

<br />

## Getting Started

```bash
bun install
cp docs/.env.example .env.local  # add your Supabase keys
bun dev
```

The app runs without Supabase — auth and submissions are gracefully disabled.

<br />

## Adding Content

Sites and extensions are defined as `meta.yaml` files under `src/content/`. Skills are managed via the grail CLI.

```bash
bun run generate:skills     # regenerate skills index (auto-detects CLI or YAML source)
bun run generate:previews   # after adding a site (captures screenshot)
```

Full guides: [`docs/ADDING-SITES.md`](docs/ADDING-SITES.md) · [`docs/GRAIL-CLI.md`](docs/GRAIL-CLI.md) · [`docs/ADDING-EXTENSIONS.md`](docs/ADDING-EXTENSIONS.md)

<br />

## Contributing

Pull requests are welcome. For larger changes, open an issue first.

CI runs `type-check → lint → test → build` on every push to `grail`.

<br />

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Drakaniia">Drakaniia</a>
</p>
