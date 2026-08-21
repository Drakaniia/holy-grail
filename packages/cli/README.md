# grail-cli

**Holy Grail skill manager** — discover, install, and manage AI skills for your coding assistant.

```bash
npx grail add owner/repo --skill skill-name
```

## Usage

### Add a skill

```bash
npx grail add Drakaniia/skills --skill audit-codebase
```

This downloads the skill from GitHub and installs it to `~/.grail/skills/`.

### List installed skills

```bash
npx grail list
```

### Remove a skill

```bash
npx grail remove skill-name
```

### Find skills

```bash
npx grail find query
```

### Show skill info

```bash
npx grail info skill-name
```

### Update skills

```bash
npx grail update       # update all
npx grail update name  # update specific
```

### Regenerate index

```bash
npx grail index
```

## What are skills?

Skills are reusable, self-contained instruction files (`SKILL.md`) that teach your AI coding assistant how to perform specific tasks — codebase auditing, folder architecture design, test-driven development, and more.

Each skill lives in a GitHub repo and can be installed with a single command.

## How it works

`grail-cli` is a thin TypeScript wrapper around a Rust binary. When you run `npx grail`, the postinstall script:

1. Downloads a prebuilt binary for your platform from GitHub releases, or
2. Falls back to building from source via `cargo` (requires Rust)

Skills are stored in `~/.grail/skills/` and indexed in `~/.grail/skills-index.json`.

## Repository

https://github.com/Drakaniia/holy-grail

## License

MIT
