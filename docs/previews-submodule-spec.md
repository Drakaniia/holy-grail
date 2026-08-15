# Spec: Move `public/previews` to a Git Submodule with Commit-Time Sync

**Status:** Draft — approved decisions, no code changes yet
**Date:** 2026-08-15
**Branch:** `grail`

## 1. Goal

The main repo (`Drakaniia/holy-grail`) is bloated by binary assets under `public/`
(~21 MB on disk, 893 tracked files, `.git` ≈ 45 MB). The goal is to:

1. Move the heavy image directory `public/previews/` (~19 MB, 886 tracked files) into a
   **separate, public GitHub repo** mounted as a **git submodule**, so future growth of the
   main repo's working tree/history is ~zero for binary assets.
2. Add a package script + pre-commit hook so that **every commit in the main repo
   automatically commits & pushes the submodule** when previews changed — the two repos stay
   in sync without extra manual steps.
3. Keep all runtime behavior identical: previews still resolve at `/previews/<slug>.webp`
   and ship in the Vercel build output.

## 2. Background (verified facts)

| Item | Value | Notes |
|---|---|---|
| `public/previews/` | ~19 MB, 886 tracked files | WebP screenshots (`<slug>.webp`, `<slug>-sm.webp`) + `manifest.json` (116 KB) + `report.json` |
| `public/content/` | ~1.9 MB | **Runtime-fetched JSON** — the app fetches `/content/sites-index.json`, `/content/extensions-index.json`, `/content/mcp-index.json`, `/content/skills-registry.json` at runtime. **Stays in the main repo.** |
| `public/` remainder | ~200 KB | `favicon.ico`, `robots.txt`, `skills-index.json`, `icons/`. **Stay in the main repo.** |
| `.git` size | ~45 MB | Preview history is baked in. **Not rewritten** (see §9). |
| Main repo | `https://github.com/Drakaniia/holy-grail.git` | branch `grail` |
| Deploy | Vercel, `buildCommand: bun run build`, `outputDirectory: dist` | Vite copies `public/` → `dist` |
| CI | GitHub Actions `.github/workflows/ci.yml` | checkout → `bun install` → type-check → lint → build → format:check |
| Preview generation | `bun run generate:previews --slug X` | Puppeteer + Sharp, writes WebP into `public/previews/`, manifest into `public/previews/manifest.json` **and** `src/content/site-previews.json` |
| App usage of previews | `src/components/sites/SitePreview.vue` + `src/pages/SitesHomePage.vue` import `@/content/site-previews.json` (bundled) | `public/previews/manifest.json` is only used by the review script and docs |
| Review script | `scripts/previews/review-site-previews.py` | reads `public/previews/manifest.json` |

**Key external constraint:** Vercel fetches submodules at build time **only if they are
public over HTTP** — private submodules are not supported. Hence the submodule repo must be
public (accepted — previews are just screenshots of public sites).

## 3. Approved decisions (from interview)

1. **Approach: git submodule.** Supabase Storage was evaluated and rejected: the free tier
   (1 GB storage, 5 GB egress) fits the data, but **free projects pause after 1 week of
   inactivity**, which would 404 the preview images until manually unpaused. Not acceptable.
2. **Scope: only `public/previews/` moves.** All other `public/` content stays in the main
   repo (runtime-fetched JSON is generated pre-build and tightly coupled to source).
3. **Submodule repo:** new public repo `Drakaniia/holy-grail-assets`
   (`https://github.com/Drakaniia/holy-grail-assets.git`), mounted at `public/previews`.
4. **Sync trigger: pre-commit hook.** A committed `.githooks/pre-commit` hook runs
   `bun run sync:previews` before every `git commit`. This is the "whenever I commit" behavior.
5. **Push policy:** the sync script **commits and pushes the submodule automatically**,
   then stages the updated gitlink in the parent. It does **not** push the parent repo.
6. **No-op behavior:** if the submodule worktree is clean, the script exits 0 silently —
   no empty commits in the submodule repo.
7. **History:** not rewritten. Existing ~45 MB `.git` stays; the repo stops growing
   (future preview changes land in the submodule repo).
8. **Setup for clones/CI:** new `bun run setup` script (init submodule + install hook via
   `git config core.hooksPath .githooks`); CI checkout updated to `submodules: recursive`.
9. **Vercel:** no config change — public submodule is fetched automatically at build.
10. **Migration seed:** the new repo is seeded with the **full current content of
    `public/previews/`** — including the 8 uncommitted new previews in the working tree
    (border-beam, canvas-ui, cult-ui, lottieflow, originkit, transitions, useanimations,
    watermelon) — so nothing is lost.

## 4. Target architecture

**Before:**

```
holy-grail (main repo)
├── public/previews/*.webp, manifest.json, report.json   ← 19 MB, in git history
├── public/content/*.json                                ← runtime-fetched JSON (in git)
└── src/content/site-previews.json                       ← bundled preview manifest (in git)
```

**After:**

