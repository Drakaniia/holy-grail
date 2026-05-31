# Changelog

Generated from the full Git history on 2026-05-26. Current head: `77b50cd`.

Totals: 149 commits, 132 direct commits, 17 merge commits.

## v0.1.0 - 2026-05-31 - Site issue queue and catalog controls

### Highlights

- Added a Supabase-backed site issue queue for broken, legacy, wrong-URL, and other reports.
- Added admin triage for site issue reports with open, resolved, ignored, reopen, and delete actions.
- Refined the sites catalog controls with clearer sort modes, time-range filtering, and a publish shortcut.
- Clarified anonymous publishing before review submission.
- Refreshed UI-library catalog metadata, regenerated site indexes, and updated Spartan preview assets.
- Included recent site shell polish for the home page animation and random-site routing.

### Documentation

- Added release documentation in `docs/RELEASE-v0.1.0.md`.
- Updated Supabase docs for the site issue report table and dashboard flow.

### Verification

- `bun run type-check`
- `bun lint`
- `bun run build`
- `git diff --check`

### Commits

- `663eaef` docs: prune completed TODO items
- `df62873` content(sites): refresh UI library catalog
- `b56091e` feat(submissions): clarify anonymous publishing
- `929baa8` feat(sites): refine catalog controls
- `f216e81` feat(admin): queue site issue reports
- `9b048ac` fix(navbar): route random sites within app
- `f485972` chore(docs): prune TODO item
- `19dd6fd` chore(config): add antigravity project metadata
- `169cecf` chore(docs): update TODO notes
- `9412282` feat(sites): add spartan-ng catalog entry
- `bd924d2` fix(home): smooth landing page motion
- `2c15183` feat(home): add animated ShapeGrid hero background

## 2026-05-26 - Account polish, catalog refresh, and dependency maintenance

### Highlights

- Moved account controls into the sidebar and added editable profile settings.
- Refreshed development catalog routing, cloud-hosting classification, and site collection trails.
- Absorbed Dependabot updates for Vue, Vite, linting, Supabase, PostCSS, and supporting tooling.

### Commits

