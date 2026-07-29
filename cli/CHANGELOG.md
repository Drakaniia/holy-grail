# grail-cli Changelog

## v0.1.0 (2026-07-29)

**Initial npm release** — the Holy Grail skill manager now available via `npx grail-cli`.

### Features

- **`add`** — Install AI skills from any GitHub repository following the `SKILL.md` convention
  - Single-skill repos install automatically
  - Multi-skill repos show an interactive picker
  - Supports `--skill <name>` to install a specific skill directly
- **`list`** — List all installed skills from `~/.grail/skills/`
- **`remove`** — Uninstall a skill with foreign-tool detection warnings
- **`find`** — Search installed skills by name, description, or content
- **`info`** — Show detailed metadata for an installed skill
- **`update`** — Update skills to their latest version from GitHub
- **`index`** — Regenerate the skills index for `~/.grail/` and Holy Grail projects

### Distribution

- Published to npm as `grail-cli`
- Prebuilt Rust binaries for 5 platforms (via GitHub Actions):
  - `linux-x64`, `linux-arm64`
  - `darwin-x64`, `darwin-arm64`
  - `win32-x64`
- Falls back to `cargo build --release` when no prebuilt binary is available
- Thin TypeScript wrapper (`dist/grail.js`) locates and spawns the Rust binary

### Architecture

- Rust core (`cli/src/main.rs`) using `clap` for CLI parsing, `reqwest` for GitHub API, `serde_yaml` for SKILL.md frontmatter
- TypeScript wrapper (`cli/grail.ts`) handles binary discovery across dev and production paths
- Postinstall script (`cli/install.ts`) downloads prebuilt binaries with cargo fallback
- Skills stored in `~/.grail/skills/`, indexed in `~/.grail/skills-index.json`