```
holy-grail (main repo)
├── public/previews → submodule → Drakaniia/holy-grail-assets (gitlink, mode 160000)
│     └── *.webp, manifest.json, report.json             ← only stored in submodule repo
├── public/content/*.json                                ← unchanged, still in main repo
├── .gitmodules                                          ← NEW
├── .githooks/pre-commit                                 ← NEW (runs bun run sync:previews)
└── src/content/site-previews.json                       ← unchanged, still in main repo
```

## 5. New / changed files

### 5.1 `.gitmodules` (new)
```ini
[submodule "public/previews"]
	path = public/previews
	url = https://github.com/Drakaniia/holy-grail-assets.git
```

### 5.2 `package.json` (add two scripts)
```jsonc
"setup": "git submodule update --init --recursive && git config core.hooksPath .githooks",
"sync:previews": "node scripts/build/sync-previews.js"
```
- `bun run setup` — one-time per fresh clone: populates the submodule and installs the hook.
- `bun run sync:previews` — commits + pushes submodule changes, stages the gitlink. Called
  by the pre-commit hook; also runnable manually.

### 5.3 `.githooks/pre-commit` (new, committed, executable)
```bash
#!/usr/bin/env bash
# Keep the previews submodule in sync with the parent repo.
# If previews changed, commit+push them (see scripts/build/sync-previews.js),
# then stage the gitlink so this commit records the new submodule revision.
bun run sync:previews || { echo "pre-commit: preview sync failed — commit aborted" >&2; exit 1; }
```
Notes:
- Exit non-zero → `git commit` aborts (correct: the parent must never reference an unpushed
  submodule commit).
- Runs on Windows via Git for Windows bash; requires `bun` on PATH (project is bun-only anyway).
- Hook file is committed to the repo; `core.hooksPath` (local config) makes git use it.

### 5.4 `scripts/build/sync-previews.js` (new)
Behavior (runnable via `bun run sync:previews`):

1. Resolve submodule dir = `<projectRoot>/public/previews`.
2. If the submodule is **not initialized** (no `.git` file inside, dir empty) → warn and exit 0
   (nothing to sync; previews will show placeholder until `bun run setup` is run).
3. `git status --porcelain` inside the submodule. If clean → print `previews: no changes` and
   exit 0 (**silent skip**).
