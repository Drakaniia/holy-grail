# src/components/ — Vue 3 Component Library

Feature-grouped Vue 3 components using `<script setup lang="ts">` + Composition API.

## STRUCTURE

```
components/
├── admin/          # Admin panel (analytics, submissions, settings, site issues)
├── auth/           # Auth dialog, OAuth buttons, email form, user avatar/profile
├── bookmarks/      # Bookmark button + skeleton
├── changelog/      # Changelog entry card
├── docs/           # Docs code block + "on this page" nav
├── home/           # Home page (hero, directory map, featured ledger, shape grid)
├── icons/          # GitHubMark icon
├── mcp/            # MCP cards + hero
├── profile/        # Profile page (bookmarks, header, tabs, empty state)
├── publish/        # Publish flow (review summary, step indicator)
├── search/         # Command palette + search result logo
├── settings/       # Settings dialog + delete account
├── sidebar/        # Sidebar (expanded group, rail, header, footer, search — barrel via index.ts)
├── sites/          # Site cards, preview, detail skeleton, favicon, issue report
├── skills/         # 26 skill components (hero, cards, tabs, ratings, reviews, etc.)
└── shared/         # AppToast, Footer, Navbar, PaginationControls, Sidebar (root level)
```

## RULES

- **Feature-grouped**: components live in the directory matching their domain.
- **Async heavy components**: use `defineAsyncComponent` (CommandPalette, Sidebar).
- **No barrel files** except `sidebar/index.ts`. Import directly from component files.
- **Skills components**: contain TODO placeholders for `version`, `verified`, `rating`, `reviewCount` — data model not yet extended.
- **Skeleton components**: each detail/card view has a matching `*Skeleton.vue` for loading state.
- **Shared shell**: `AppToast.vue`, `Footer.vue`, `Navbar.vue`, `Sidebar.vue` live at root level.
