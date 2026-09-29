# 21st.dev marketplace sidebar — reference & reimplementation spec

Captured **2026-09-29** from `https://21st.dev/community/components` at a 1440×900 viewport
(dark theme; the site also ships a light palette — see [Tokens](#tokens)).
Everything below is measured from the live DOM / computed styles, not eyeballed from a picture.

States exercised live: **open**, **closed**, **hover-revealed**, **search/filter mode**, **mobile (≤768px)**.

> Reference screenshots were taken in the preview browser during the session but are not stored in
> this repo. Each state is described in enough detail to rebuild it from measurements alone.

---

## 1. What the sidebar actually is

A **fixed 240 px app-shell column** that owns three things:

| Zone | Height | Content |
|---|---|---|
| Header | 118 px | context row (logo + hover-only close) · back/title row · search field |
| Body | fill (`h-svh − header − footer`) | **one animated panel**, swapped between *Browse* and *Search/Filters* |
| Footer | 36 px | help button · auth pill · **floating promo card pinned above it** |

It is **not** an overlay drawer on desktop — it participates in layout, and the main column
reflows next to it (`flex h-svh w-full`; `main` = `flex-1`). Below 768 px it disappears entirely
and a bottom tab bar takes over.

The shell is a **shadcn `sidebar` descendant**: the DOM carries `data-sidebar="content"`,
`data-sidebar="group"`, `data-sidebar="group-content"`, `group/sidebar`,
`group-data-[collapsible=icon]:overflow-hidden`, plus `--sidebar-background / --sidebar-foreground /
--sidebar-border / --sidebar-accent` tokens. Worth copying wholesale — it means the shadcn
docs/vocabulary transfer directly.

---

## 2. Layout tree (measured)

```
div[data-marketplace-page] .flex.h-svh.w-full.relative.overflow-hidden
├── div[data-left-edge-hover]                      fixed left-0 top-0 w-4 h-full z-50   ← hover reveal
└── div.sidebar-wrapper                            240px · border-r 0.5px · overflow hidden
    │   inline style: min-width:0; max-width:calc(100% - 350px); width:240px; opacity:1
    ├── div.absolute.cursor-col-resize (8px, z-10)  ┐ resize hit areas (invisible)
    ├── div.absolute.cursor-col-resize (4px, z-10)  ┘
    └── div.group/sidebar .flex.flex-col.h-full
        └── div[data-sidebar=content] .flex.flex-col.overflow-hidden
            ├── div.flex-shrink-0                                     ← HEADER (118px)
            │   ├── div[data-sidebar=group] .p-2.!pt-1.5.pl-2.5   (42px)
            │   │   └── logo <a>  +  close <button> (hover-only)
            │   ├── div.grid.grid-rows-[1fr]                       (36px, row-collapse anim)
            │   │   └── back/title row
            │   └── div.px-2.pb-2                                  (40px)
            │       └── form > input[data-sidebar-search]
            ├── div.relative.flex-1.min-h-0.overflow-hidden        ← BODY (single panel)
            │   └── div.absolute.inset-0.flex.flex-col
            │       └── div.h-full.px-2.overflow-y-auto            ← scroller
            │           └── div.pb-4 > N groups > div.flex.flex-col.gap-px
            └── div.relative.flex-shrink-0.px-2.pb-2               ← FOOTER (36px)
                ├── div.absolute.inset-x-2.bottom-2.z-20           ← promo card (overlays body)
                └── div.flex.items-center                           ← help + auth pill
```

Two ideas do most of the work and are cheap to port:

1. **The body is one `position:absolute; inset:0` panel** with
   `transition-[translate,opacity,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`.
   Switching Browse ⇄ Search swaps the panel's children and animates the wrapper — no layout jump,
   the scroll position and header stay put.
2. **The header is split into three independently animated rows.** The context row (logo/title)
   collapses with `grid grid-rows-[1fr] → grid-rows-[0fr]` + `opacity`, which animates correctly
   without measuring heights.

---

## 3. Header

### 3.1 Logo row — `p-2 !pt-1.5 pl-2.5`

* Logo `<a aria-label="21st home">` — `inline-flex h-7 max-w-full items-center rounded-lg px-2`,
  `hover:bg-foreground/10`, `active:scale-[0.97]`. Wordmark SVG at `h-4 w-auto`.
* **Close button** — `h-6 w-6 rounded-md hover:bg-foreground/10`, `aria-label="Close sidebar"`.
  Its wrapper is:

  ```html
  <div class="flex-shrink-0 transition-all duration-300 ease-in-out
              opacity-0 scale-95
              group-hover/sidebar:opacity-100 group-hover/sidebar:scale-100
              focus-within:opacity-100 focus-within:scale-100">
  ```

  i.e. **invisible until you hover the sidebar** (or tab into it). This is why the header looks
  empty in screenshots. Copy this — it removes a permanent chrome element from the resting state.

### 3.2 Back / title row

```html
<button class="an-focus-btn flex w-full items-center justify-between gap-1 rounded-md text-sm
               text-muted-foreground hover:bg-foreground/5 hover:text-foreground active:scale-[0.97]">
  <span class="grid size-8 flex-none place-content-center"><ChevronLeft class="h-4 w-4" /></span>
  <span class="flex-1 min-w-0 truncate text-center font-medium">Components</span>
  <span class="size-8 flex-none"></span>          <!-- symmetric spacer, keeps label optically centred -->
</button>
```

Symmetric `size-8` spacer is the trick for a centred label with a left icon in a full-width button.

In **search mode** this row becomes `Search` + a right-aligned `Clear` text action.

### 3.3 Search field

```html
<input data-sidebar-search type="text" placeholder="Search components"
       class="w-full h-8 rounded-md text-sm bg-muted border-0 pl-9 pr-12 text-foreground
              placeholder:text-muted-foreground/40 hover:bg-muted/80 outline-none
              ring-sidebar-ring focus-visible:ring-2 cursor-pointer" readonly />
<kbd class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
            text-xs font-medium uppercase tracking-wide text-muted-foreground/60">/</kbd>
```

Three deliberate behaviours:

| Gesture | Result |
|---|---|
| `readonly` on mount | field is focusable/clickable but rejects stray keystrokes — the `/` hint, not the field, is the "affordance" |
| `/` anywhere on the page | focuses the field **and drops `readonly`** → typing starts the query |
| typing | body panel swaps to the **filters panel**, header row becomes `Search` + `Clear`, URL becomes `?q=…`, results render in the main column |
| `Esc` / `Clear` | query cleared, `?q` removed, `readonly` restored, panel returns to Browse |

---

## 4. Browse panel (nav tree)

### 4.1 Scroller

`h-full px-2 overflow-y-auto` + tailwind-scrollbar utilities
(`scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent`); computed
`scrollbar-width: none` → effectively **no visible scrollbar**, list bleeds to the column edges.
Content wrapper is `pb-4` so the last row never kisses the footer.

#### 4.1.1 Scroll-edge fades

Re-checked against the live SSR DOM (2026-09-29, second pass) — two gradient scrims sit as siblings
of the scroller, inside the animating panel wrapper:

```html
<div class="absolute top-0 left-0 right-0 h-10 pointer-events-none
            bg-gradient-to-b from-tl-background via-tl-background/50 to-transparent
            transition-opacity duration-300 opacity-0"></div>
<div class="absolute bottom-0 left-0 right-0 h-12 pointer-events-none
            bg-gradient-to-t from-tl-background via-tl-background/50 to-transparent
            transition-opacity duration-300 opacity-0"></div>
```

Both render at `opacity-0` on first paint, so they are **scroll-driven**: the top fade appears once
the list has left its first row, the bottom fade disappears at the end of the list. The gradient is
the sidebar surface fading to transparent — never a gray — which is what lets the list bleed to the
column edges under the header and the pinned promo card without looking clipped. Because they live
inside the panel wrapper, they cross-fade with the panel swap.

### 4.2 Section header

```html
<div class="flex items-center h-7 px-2 pt-2.5 pb-0.5">
  <h3 class="text-xs font-medium text-muted-foreground whitespace-nowrap">Marketing Blocks</h3>
</div>
```

28 px row, 12 px / 500 muted label, **not sticky** — it scrolls away with the list. Vertical rhythm
between sections is carried entirely by `pt-2.5`; there are no dividers anywhere in the sidebar.

### 4.3 Nav row

```html
<a class="an-focus-btn flex items-center w-full h-8 pl-0.5 pr-2 rounded-md text-sm
          active:scale-[0.97] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
   href="/community/components/s/background">
  <span class="grid size-8 flex-none place-content-center"><Icon class="h-4 w-4" /></span>
  <span class="flex-1 truncate">Backgrounds</span>
  <span class="text-muted-foreground/60 text-xs tabular-nums">365</span>
</a>
```

| Property | Value |
|---|---|
| Row height | **32 px** (`h-8`), width = column − 16 px padding |
| Radius | `rounded-md` = 6 px (`--radius: .5rem` family) |
| Gap between rows | **1 px** (`gap-px` on the list) — a hairline separation, not a gap |
| Icon slot | `size-8` grid, icon `16×16`, so the label always starts 32 px in |
| Label | 14 px, `truncate`, flex-1 |
| Count | 12 px `tabular-nums`, `text-muted-foreground/60` — **plain text, not a pill** |
| Idle | `text-muted-foreground` (#8f8f99) |
| Hover | `hover:bg-foreground/5` + `hover:text-foreground` (5 % of *current* foreground — tint-agnostic, works in both themes) |
| Press | `active:scale-[0.97]` on every interactive row (0.97 is the site-wide press transform) |

**Trailing chevron affordance** (rows that lead somewhere hierarchical, e.g. *Newest*, *Libraries*):

```html
<span class="grid size-6 place-content-center rounded-sm transition-colors
             group-hover:bg-foreground/10 group-active:bg-foreground/15">
  <ChevronRight class="h-3 w-3" />
</span>
```

It is always rendered and only its *background* responds to hover — a quiet "this goes deeper" cue.

**Status badge** (`New`) instead of a count:

```html
<span class="inline-flex h-5 shrink-0 items-center rounded-full bg-blue-500/15 px-1.5
             text-[11px] font-medium leading-none text-blue-700 dark:text-blue-300">New</span>
```

**Active row** (not visible in the category index, but consistent with the system): the app never
uses a left indicator bar in the sidebar — selection is `bg-foreground/5…/10` + `text-foreground`
+ (in the filter panel) an explicit radio glyph. See [§6](#6-filter-panel).

---

## 5. Footer

```
div.relative.flex-shrink-0.px-2.pb-2.bg-tl-background       (36 px, opaque → body scrolls under it)
├── div.absolute.inset-x-2.bottom-2.z-20.hidden.md:block   ← promo card, floats over the body
└── div.flex.items-center
    ├── button.an-focus-btn.h-7.w-7.rounded-md             (help, `aria-label="Help"`)
    ├── div.flex-1                                         (spacer)
    └── div.duration-500.ease-out.translate-y-1.opacity-0  (auth pill, animates in on state)
```

* The promo card is **not in flow** — it is absolutely pinned 8 px above the footer, with `z-20`,
  so nav rows scroll *underneath* it. Dismissing it ("—" button, `aria-label="Dismiss … announcement"`)
  unmounts it and the tree shows through. Card chrome:

  ```html
  <div class="rounded-lg border border-border/70 bg-card p-3 text-[0.8125rem]
              shadow-[0_1px_4px_-2px_rgba(0,0,0,0.12)] flex select-none flex-col gap-3">
  ```
  header row `flex items-start justify-between gap-2` · body `leading-5 text-muted-foreground`
  (13 px) · primary CTA `h-7 rounded-md bg-primary text-sm text-white` · secondary
  `text-xs text-muted-foreground` link row.

* The auth pill arrives with `duration-500 ease-out translate-y-1 opacity-0 → translate-y-0 opacity-100`
  — a bottom-up slide, not a fade.

**Porting note:** if you keep this pattern, remember the card must have an opaque background and the
scroll container must be a *separate* scrolling element from the footer — that is what makes the
"floating over the list" read as intentional rather than clipped.

---

## 6. Filter panel

Reachable by clicking the search field (`/`) *or* the separate `Filters` button in the content
top bar. It replaces the nav tree in the same 240 px column:

* **Scope chips** — `Components` (icon + label, selected) then icon-only chips for the other scopes,
  in a `px-1` row.
* **Radio groups** ("Category", "Sort") using **animated disclosure regions**:

  ```html
  <button aria-expanded="true" aria-controls="…-region"
          class="group/filter-header flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2
                 text-left hover:bg-muted/70 active:bg-muted active:scale-[0.97]
                 focus-visible:outline-2 focus-visible:outline-ring/60 focus-visible:-outline-offset-1">
    <ChevronDown class="h-4 w-4" /><div class="truncate text-sm/5 font-medium text-foreground/90">Category</div>
  </button>
  <div id="…-region" role="region" aria-labelledby="…-button" aria-hidden="false"
       style="height:auto; overflow:visible; transition: height .2s cubic-bezier(0.4,0,0.2,1)">
    …
  </div>
  ```

  Height is animated `auto ⇄ 0` (measured, not `max-height` hacks). This is the disclosure primitive
  to copy for every collapsible group in our sidebar.

* **Radio row** (`h-7`, 28 px — one step tighter than nav rows):

  ```html
  <label class="flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2
                text-foreground/75 hover:bg-muted/60 hover:text-foreground
                has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/60
                active:bg-muted active:scale-[0.97]">   <!-- selected adds: bg-muted/70 text-foreground -->
    <input class="sr-only" type="radio" name="component-category" />
    <span aria-hidden="true" class="flex size-4 items-center justify-center rounded-full
                                    border border-muted-foreground/40">   <!-- selected: border-foreground -->
      <span class="size-2 rounded-full bg-foreground"></span>             <!-- selected only -->
    </span>
    <p class="min-w-0 flex-1 truncate text-left text-[0.8125rem]/5">All</p>
  </label>
  ```

  Selection = `bg-muted/70` + `text-foreground` + filled 8 px inner dot. Unselected = `text-foreground/75`
  + hollow 16 px ring. The radio input itself is `sr-only` and focus is proxied with `has-[:focus-visible]`.

---

## 7. Collapse / open/close behaviour

| State | Wrapper inline style | Body | Top bar |
|---|---|---|---|
| **Open** (default, `localStorage["community-sidebar-width"] = 240`) | `width:240px; opacity:1; max-width:calc(100% - 350px)` | 746 px scroller | `Close sidebar` trigger, toggle container 24 px |
| **Closed** (click trigger, or close button) | `width:0px; opacity:0` (border stays 0.5 px) | 0 px, clipped | trigger flips to `Open sidebar` |
| **Revealed** (mouse enters 16 px left strip while closed) | returns to `width:240px; opacity:1` | restores | — |

* **There is no icon rail.** Unlike shadcn's `collapsible="icon"`, 21st fully retracts the column
  (`width:0; opacity:0`) and hands the reopened surface to the left-edge hover zone. The
  `group-data-[collapsible=icon]` classes in the DOM are inherited shadcn leftovers, unused here.
* **Toggle placement**: `div.absolute.top-0.left-0.right-0.h-10.z-10` (the content top bar,
  `px-2.5`), wrapping the trigger in
  `div.overflow-hidden.transition-[width].duration-500.ease-[cubic-bezier(0.25,0.1,0.25,1)]`
  and `div.animate-in.fade-in-0.duration-500` — so the *title cluster slides* as the column opens
  instead of jumping. Trigger button: `h-6 w-6 rounded-md`, `hover:bg-foreground/10`,
  `transition-[background-color,transform] duration-150`, `aria-label` flipping between
  `Open sidebar` / `Close sidebar`.
* **Edge reveal zone**: `fixed left-0 top-0 w-4 h-full z-50`, transparent, `pointer-events:auto`.
* **Resize**: two absolutely positioned full-height `cursor-col-resize` strips — an invisible 8 px
  hit area plus a 4 px visible grip (`z-10`, `margin-right:-2px`). Width persists per-key in
  `localStorage` and is clamped on the right by `max-width: calc(100% - 350px)` (never eat the
  content column) with `min-width: 0`.
* Transition on the wrapper is `transition: all` driven by inline width — in a rebuild, prefer an
  explicit `transition: width 200ms cubic-bezier(.4,0,.2,1), opacity 200ms` to avoid animating
  `max-width`/`border` accidentally.

---

## 8. Responsive

**Breakpoint: 768 px.**

* Sidebar wrapper: `max-md:!w-0 max-md:!opacity-0 max-md:!min-w-0 max-md:!border-0` → fully gone.
* App shell adds bottom space: `max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]`.
* Mobile tab bar (fixed, `z-40`):

  ```html
  <div class="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur
              supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
    <!-- Home · Search · Bookmarks · Profile, ~56px tall -->
  </div>
  ```
* Top bar keeps the hamburger (its container clamps to `w-9` on mobile) and the title.
* A horizontal chip scroller (`Filters · Heroes · AI chats · Buttons …`) sits under the top bar for
  fast category hops — it replaces the tree for one-thumb use.

---

## 9. Motion & interaction table

| Element | Property | Timing |
|---|---|---|
| Row hover | background/color | `transition-colors` default (150 ms) |
| Row press | `scale(0.97)` | instant, site-wide |
| Sidebar open/close | `width`, `opacity` | ~200 ms `cubic-bezier(0.4,0,0.2,1)` |
| Top-bar toggle container | `width` | 500 ms `cubic-bezier(0.25,0.1,0.25,1)` + `fade-in-0` 500 ms |
| Body panel swap | `translate`, `opacity`, `filter` (blur) | 200 ms `cubic-bezier(0.4,0,0.2,1)` |
| Header context row collapse | `grid-template-rows`, `opacity` | 200 ms same easing |
| Filter disclosure | `height: auto ⇄ 0` | 200 ms same easing |
| Close button reveal | `opacity`, `scale` | 300 ms `ease-in-out` |
| Auth pill | `translate-y`, `opacity` | 500 ms `ease-out` |
| Promo dismiss | unmount | — |

Every one of these carries `motion-reduce:transition-none` where the animation is decorative.

---

## 10. Design tokens

Straight from `:root` / `html.dark` (oklch as authored, hex = sRGB conversion):

| Token | Dark | ≈ hex | Light |
|---|---|---|---|
| `--background` / `--card` | `oklch(0.141 0.004 285.824)` | `#09090b` | `#ffffff` |
| `--tl-background` (sidebar + top bar chrome) | `oklch(0.173 0 0)` | `#101010` | `oklch(0.967 0 0)` `#f4f4f4` |
| `--sidebar-background` / `--muted` / `--accent` | `oklch(0.21 0.006 285.883)` | `#18181b` | `oklch(0.985 0 0)` |
| `--border` / `--sidebar-border` / `--sidebar-accent` | `oklch(0.274 0.005 286.033)` | `#27272a` | `oklch(0.92 0.004 286.32)` `#e4e4e7` |
| `--foreground` / `--sidebar-foreground` | `oklch(0.968 0.001 286.375)` | `#f4f4f5` | `oklch(0.141 0.004 285.824)` `#09090b` |
| `--muted-foreground` (nav idle text) | `oklch(0.654 0.014 286.01)` | `#8f8f99` | `oklch(0.552 0.014 285.942)` `#71717a` |
| `--popover` | `oklch(0.204 0 0)` | `#171717` | `#ffffff` |
| `--primary` (CTA) | `oklch(0.485 0.291 264.121)` | vivid indigo, sRGB-clipped | same hue, lighter |
| `--ring` | `oklch(0.485 0.291 264.121)` | | |
| `--radius` | `.5rem` (8 px); rows use `rounded-md` 6 px | | |

* Font stack: `"General Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
* Sidebar sits on `--tl-background` (`#101010`), the content column on `--background` (`#09090b`) —
  the sidebar is **slightly lighter** than the canvas, separated by a **0.5 px** right border
  (`border-right-width: 0.5px`, not 1 px — a nice hairline cue at 1× DPR).
* Hover surfaces are `bg-foreground/5` / `hover:bg-muted/70`, never fixed gray hexes → theme-agnostic.
* Frames are `oklch(… / 0.15)` / `color-mix(in oklab, …, transparent)`, i.e. alpha over the surface.

---

## 11. Accessibility notes worth copying

* `aria-label` on every icon-only control (`Close sidebar`, `Open sidebar`, `Help`,
  `Dismiss … announcement`, `Save to bookmarks`); labels flip with state.
* Disclosure pattern is done properly: `aria-expanded` + `aria-controls` on the trigger,
  `role="region"` + `aria-labelledby` + `aria-hidden` on the panel.
* Filter radios are real `<input type="radio" class="sr-only">` with a fully custom glyph, and
  keyboard focus is routed to the visible row via `has-[:focus-visible]` on the label.
* Focus ring: `outline: 2px` in `--ring` at 60 % with `-outline-offset-1` (inside the row) so rings
  never overlap neighbours in a dense list.
* Rows are 32 px tall — below the 44 px touch target, so on mobile the tree is replaced by the
  tab bar + chips rather than being made tappable.
* `sr-only` labels for the search field and the announcement dismiss.

---

## 12. Reimplementation plan for HOLY GRAIL

> **Status: shipped** — see [§13](#13-implementation-status) for what landed where.

Current state (before the rewrite): [`Sidebar.vue`](../web/src/components/Sidebar.vue) +
[`components/sidebar/`](../web/src/components/sidebar/) (Header, Rail, Footer,
ExpandedGroup, `useSidebarSearch`, `sidebarNav`). It already has the right *information
architecture* (AI/Design/Development/Watch/Downloads, Extensions, MCP, Skills, counts, collapsible
groups, `/`-less inline search) but the *chrome* is ad-hoc: `border-gray-800`, `bg-[#1f1f1f]`,
`text-gray-400`, `text-[10px]` counts, `uppercase tracking-wider` section titles, an always-present
search border, and a separate collapsed **icon rail** that 21st does not have.

Ordered, low-risk swaps:

1. **Token layer first.** Introduce the sidebar palette as CSS variables
   (`--sidebar-bg: #18181b`, `--sidebar-border: #27272a`, `--sidebar-fg: #f4f4f5`,
   `--sidebar-muted: #8f8f99`, `--sidebar-hover: color-mix(in oklab, var(--sidebar-fg) 5%, transparent)`)
   and delete the hard-coded grays. Sidebar on a slightly lighter surface than the page, hairline
   border (0.5 px reads better than 1 px at 1× DPR).
2. **Row geometry.** 32 px rows, 16 px icons inside a 32 px slot, 14 px labels, 12 px
   `tabular-nums` counts as plain muted text (drop the `[10px]` + padding chip), `gap-px` between
   rows, `rounded-md`, `active:scale-[0.97]`, hover `bg-foreground/5 + text-foreground`.
3. **Section labels.** 12 px / 500, `text-muted-foreground`, no uppercase, no dividers, 10 px top
   rhythm — matches "Marketing Blocks" / "UI Components".
4. **Search field.** Restyle to `h-8 rounded-md bg-muted`, `/` kbd hint on the right, `readonly`
   until focused, global `/` shortcut, `Esc` clears. Keep `useSidebarSearch` as-is — only the
   presentation changes.
5. **Disclosure animation.** Replace `Transition name="sidebar-group"` with the measured
   `height:auto ⇄ 0` + `cubic-bezier(0.4,0,0.2,1)` 200 ms region pattern (with
   `aria-expanded/aria-controls/role=region`).
6. **Footer.** Adopt the 36 px opaque footer strip, an icon-button row, and (optionally) the
   absolutely-pinned dismissible promo card that floats over the scroll area — good slot for a
   "Submit a site" / MCP announcement CTA. Auth pill slides up 8 px on `ease-out` 500 ms.
7. **Collapse model — decide.** Two credible options:
   * *21st-faithful:* drop the rail, retract the column to `width:0; opacity:0`, add the
     `fixed left-0 w-4 h-full z-50` hover-reveal zone, the animated top-bar trigger, and a
     `localStorage`-persisted width (with a drag handle) clamped by `max-width: calc(100% - 360px)`.
   * *Keep the rail* (better for a catalog with 30+ destinations where the rail is a real shortcut),
     but then port the rest.
8. **Resize handle** (optional but cheap): 4 px visible grip + 8 px hit area, `col-resize`, persist
   in `localStorage` under a namespaced key.
9. **Mobile**: below 768 px hide the column, add the safe-area bottom tab bar and a horizontal
   category chip scroller. We already own routing for the top-level sections, so the tab bar maps
   to Sites / Extensions / MCP / Skills.
10. **Dual-mode body panel** (the biggest structural win): make the nav tree and a filter/search
    panel two children of one `absolute inset-0` wrapper with the 200 ms
    `translate/opacity/blur` transition, so search feels like a mode of the sidebar rather than a
    mutated list. This also kills the current "auto-expand every group while searching" jank.

Acceptance checklist when done: resting state shows no close button; `/` focuses search; `Esc`
restores the tree; every row is 32 px with a 16 px icon; counts are muted 12 px `tabular-nums`;
collapsing a group animates height without clipping; the footer stays opaque while the list scrolls
under it; keyboard rings are inside the row; nothing animates when `prefers-reduced-motion` is set.

---

## 13. Implementation status

Steps 1–10 all landed, with the 21st-faithful collapse model (step 7a: the icon rail is gone) and
the full mobile treatment (step 9).

| Step | Where it lives now |
|---|---|
| 1 · Token layer | [`main.css`](../web/src/assets/main.css) — `--color-sidebar*` in `@theme`, inverted for `html.light` (mocha) |
| 2 · Row geometry | [`SidebarNavRow.vue`](../web/src/components/sidebar/SidebarNavRow.vue) — the one row primitive (32 px, `size-8` slot, 12 px `tabular-nums` count, `active:scale-[0.97]`) |
| 3 · Section labels | [`SidebarBrowsePanel.vue`](../web/src/components/sidebar/SidebarBrowsePanel.vue) — 12 px/500 muted, no uppercase, no dividers |
| 4 · Search field | [`SidebarHeader.vue`](../web/src/components/sidebar/SidebarHeader.vue) — `/` kbd hint, `readonly` until focused, global `/` + `Esc` wired in [`Sidebar.vue`](../web/src/components/Sidebar.vue) |
| 5 · Disclosure animation | [`SidebarDisclosure.vue`](../web/src/components/sidebar/SidebarDisclosure.vue) — measured `height: px ⇄ 0` → `auto`, `cubic-bezier(0.4,0,0.2,1)` 200 ms, closed content `inert` |
| 6 · Footer | [`SidebarFooter.vue`](../web/src/components/sidebar/SidebarFooter.vue) + [`SidebarPromoCard.vue`](../web/src/components/sidebar/SidebarPromoCard.vue) — 36 px opaque strip, promo card pinned `z-20` **above** the row (never over it), its measured height published as `--sidebar-promo-height` so both scroll panels reserve exactly that much room, auth pill slides up 500 ms |
| 7 · Collapse model | [`App.vue`](../web/src/App.vue) — retracts to `width:0; opacity:0`, 16 px left-edge hover zone, width persisted, `NodeList` inert while closed |
| 8 · Resize | same file — 8 px hit area + 4 px grip, clamped to `100% − 360 px`, `localStorage["holy-grail-sidebar-width"]`, double-click resets to 240 |
| 9 · Mobile | [`MobileTabBar.vue`](../web/src/components/mobile/MobileTabBar.vue), [`MobileCategoryChips.vue`](../web/src/components/mobile/MobileCategoryChips.vue), plus the Navbar trigger in [`Navbar.vue`](../web/src/components/Navbar.vue) |
| 10 · Dual-mode body | [`SidebarBrowsePanel.vue`](../web/src/components/sidebar/SidebarBrowsePanel.vue) ⇄ [`SidebarSearchPanel.vue`](../web/src/components/sidebar/SidebarSearchPanel.vue) as two children of one `absolute inset-0` wrapper |

### Second pass against the live site (2026-09-29)

The reference was re-read from the served DOM rather than from the original capture. Everything in
the table above held; three things did not, and are now fixed:

| Gap | Fix |
|---|---|
| **Scroll-edge fades were missing entirely** (they are not in the first capture — they render at `opacity-0`, so a static snapshot never shows them) | [`SidebarScrollFades.vue`](../web/src/components/sidebar/SidebarScrollFades.vue) — `h-10` top / `h-12` bottom scrims, `transition-opacity duration-300`, driven by `scrollTop` plus a `ResizeObserver` so the bottom fade clears when counts stream in. Mounted in **both** panels, since the reference puts them inside the shared panel wrapper. Gradient is `color-mix` against `--color-sidebar`, not a fixed gray. |
| **Mobile tab bar** was `text-[11px] gap-1` with no press transform | Now `text-[10px] leading-none`, `gap-0.5 py-1.5`, `transition-[scale] duration-100 active:scale-[0.97]`, icon and label coloured independently, `h-14` on the row rather than each cell |
| **Search field glyph** was a 14px icon at 70% opacity | Reference uses a 16px icon at 40% (`h-4 w-4 text-muted-foreground/40`) |

Also confirmed unchanged: no `role="tree"` / `aria-activedescendant` keyboard tree model, no
`/`-independent search shortcut beyond the global `/`, the always-mounted left-edge reveal strip
(the reference leaves it in the DOM at `z-50` even when the column is open — ours renders it
conditionally so it cannot intercept the leftmost 16px of an open column), and the promo slot
deferred until hydration (`deferSidebarNewsUntilHydrated`) which ours does not need.

Supporting model: [`sidebarNav.ts`](../web/src/components/sidebar/sidebarNav.ts) now owns `sidebarSections`,
`sidebarSearchEntries`, `getSidebarContextLabel`, `getSidebarSectionForPath` and `getSectionChips`;
[`useSidebarCounts.ts`](../web/src/components/sidebar/useSidebarCounts.ts) owns every catalog size;
[`useSidebarSearch.ts`](../web/src/components/sidebar/useSidebarSearch.ts) owns query, scope, sort and the
ranked/grouped results. `SidebarRail.vue` and `SidebarExpandedGroup.vue` were deleted.

### Deliberate deviations from the reference

* **Query persists across navigation.** 21st keeps `?q=` in the URL; we keep the query in the panel
  so multi-hop browsing does not force a retype. `Esc` or `Clear` returns to Browse.
* **Clicking the field also drops `readonly`.** 21st's field is a `/`-only affordance; a visible
  field that rejects a click-to-type reads as broken, so focus (click *or* `/`) unlocks it.
* **Results are grouped by their parent**, not shown in the main column — the sidebar's search
  filters sidebar destinations, so the tree swapped to a grouped result list instead.
* **Skip-a-header `More` section**: Home / Publish / Admin / Help stay in the footer strip as icon
  buttons, and the promo card carries the submit CTA.
* **Scope chips + Sort disclosure** replace the reference's Category/Sort radio groups, which had no
  meaningful analogue for a nav filter.
* **The promo card reserves its own room and floats above the footer row.** 21st pins the card with
  `bottom-2` inside the footer, which puts it on top of the Help / auth row, and lets the tail of the
  list disappear underneath it. We pin it above the strip (`bottom-full mb-2`) and publish its
  measured height as `--sidebar-promo-height` on that sidebar's root element
  (`SidebarFooter.vue` writes it, both panel scrollers add it to their bottom padding), so the tree's
  last rows stay scrollable into view and the footer controls stay clickable.
* **No `New` status badge.** The nav model has no "newly added" flag to drive one, so rows are
  count-or-nothing rather than inventing a badge with no data behind it.

### Verification

`vue-tsc --noEmit`, `oxlint`, `eslint` and `vite build` all pass. Behaviour was exercised against a
live dev server at 1440×900 and 390×844: retract → `width:0`, `opacity:0`, `inert`, edge-strip
reveal back to 240; drag to 320 with `localStorage` write, double-click reset to 240; group close
animating `399px → 0 → 0px/hidden` with `aria-hidden`/`inert`, reopen to `height:auto`; search mode
swapping panels with the browse tree `aria-hidden`; `/` focusing the field; Clear restoring the
context title; scroll-to-top returning `400 → 0`; promo dismissal unmounting and persisting; light
mode reading `#f5eee6`/`#ddcbbb`/`#7e6b5e`; mobile hiding the column, showing a 57 px tab bar and the
per-section chip strip, with the shell padded by the safe-area tab bar height.

Second pass (same day, after the shell rewrite) re-verified the same states and fixed one real defect:
the promo card's `bottom-2` made it cover the footer row outright, so Help / Publish / Sign in were
invisible and unclickable (card `892–714`, row `856–892`). It is now pinned above the strip
(card `646–848`) with the scroll panels reserving `--sidebar-promo-height`; at the end of the browse
list the last row (`Design 0`, bottom 630) clears the card, and the resolved padding is
`card 202 px + 24 px`. Re-confirmed in the same session: `/` focuses the field and drops `readonly`;
`Esc` clears the query, restores `readonly` and returns the title row to `Browse`; a group collapse
animates to `0px` (inner node `inert`) and reopens to `height:auto` (234 px measured); retracting gives
`width:0; opacity:0; inert` plus the 16 px edge strip, which reveals back to 240 px; dragging the grip
moves `240 → 320` and persists it, double-click resets to 240; the mobile tab bar is 57 px with
hit-testable tabs above 56 px of content padding and 5 section chips; the drawer renders its own
`Sidebar` with the promo card suppressed and the promo variable scoped to itself. `prettier --check`
now passes on every file this feature owns — the `sidebar/`, `mobile/`, `Sidebar.vue` and `App.vue`
set had drifted and was formatted in this pass, so `format:check` in CI stays green.
