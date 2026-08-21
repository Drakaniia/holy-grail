# packages/cli — "grail" CLI Tool

Hybrid Rust+TypeScript CLI for skill management. Rust binary does the work; TypeScript shim wraps it for npm distribution.

## STRUCTURE

```
cli/
├── src/main.rs        # Rust binary (clap + reqwest + serde_yaml + dialoguer)
├── Cargo.toml         # Rust crate definition
├── grail.ts           # Node bin entry — finds + spawns Rust binary
├── install.ts         # postinstall script — builds Rust from source
├── package.json       # Publishable npm package (name: "grail")
├── tsconfig.json      # TypeScript config (ES2022, NodeNext resolution)
├── dist/              # Compiled JS output
├── tests/             # Rust tests
└── target/            # Rust build artifacts (gitignored)
```

## COMMANDS

```
grail add <repo>       # Add a skill from a GitHub repo
grail remove <slug>    # Remove an installed skill
grail update <slug>    # Update a skill
grail index            # Re-index installed skills
```

## BUILD

```bash
# From root:
bun run build:cli        # tsc + cargo build --release

# From cli/:
tsc && cargo build --release
```

The package.json `postinstall` hook runs `node dist/install.js` which builds the Rust binary if no prebuilt binary is cached.

## DEVELOPMENT

- **Edit behavior**: `src/main.rs` — this is the actual CLI implementation.
- **Edit install flow**: `install.ts` — postinstall hook.
- **Edit bin entry**: `grail.ts` — only if binary location or spawn logic changes.
- Run `cargo test` in `packages/cli/` for Rust unit tests.
- Build with `--release` for production — debug builds are slow.