- `77b50cd` refactor(nav): move account menu to sidebar
- `55321ad` feat(account): add editable profile settings
- `0cb3a7e` docs(todo): format project task list
- `f160f4b` Merge pull request #18 from Drakaniia/dependabot/npm_and_yarn/grail/postcss-tw-8.5.15
- `067c260` deps: update postcss requirement from ^8.4.0 to ^8.5.15
- `bd5b673` Merge pull request #19 from Drakaniia/dependabot/npm_and_yarn/grail/eslint-tw-10.4.0
- `948e78a` Merge pull request #17 from Drakaniia/dependabot/npm_and_yarn/grail/markdown-it-tw-14.2.0
- `d3374bf` deps: update eslint requirement from ^10.2.1 to ^10.4.0
- `b10f00a` Merge pull request #13 from Drakaniia/dependabot/npm_and_yarn/grail/eslint-plugin-oxlint-1.66.0
- `e46464d` deps: update markdown-it requirement from ^14.1.1 to ^14.2.0
- `f36bf40` Merge pull request #16 from Drakaniia/dependabot/npm_and_yarn/grail/types/node-tw-25.9.1
- `6bdd525` deps: bump eslint-plugin-oxlint from 1.60.0 to 1.66.0
- `7953d55` deps: update @types/node requirement from ^25.7.0 to ^25.9.1
- `6ab5441` Merge pull request #11 from Drakaniia/dependabot/npm_and_yarn/grail/vite-tw-8.0.14
- `499b4d3` Merge pull request #12 from Drakaniia/dependabot/npm_and_yarn/grail/vue-tsc-tw-3.3.2
- `b74eaa9` deps: update vite requirement from ^8.0.8 to ^8.0.14
- `c1c13d8` deps: update vue-tsc requirement from ^3.2.8 to ^3.3.2
- `552455f` Merge pull request #7 from Drakaniia/dependabot/npm_and_yarn/grail/vue-tw-3.5.34
- `721672e` deps: update vue requirement from ^3.5.32 to ^3.5.34
- `8d77991` Merge pull request #5 from Drakaniia/dependabot/npm_and_yarn/grail/globals-tw-17.6.0
- `3e5a644` deps: update globals requirement from ^17.5.0 to ^17.6.0
- `28e2fff` Merge pull request #15 from Drakaniia/dependabot/npm_and_yarn/grail/supabase/supabase-js-tw-2.106.2
- `238bba1` deps: update @supabase/supabase-js requirement from ^2.106.0 to ^2.106.2
- `4bc386b` Merge pull request #14 from Drakaniia/dependabot/npm_and_yarn/grail/vitejs/plugin-vue-tw-6.0.7
- `50d221d` deps: update @vitejs/plugin-vue requirement from ^6.0.6 to ^6.0.7
- `426b415` Merge pull request #10 from Drakaniia/dependabot/npm_and_yarn/grail/vite-plugin-vue-devtools-tw-8.1.2
- `b2ac07a` Merge pull request #9 from Drakaniia/dependabot/npm_and_yarn/grail/autoprefixer-tw-10.5.0
- `a6105d0` deps: update vite-plugin-vue-devtools requirement from ^8.1.1 to ^8.1.2
- `69342d0` Merge pull request #8 from Drakaniia/dependabot/npm_and_yarn/grail/typescript-eslint-tw-8.60.0
- `15dac20` deps: update autoprefixer requirement from ^10.4.0 to ^10.5.0
- `6fcdbcf` deps: update typescript-eslint requirement from ^8.59.4 to ^8.60.0
- `a9c2068` Merge pull request #6 from Drakaniia/dependabot/npm_and_yarn/grail/vue-router-tw-5.0.7
- `a7cbd39` deps: update vue-router requirement from ^5.0.4 to ^5.0.7
- `4851f1d` Merge pull request #4 from Drakaniia/dependabot/npm_and_yarn/grail/oxlint-1.66.0
- `21869e2` deps: bump oxlint from 1.60.0 to 1.66.0
- `15dafa7` Merge pull request #2 from Drakaniia/dependabot/npm_and_yarn/grail/eslint-plugin-vue-10.9.1
- `b19624f` deps: bump eslint-plugin-vue from 10.8.0 to 10.9.1
- `9da1c39` feat(site-detail): show site collection trail
- `9540bb2` feat(sites): refresh website development catalog
- `e607270` docs: update project todo notes
- `8ca355b` chore(bookmarks): classify cloud hosting imports
- `1e34a32` feat(sites): move cloud hosting into development

## 2026-05-25 - Admin analytics, issue reporting, and catalog expansion

### Highlights

- Added admin analytics schema and dashboard work.
- Added down-site reporting through email notifications.
- Expanded watch, UI library, MCP, and component catalog coverage.

### Commits

- `0c6303b` feat(sites): add UI component catalog entries
- `fe65fe6` feat(admin): add analytics dashboard
- `e361711` feat(db): add admin analytics schema
- `c292688` feat(sites): add MCP Market catalog entry
- `2cbef4e` feat(sites): add UI library entries and previews
- `7a36a35` feat(sidebar): add tab search
- `36965d8` docs: update project todo notes
- `03310eb` docs: document site preview workflow
- `125bad1` feat(sites): email admin for down-site reports
- `1b96d4f` feat: add watch catalog sites

## 2026-05-24 - Runtime indexes, landing page, and security hardening

### Highlights

- Moved generated catalog indexes to runtime fetches with public content copies.
- Added loading and error states for site and skill pages.
- Added standalone home page and hardened submissions/crawler defenses.

### Commits

