# Newly Added Filter — Feature Spec

**Date:** 2026-09-13  
**Status:** Draft  
**Scope:** Sites, Extensions, Skills catalog pages  
**Excluded:** MCP servers (no `addedDaysAgo` field in data model)

---

## Goal

Add a "Newly Added" toggle button to the catalog listing pages (Sites, Extensions, Skills) so users can quickly filter to show only items added within the last 7 days.

## Definition of "Newly Added"

An item is "newly added" if its `addedDaysAgo` field is **≤ 7**. This field represents the number of days since the item was added to the catalog, computed relative to build time.

### Data Model Changes

- **Sites:** `addedDaysAgo` already exists on the `Site` interface (`stores/sites.ts`). No change needed.
- **Extensions:** `addedDaysAgo` already exists on the `Extension` interface (`stores/extensions.ts`). No change needed.
- **Skills:** `addedDaysAgo` does NOT currently exist. The `Skill` interface has `dateAdded` (ISO string). **Action required:**
  1. Add `addedDaysAgo: number` to the `Skill` interface in `stores/skills.ts`
  2. Compute `addedDaysAgo` from `dateAdded` in the skill index generator (in `packages/web/scripts/build/`) at build time
  3. The field is emitted alongside `dateAdded` in the generated `skills-index.json` / `skills-registry.json`

## UI Design

### Toggle Button

- **Appearance:** Text-only button — "Newly Added" — no icon
- **Position:** Inline with the existing sort buttons (Popular / Trending / Recent)
- **Styling:** Follows the same button pattern as the sort buttons:
  - Default: `border-gray-800 bg-[#1f1f1f] text-gray-400 hover:text-white`
  - Active: `border-zinc-600 bg-[#1f1f1f] text-white` (matching `getSortButtonClass` in SitesPage)
- **Behavior:** Toggle on/off. Click once to activate (shows only last-7-day items), click again to deactivate (reverts to unfiltered view)

### Count Display

When the toggle is active, the count shown (e.g., "12 sites") reflects **only** the items matching the current filters including the newly-added filter.

## Pages Affected

### 1. Sites Page (`pages/SitesPage.vue`)

- Add the "Newly Added" toggle button next to the existing sort buttons (Popular / time range dropdown / Explore / Recent)
- Add a `showNewlyAdded` reactive flag (`shallowRef<boolean>(false)`)
- Add filtering logic to `timeFilteredSites` or `displaySites` computed:
  ```
  if (showNewlyAdded.value) {
    result = result.filter((site) => site.addedDaysAgo <= 7)
  }
  ```
- **Reset behavior:** Reset `showNewlyAdded` to `false` when `category` or `subcategory` changes (in the existing `watch([category, subcategory])`)
- **Reset behavior:** Reset when the time range changes to "Trending" (already resets the sort)
- Wire the toggle button in the template

### 2. Extensions Page (`pages/ExtensionsPage.vue`)

- Add the "Newly Added" toggle button. Currently the Extensions page has no sort buttons — the toggle will be the first sort/filter control.
- Add a `showNewlyAdded` reactive flag
- Filter the `extensions` computed to include:
  ```
  if (showNewlyAdded.value) {
    result = result.filter((ext) => ext.addedDaysAgo <= 7)
  }
  ```
- Consider adding basic sort tabs (Popular / Trending / Recent) for consistency with other pages — or keep the toggle as a standalone filter if sorting is out of scope.
- **Reset behavior:** Reset on parent category change.

### 3. Skills Page (`pages/SkillsPage.vue`)

- Add the "Newly Added" toggle button inline with the existing sort tabs (POPULAR / TRENDING / RECENT)
- Add a `showNewlyAdded` reactive flag
- Filter `displaySkills` computed:
  ```
  if (showNewlyAdded.value) {
    result = result.filter((skill) => skill.addedDaysAgo <= 7)
  }
  ```
- **Reset behavior:** Reset on category change.
- The `addedDaysAgo` field on Skills must be populated first (see Data Model Changes above).

## Filter Logic Details

The "Newly Added" filter is an **additional AND filter** — it stacks on top of existing filters (search query, category, tags, time range). It does NOT replace any existing filter.

Filter pipeline (order):
1. Start with all items for the current page/context
2. Apply category filter
3. Apply search query filter
4. Apply tag filter (Skills only)
5. Apply time range filter (Sites only)
6. **Apply Newly Added filter** (if active): `item.addedDaysAgo <= 7`
7. Apply sort

## State Management

Each page manages its own `showNewlyAdded` state locally in the page component (as a `shallowRef<boolean>(false)`), NOT in the Pinia store. Rationale:
- The toggle is page-scoped UI state
- It resets on navigation (category/tab changes)
- It doesn't need to be shared across components
- Matches the existing pattern (e.g., `activeTimeRange` on SitesPage is local)

## Files to Modify

| File | Change |
|------|--------|
| `packages/web/src/stores/skills.ts` | Add `addedDaysAgo: number` to `Skill` interface |
| `packages/web/scripts/build/skills-index.ts` (or generator) | Compute and emit `addedDaysAgo` from `dateAdded` |
| `packages/web/src/pages/SitesPage.vue` | Add toggle + filter logic + reset watcher |
| `packages/web/src/pages/ExtensionsPage.vue` | Add toggle + filter logic + reset watcher |
| `packages/web/src/pages/SkillsPage.vue` | Add toggle + filter logic + reset watcher |

## Edge Cases

- **No items in the last 7 days:** Show empty state with a message like "No newly added items found" and offer to clear the filter.
- **Empty category + newly added active:** The "Clear filters" button should also deactivate the toggle.
- **Search + newly added:** Both filters apply simultaneously. A search for "react" with newly added active shows only recently added items matching "react".
- **Pagination:** The toggle filters before pagination, so the total page count adjusts correctly.

## Testing

- Manual: Toggle on/off on each page, verify filter applies and resets correctly
- Verify count updates when toggle is active
- Verify toggle resets on category change
- Verify search + newly added + category all stack correctly
- Run `bun run type-check` to verify no type errors from the new `addedDaysAgo` field on Skills
