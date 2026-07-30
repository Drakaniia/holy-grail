# Homepage Replacement Specification

**Author:** Buffy (Freebuff AI Agent)
**Date:** 2026-07-30
**Status:** Draft — pending implementation

---

## 1. Overview

Completely remove the existing home page (`/`) and replace it with the current `/sites` page (SitesHomePage). The root route will serve as the app's main landing page, featuring the curated site catalog with hero carousel, featured tools, trending tools, and discovery sections.

---

## 2. User Decisions (from interview)

### 2.1 Approach
- **Complete removal** of the old home page and all its associated components/files.
- **Route swap**: The root route `/` will render the current SitesHomePage (renamed conceptually, not physically).
- **No content changes** to the SitesHomePage — it moves to `/` as-is.

### 2.2 URL structure
- **Canonical URL**: `/` is the only entry point.
- **Redirect**: `/sites` → `/` (301 redirect).
- The address bar will show `/`.

### 2.3 Layout
- **App shell**: The new home page uses the app shell layout (sidebar + Navbar + Footer), unlike the old standalone home page.
- The sidebar, main Navbar, and Footer all render normally at `/`.

### 2.4 Navigation
- Logo (in Navbar) → keeps linking to `/`.
- No special breadcrumb needed on subpages — standard browser back works.
- Route name stays `'home'` (no rename).
- Subcategory route `/sites/ai`, `/sites/design`, etc. remain unchanged.

### 2.5 SEO
- Update document title and meta tags for the root route to reflect the catalog nature.

### 2.6 Data loading
- Add route-level data prefetching to make the home page feel instant (rather than waiting for component mount).

### 2.7 Extra changes
- None beyond the swap itself. No analytics changes, no new features.

---

## 3. Files to Delete

The following files are no longer used and should be removed:

| File | Reason |
|------|--------|
| `src/pages/HomePage.vue` | Replaced by SitesHomePage at `/` |
| `src/components/home/HomeHero.vue` | Only used by HomePage |
| `src/components/home/HomeNavbar.vue` | Only used by HomePage |
| `src/components/home/HomeDirectoryMap.vue` | Only used by HomePage |
| `src/components/home/HomeFeaturedLedger.vue` | Only used by HomePage |
| `src/components/home/ShapeGrid.vue` | Only used by HomeHero |
| `src/composables/useRandomPreviewTiles.ts` | Only used by HomeHero and HomeFeaturedLedger |
| `src/types/home.ts` | Only used by HomePage and home components |
| `tests/shapegrid.test.ts` | Tests for deleted ShapeGrid/HomeHero |

---

## 4. Files to Modify

### 4.1 `src/router/index.ts`