- `b37119e` fix(security): harden submissions and crawler defenses
- `cbb5422` fix(home): prevent app shell flash on landing page
- `ff8bc23` feat(home): add standalone landing page
- `ae1bf03` fix(sites): make filter tabs sort consistently
- `3d41eb8` feat(sites): add blockus UI library
- `5a8c5ea` feat: add Backlit UI to ui-libraries
- `c21aa7d` chore: add trailing newline to .env.example
- `171c727` chore(vite): suppress rolldown pluginTimings check
- `6e27ff2` fix(search): trigger loadSites and loadSkills in useSmartSearch
- `3d861f3` fix(bookmarks): trigger loadSites and loadSkills on mount
- `1f5ce64` feat(skills): add loading and error states to SkillsPage and SkillDetail
- `230541e` feat(sites): add loading and error states to SitesPage and SiteDetail
- `3a0a10a` refactor(stores): lazy-load indexes via fetch instead of static import
- `0d163d5` chore(scripts): write generated indexes to public/content as well

## 2026-05-21 - Submission intake, imported content, and external skills

### Highlights

- Added submission intake notifications and fixed review email links.
- Imported bookmarked site collections and cleaned imported metadata.
- Added academic research skills, external skill entries, and light-mode contrast fixes.

### Commits

- `3ea00c9` ci: remove grail workflow
- `8e1f1a6` docs: update project todo notes
- `6eb4533` chore(skills): add supabase local skills
- `7c22566` fix(auth): canonicalize oauth redirects
- `7e392de` fix(sites): make preview visit button readable
- `1be0e0c` feat(sites): add skills directory resource
- `1c9273c` feat(skills): add external skill catalog entries
- `52c969c` fix(skills): improve markdown contrast in light mode
- `c39e44a` fix(sites): improve preview visit button contrast
- `ecb78d8` feat(sites): expand site catalog resources
- `9d3331f` Add git commit skill
- `4c3ef38` Keep auth theme consistent
- `a924d80` Clean imported site metadata
- `859f48e` Import bookmarked site collections
- `f2ae402` Fix light mode auth UI contrast
- `726a385` Improve bookmark import and preview generation
- `946ba98` Add YouTube Transcript resource
- `cc73015` Add academic research skills
- `1179863` Fix submission review email link
- `ea97a1c` Implement submission intake notifications

## 2026-05-20 - Catalog architecture, previews, auth, admin, and bookmarks

### Highlights

- Reworked the catalog around nested categories, route filters, Pinia helpers, and sidebar navigation.
- Added bookmark import, enrichment, detail-fill, static preview generation, and documentation for content workflows.
- Added Supabase auth, account, bookmarks, admin review, submission intake, command palette, and responsive layout polish.

### Commits

