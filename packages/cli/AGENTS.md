# packages/cli — "grail" CLI Tool

Hybrid Rust+TypeScript CLI for skill management. Rust binary does the work; TypeScript shim wraps it for npm distribution.

## STRUCTURE

```
cli/
├── src/main.rs        # Rust binary (clap + reqwest + serde_yaml + serde_json + dirs + fs-err)
├── Cargo.toml         # Rust crate definition (crate name: "grail")
├── grail.ts           # Node bin entry — finds + spawns Rust binary
├── install.ts         # postinstall script — prebuilt binary download, cargo fallback
├── package.json       # Publishable npm package (name: "grail-cli")
├── tsconfig.json      # TypeScript config (ES2022, NodeNext resolution)
├── dist/              # Compiled JS output
├── tests/             # Rust tests
└── target/            # Rust build artifacts (gitignored)
```

## COMMANDS

```
grail list              # List installed skills
grail add <repo>        # Add a skill from a GitHub repo
grail remove <slug>     # Remove an installed skill
grail index             # Re-index installed skills
grail find [query]      # Search installed skills
grail info <slug>       # Show details for one skill
grail update [slug]     # Update a skill (all if omitted)
```

`interactive_select` in `src/main.rs` is hand-rolled — the crate takes no
`dialoguer` or `indicatif` dependency.

## BUILD

```bash
# From root:
bun run build:cli        # → packages/cli build:release (tsc + cargo build --release)

# From cli/:
bun run build            # tsc only — JS shim, no Rust binary
bun run build:release    # tsc + cargo build --release
```

The `postinstall` hook is plain `node dist/install.js`: it skips bootstrap in a
monorepo checkout, otherwise downloads the prebuilt binary and falls back to
`cargo build`. npm packaging is controlled by the `files` array in
`package.json` — there is no `.npmignore`.

## DEVELOPMENT

- **Edit behavior**: `src/main.rs` — this is the actual CLI implementation.
- **Edit install flow**: `install.ts` — postinstall hook.
- **Edit bin entry**: `grail.ts` — only if binary location or spawn logic changes.
- Run `cargo test` in `packages/cli/` for Rust unit tests.
- Build with `--release` for production — debug builds are slow.