| Change | Detail |
|--------|--------|
| Route `/` → component | Change from `HomePage` (lazy import) to `SitesHomePage` (already imported at top level) |
| Route `/sites` → redirect | Change from `SitesHomePage` component to a `redirect: '/'` |
| Route naming | Keep `name: 'home'` for `/`. Remove or rename the `/sites` route name. |
| Data prefetching | Add `beforeEnter` guard that prefetches sites store data so the page loads instantly |
| Lazy import cleanup | Remove unused `HomePage` lazy import |
| Redirect cleanup | Remove dead redirect entries for `/sites/platforms`, `/sites/cli-tools`, `/sites/ui-libraries` (they're sub-routes of `/sites/:category` which now redirects to `/`) |

**Decision needed**: Since `/sites` redirects to `/`, the subcategory routes under `/sites/:category/:subcategory?` will also redirect to `/` first. This would break the subcategory browsing. Therefore:
- Keep `/sites/:category/:subcategory?` and `/sites/:slug` routes at their current paths.
- Only redirect `/sites` (exact) and `/sites/platforms`, `/sites/cli-tools`, `/sites/ui-libraries` to `/`.
- All subcategory and detail routes under `/sites/...` stay as-is.

### 4.2 `src/App.vue`

| Change | Detail |
|--------|--------|
| `isStandaloneRoute` computed | Remove `route.name === 'home'` from the list of standalone routes |
| App shell behavior | The home page will now use the app shell (sidebar + Navbar + Footer) |

### 4.3 `src/components/Navbar.vue`

| Change | Detail |
|--------|--------|
| Breadcrumb/logo behavior | Verify the `RouterLink to="/"` for the logo works correctly (it already does) |
| Navbar label on `/` | Show a "Browse" or "Sites" label in the Navbar when on the root route |

### 4.4 `src/stores/sites.ts` (if needed)

| Change | Detail |
|--------|--------|
| Data prefetching helper | Add a small method or ensure `loadSites()` works cleanly for route-level prefetching |

### 4.5 Route meta / SEO

| Change | Detail |
|--------|--------|
| `document.title` | Update the root route's document title to something like "Holy Grail — Curated Site Catalog" |
| Meta description | Add a meta description for the root route |

---

## 5. Implementation Steps (ordered)

1. **Delete** all old home page files (listed in §3).
2. **Modify** `src/router/index.ts`:
   - Remove `HomePage` lazy import.
   - Change `/` route component from `HomePage` to `SitesHomePage`.
   - Change `/sites` route from component to redirect `/`.
   - Remove dead redirect routes (`/sites/platforms`, `/sites/cli-tools`, `/sites/ui-libraries`).
   - Add route-level data prefetching (call `useSitesStore().loadSites()` in `beforeEnter`).
   - Update route meta for SEO.
3. **Modify** `src/App.vue`:
   - Remove `'home'` from `isStandaloneRoute` computed.
4. **Modify** `src/components/Navbar.vue`:
   - No changes needed unless we add a "Sites" label to the Navbar when on `/`.
5. **Run** the build generators (`bun run build` or appropriate commands).
6. **Typecheck** and **lint**.
7. **Smoke test** dev server.

---

## 6. Files NOT Affected

- `src/pages/SitesHomePage.vue` — stays as-is, just rendered at `/` instead of `/sites`.
- All `src/components/sites/home/*` components — unchanged.
- `src/composables/useSitesHomeCatalog.ts` — unchanged.
- `src/stores/sites.ts` — unchanged (minor data prefetch add optional).
- `src/components/Sidebar.vue` — unchanged.
- `src/components/Footer.vue` — unchanged.
- All detail pages (`SiteDetail.vue`, `SkillDetail.vue`, etc.) — unchanged.
- Supabase functions, CLI, scripts — unchanged.
- CSS/theme files — unchanged (SitesHomePage already has full theme support).

---

## 7. Edge Cases & Considerations

### 7.1 Broken links to `/sites`
Any internal links pointing to `/sites` (e.g., from Sidebar, Navbar, content pages) will now redirect to `/`. This is acceptable since `/sites` → `/` redirect.

### 7.2 Sidebar highlight
The Sidebar currently highlights `/sites` based on route matching. Since `/` is now the sites home, the Sidebar should highlight the Sites section when at `/`. The route matching logic in `Sidebar.vue` uses `route.path.startsWith('/sites/')` and `route.path === '/sites'` — we need to add `route.path === '/'` to properly highlight.

### 7.3 Command Palette search
The Command Palette may have a "Sites home" entry that links to `/sites`. Update these to link to `/`.

### 7.4 Old home page data loading
The old `HomePage.vue` eagerly loaded both sites and skills stores in `<script setup>`. The SitesHomePage only loads sites via `useSitesHomeCatalog`/`onMounted`. Skills data will no longer be eagerly loaded on the home page — this is intentional and acceptable.

### 7.5 Preview images
The old HomePage imported `site-previews.json` eagerly. The SitesHomePage imports it lazily on mount. This is fine and arguably better for performance.

### 7.6 Redirect loops
Ensure no redirect loop: `/` → `/sites` → `/`. The implementation should only redirect from `/sites` (exact match) to `/`.

### 7.7 Auth callback edge case
The auth callback detection in `router.beforeEach` checks for OAuth parameters in query — this is unaffected since it happens before route resolution.

---

## 8. Acceptance Criteria

- [ ] Visiting `/` shows the SitesHomePage content (carousel, featured, trending, discovery).
- [ ] Visiting `/sites` redirects to `/`.
- [ ] The sidebar is visible on `/` (app shell).
- [ ] The Navbar is visible on `/` (app shell).
- [ ] The Footer is visible on `/` (app shell).
- [ ] No old home page components render anywhere.
- [ ] All old home page files are deleted from the codebase.
- [ ] Subcategory routes like `/sites/ai`, `/sites/design/inspiration` continue to work.
- [ ] Site detail routes like `/sites/my-slug` continue to work.
- [ ] The logo in the Navbar links to `/` and works.
- [ ] The old test file `tests/shapegrid.test.ts` is deleted.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Build succeeds.