- `d4bd136` fix command palette focus on open
- `e62bddd` chore clean up vercel build warnings
- `e61f68b` add nitro tool entry
- `cb70449` fix auth callback session feedback
- `03e843f` fix: simplify OAuth callback flow
- `fdc1ca4` fix: complete Supabase OAuth callback
- `5143832` docs: update project todo
- `a6569c4` fix: normalize auth redirect origin
- `b89b943` style: improve responsive content layouts
- `ff4f8f4` feat: polish app shell and command palette
- `8af0663` chore: update TODO and skills-lock
- `86cc647` feat: wire BookmarkButton into SiteCard, SiteDetail, SkillDetail; update Navbar with UserMenu
- `0d35ac4` feat: implement Supabase auth store, AuthPage, AccountPage, credentials form
- `ce8261f` feat: add bookmarks store, BookmarkButton, BookmarksPage, UserAvatar
- `cd5a338` feat: add RBAC admin store and submissions review page
- `ac35fb7` feat: add submit tool page and wire sidebar button to /submit
- `1631ecd` feat(app): render auth routes full-screen without sidebar and navbar
- `dbc6ef6` feat(navbar): replace inline SVGs with lucide icons; add auth-aware user menu
- `93e97a1` feat(router): add auth routes with requiresAuth and guestOnly guards
- `d3ecdcc` feat(auth): add login/signup and account pages with auth form components
- `6d1688c` feat(auth): add Supabase client, auth store, and auth type definitions
- `90370e9` chore: add supabase-js dep; gitignore .env files; declare env var types
- `96fa324` docs: expand TODO with auth UI/UX note
- `3ba1f2b` refactor(pagination): extract PaginationControls component; show page range in count
- `7686b57` fix(stores): reset page on tab change; clamp setPage to valid integer
- `31067e8` docs: update ADDING-SITES.md for static preview generation workflow
- `e9caa27` fix(pages): remove min-h-screen from page roots to fix footer layout
- `865ae5e` feat(layout): make footer always visible; remove scroll-based show/hide
- `c8014aa` feat(sites): add SitePreview component; refactor SiteDetail header and nav
- `d6044ee` feat(content): add development sites; fix fly/neon/render platform entries; remove expo/testsprite
- `530538f` feat(nav): add development category to router, sidebar, and sites page
- `a25e5f7` feat(scripts): add development category context to fill-site-detail-sections
- `d8e5db3` feat(scripts): improve import-bookmarks with URL normalization and development category routing
- `92999e8` feat(scripts): add static site preview generator (puppeteer + sharp)
- `d117d65` chore: add puppeteer-core and sharp for site preview generation
- `6a9a256` docs: rewrite ADDING-SITES.md for nested structure and import flow
- `3731911` docs: add TODO.md with planned features
- `53c3864` feat(sites): conditionally render repo stats; improve deployment section
- `a91bc58` feat(content): enrich site meta.yaml files with contributors/commits/releases
- `2191a92` feat(scripts): add site metadata enrichment and detail-fill scripts
- `94d7f59` chore(docs): update AGENTS.md with current routes and commands
- `fb3ba36` chore: remove stale .windsurf/skills symlinks
- `3eef7a2` feat(scripts): add bookmark HTML importer to generate site meta.yaml files
- `853b672` feat(pages): filter sites/skills by route category and subcategory
- `f8dbffa` feat(sidebar): rewrite with category-aware nav and collapsible groups
- `64df8b9` feat(router): add category-based routes for sites and skills
- `d5d4bde` feat(stores): add parentCategory/subcategory fields and filter helpers
- `2a489b3` feat(content): restructure sites into category subdirectories
- `4c41131` feat(scripts): support nested category dirs in index generators
- `4238c44` chore: add typescript-eslint, extend eslint config for ts/vue

## 2026-05-17 - Holy Grail branding and first full catalog shell

### Highlights

- Added sites management, sidebar navigation, site details, screenshot previews, and black/orange visual direction.
- Rebranded from Toolfolio to Holy Grail and aligned CI with the grail branch.
- Pulled real GitHub repository metadata into the UI.

### Commits

- `ffcc354` ci: update workflows to target grail branch
- `01eac47` style: reduce sidebar text and icon sizes
- `278d5b2` fix: replace Toolfolio branding with Holy Grail
- `27e297d` fix: use real GitHub repo URL and fetch live star count
- `08b6a7d` change accent color from blue to pomelo orange
- `f07289d` refactor: remove add skill button from skills page
- `f8df335` feat: redesign UI with black gradient backgrounds, add favicon component and screenshot previews
- `6085b84` feat: add sites management with sidebar navigation and site detail pages

## 2026-05-16 - Skills catalog and automation foundations

### Highlights

- Added the skills page with GitHub content fetching.
- Added Dependabot, CI, and release workflows.
- Iterated on footer behavior before the later always-visible footer refactor.

### Commits

- `9f877bf` ci: add dependabot, CI, and release workflows
- `9efa4c5` feat: implement skills page with GitHub content fetching
- `cc34dad` refactor footer to minimal design and add scroll-based footer visibility toggle in App.vue

## 2026-05-14 - Early test commit

### Highlights

- Recorded an early repository test checkpoint.

### Commits

- `32c63b4` test

## 2026-05-13 - Initial project seed

### Highlights

- Created the initial Holy Grail repository baseline.

### Commits

- `261f32f` holy grail