4. Otherwise:
   - `git add -A` inside the submodule.
   - Commit with a conventional message, e.g.:
     `chore: update previews (N added, M changed, K removed)` — computed from `--porcelain`.
   - `git push origin HEAD` (push the submodule's current branch to its origin). Must succeed
     before the parent commit references the new SHA.
   - Back in the parent: `git add public/previews` to stage the updated gitlink.
   - Print a summary (files changed, submodule SHA before → after).
5. Exit 0 on success; non-zero with a clear message on any failure (push rejected, no commits
   in submodule yet, etc.).

Ordering guarantee: the submodule commit exists **and is pushed** before the parent commit
records the gitlink, so any `git clone --recurse-submodules` (and Vercel) can resolve it.

### 5.5 `.gitignore` (edit)
Add:
```
# Preview images live in the holy-grail-assets submodule
public/previews/
```

### 5.6 `.github/workflows/ci.yml` (edit)
```yaml
- uses: actions/checkout@v6
  with:
    submodules: recursive
```
(Build passes without previews too, but the dist artifact should be complete.)

### 5.7 Docs (edit)
- `README.md` / `CONTRIBUTING.md` / `docs/ADDING-SITES.md`: document that previews live in
  the `holy-grail-assets` submodule; new clones must run `bun run setup`
  (or clone with `git clone --recurse-submodules`).
- `src/pages/DocumentationPage.vue`: update the generated-file table entry for
  `public/previews/manifest.json` to note it now lives in the submodule repo.

## 6. One-time migration plan (executed once, after repo creation)

> Prerequisite: user creates `Drakaniia/holy-grail-assets` (public). The `gh` CLI on this
> machine has an invalid token, so repo creation is a manual step:
> `https://github.com/new` → name `holy-grail-assets` → Public.

1. **Stash nothing / stage nothing unexpected** — current working tree has pending changes
   (8 new sites' content + indexes + previews). These are intentionally part of the migration.

2. **Seed the submodule repo with current content** (avoids the "directory already exists"
   conflict of `git submodule add`):
   ```bash
   mv public/previews /tmp/previews-staging
   git submodule add https://github.com/Drakaniia/holy-grail-assets.git public/previews
   cp -r /tmp/previews-staging/. public/previews/
   rm -rf /tmp/previews-staging
   ```
3. **First commit in the submodule** (pushed before the parent commit references it):
   ```bash
   cd public/previews
   git add -A
   git commit -m "feat: initial previews migration (886 files)"
   git branch -M main && git push -u origin main
   cd ../..
   ```
4. **Untrack previews from the parent** (already handled by `git submodule add`, which
   replaces the tracked dir with the gitlink; verify with `git status` that `public/previews`
   now shows as a gitlink change, not per-file changes).
5. **Add the new files**: `.gitmodules` (created by `git submodule add`), `.githooks/pre-commit`,
   `scripts/build/sync-previews.js`, `package.json` edits, `.gitignore` edit, `ci.yml` edit,
   doc updates.
6. **Install the hook locally:** `git config core.hooksPath .githooks` (same as `bun run setup`).
7. **Commit the parent** — the commit message should describe both the migration and the
   pending site additions (they're interleaved in the working tree):
   ```
   refactor: move previews to holy-grail-assets submodule
   ```
   The pre-commit hook runs; submodule is already clean (just pushed in step 3) so it no-ops.
   `git push origin grail`.

## 7. Steady-state workflows

### Adding a site with a preview (the common case)
```bash
bun run generate:previews --slug my-new-site   # writes *.webp + manifest into submodule worktree
                                               # and src/content/site-previews.json
git add -A                                     # or targeted adds
git commit -m "feat: add My New Site"          # pre-commit hook: commits+pushes submodule,
                                               # stages gitlink, commit proceeds
git push origin grail                          # deploys on Vercel with previews present
```
Nothing else changes — generation and commit UX are identical to today.

### Fresh clone (contributor)
```bash
git clone https://github.com/Drakaniia/holy-grail.git
cd holy-grail
bun install
bun run setup        # git submodule update --init + core.hooksPath
```
Alternative one-liner: `git clone --recurse-submodules ...`. If a contributor skips `setup`,
the app still works — previews render the existing "no preview" placeholder (handled by the
`@error` path in `SitePreview.vue`).

### CI
`actions/checkout@v6` with `submodules: recursive` → `bun run build` copies the previews
into `dist` as before.

### Vercel
No change. The GitHub integration clones the parent with the public submodule over HTTP,
so `dist` contains the WebP files exactly as today. The `/previews/*` `X-Robots-Tag` header
rule in `vercel.json` still applies.

## 8. Edge cases & failure modes

| Case | Behavior |
|---|---|
| Submodule worktree clean on commit | Hook exits 0 silently; no submodule commit/push. |
| Submodule not initialized (fresh clone, no `setup`) | Script warns + exits 0; commit proceeds. Previews show placeholder until `setup`. |
| `git push origin HEAD` fails in submodule (auth/network) | Hook exits non-zero; **parent commit aborts**. This is deliberate — an unpushed gitlink would break clones/Vercel. |
| Submodule repo has no commits yet | Script prints "no commits in submodule — run the migration seed first" and exits non-zero. Only relevant during setup. |
| Two commits in quick succession with pending preview changes | First commit pushes the submodule; second sees clean worktree → no-op. Correct. |
| Amending/rebasing a commit that staged a gitlink | Standard git behavior; gitlink records the submodule SHA. If the submodule isn't pushed, a later force-push could orphan it — same caveat as today's binary files. |
| `git submodule update --remote` misuse | Not used; the submodule is pinned to exact SHAs by the gitlink. |
| Private submodule accidentally later | Vercel builds would fail to fetch it — keep the repo public. |

## 9. Explicitly out of scope (documented for later)

- **History rewrite** (e.g. `git filter-repo` to strip `public/previews` from all commits):
  deliberately skipped. Existing clones keep ~45 MB of history; growth stops now. Rewriting
  would force-push and re-clone everyone. If desired later, do it as a separate, coordinated
  change after this migration settles.
- **Supabase Storage alternative:** rejected due to free-tier pause-after-inactivity risk;
  re-evaluate only if the project moves to a paid plan.
- **Moving `public/content/` or other assets:** not wanted — those are small, generated at
  build, and fetched at runtime; coupling them to a submodule would add sync churn for no gain.
- **Moving `public/icons/`:** not wanted (negligible size, changes with source content).

## 10. Verification plan

1. `bun run setup` on the existing checkout → submodule populated, `core.hooksPath` set.
2. `git commit` with no preview changes → hook no-ops, commit succeeds.
3. Generate one throwaway preview (`bun run generate:previews --slug <existing>` → refresh),
   `git commit` → verify: submodule got a new commit, `git push` to `holy-grail-assets`
   succeeded, parent commit includes gitlink bump + `src/content/site-previews.json`.
4. `git clone` (no `--recurse-submodules`) into a temp dir → `bun install && bun run setup`
   → previews present; `git clone --recurse-submodules` also works.
5. `bun run type-check` and `bun run build` pass; `dist/previews/*.webp` present.
6. `bun lint` passes (hook script + JS style).
7. After pushing `grail`, confirm the Vercel deploy's `dist/previews/` contains the WebP files
   (public submodule fetched over HTTP).
8. `git count-objects -vH` before/after a preview-generating commit → main repo `.git` growth
   is ~0 (delta lives in the submodule repo).

## 11. Rollback

- **Pre-migration:** nothing is force-pushed; `git submodule deinit public/previews &&
  git rm public/previews` (or `git reset`) restores tracked files from history if the seed
  commit hasn't been pushed to `holy-grail-assets`.
- **Post-migration (if submodules prove too annoying):** `git submodule deinit -f
  public/previews && git rm -f public/previews`, remove `.gitmodules` + `.githooks` +
  `sync:previews` script, restore files from the submodule checkout, and revert to the
  current committed-file approach. All submodule content is recoverable from
  `holy-grail-assets` (public repo).
