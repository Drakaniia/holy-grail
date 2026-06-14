# Adding Extensions

Extensions (Chrome extensions) are stored as `meta.yaml` files under
`src/content/extensions/`. The generated `src/content/extensions-index.json` is
imported directly by the Pinia extensions store, so metadata must be complete
before committing content changes.

The same JSON is also written to `public/content/extensions-index.json` so the
app can fetch it at runtime.

## Directory Structure

```txt
src/content/extensions/
+-- writing/
|   +-- scribbr-citation-generator/
|       +-- meta.yaml
+-- productivity/
+-- developer-tools/
+-- privacy/
+-- research/
+-- design/
+-- automation/
```

The first-level directory (`writing`, `productivity`, etc.) becomes the
`parentCategory` and determines the route. If you need a distinct subcategory,
add a second-level directory:

```txt
src/content/extensions/
+-- writing/
    +-- citation/
        +-- your-extension/
            +-- meta.yaml
```

Without a second-level directory, `subcategory` is set to the same value as
`parentCategory`.

## Routes

- `/extensions` — redirects to `/extensions/writing`
- `/extensions/:category/:subcategory?` — category listing page
- `/extensions/:slug` — extension detail page

Supported top-level categories (from the router): `writing`, `productivity`,
`developer-tools`, `privacy`, `research`, `design`, `automation`.

## Manual Add Flow

1. Create a directory under the appropriate parent category using the extension
   slug.
2. Add `meta.yaml` using the schema below.
3. Include `coreFeatures`, `additionalFeatures`, and `similarTools` so the
   detail page is complete.
4. Run `bun run generate:extensions` to regenerate the index.
5. Run `bun run type-check`, `bun lint`, and `bun run build` before finishing.

## `meta.yaml` Schema

### Common Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `slug` | string | Yes | URL-friendly id. |
| `name` | string | Yes | Display name. |
| `description` | string | Yes | Short card description. |
| `category` | string | Yes | Display category, e.g. `Chrome Extensions`. |
| `parentCategory` | string | Yes | Top-level route/category. Must match one of the supported categories. |
| `subcategory` | string/null | Yes | Nested route category or `null`. Defaults to `parentCategory` value when omitted. |
| `version` | string | Yes | Extension version from Chrome Web Store. |
| `addedDaysAgo` | number | Yes | Days since this entry was added. New entries use `0`. |
| `license` | string | Yes | Usually `Proprietary` for Chrome Web Store extensions. |
| `website` | string | Yes | Chrome Web Store URL or primary landing page. |
| `docs` | string | Yes | Documentation URL. Use `website` when no separate docs page exists. |
| `sourceCode` | string | Yes | Public repo URL when available, otherwise empty string. |
| `verified` | boolean | No | Shows the verified badge. |
| `featured` | boolean | No | Pins entry on the home page featured section. |
| `tags` | string[] | No | Search/filter tags. Include `chrome-extension` as a tag. |
| `atGlance` | string | No | One-line detail page summary. |
| `fullDescription` | string | No | Longer detail page description. |
| `coreFeatures` | array | No | Rendered in the Core Features section. |
| `additionalFeatures` | array | No | Rendered in the Additional Features section. |
| `similarTools` | array | No | Rendered in the Similar Tools section. |

### Extension-Specific Fields

Unlike sites, extensions have a dedicated `extensionSpecific` key that holds
Chrome Web Store metadata:

```yaml
extensionSpecific:
  chromeWebStoreId: <string>   # Required — the unique Chrome Web Store extension ID
  chromeWebStoreRating: <number>  # Required — rating out of 5 (e.g. 4.7)
  userCount: <number>          # Required — number of users (e.g. 500000)
  permissions:                 # Required — list of Chrome API permissions
    - <string>
  manifestVersion: <number>    # Required — typically 3
  installButtonBehavior: <string>  # Optional — defaults to "redirect-to-chrome-web-store"
```

## Feature Objects

```yaml
coreFeatures:
  - name: Multi-Style Citations
    description: Generates accurate citations in APA, MLA, Chicago, and other styles.
    icon: check
additionalFeatures:
  - name: Chrome Web Store Installation
    description: Installed directly from the Chrome Web Store as a browser extension.
    icon: check
```

`icon` is currently a legacy metadata field. The UI renders a standard icon for
these feature cards.

## Similar Tools

```yaml
similarTools:
  - slug: my-other-extension
    name: My Other Extension
    description: Another extension in the same category.
    stars: 0
    addedDaysAgo: 0
    verified: true
    website: https://chromewebstore.google.com/detail/...
```

Use tools from the same parent category when possible.

## Installation & Deployment

The detail page always shows install actions for the extension. Currently the
only supported install behavior is `redirect-to-chrome-web-store`, which opens
the Chrome Web Store listing.

## Example

```yaml
slug: scribbr-citation-generator
name: Scribbr Citation Generator
description: Instantly get accurate citations for any webpage in APA, MLA, Chicago, Harvard and any other style.
category: Chrome Extensions
parentCategory: writing
subcategory: writing
version: "43.22"
addedDaysAgo: 0
license: Proprietary
website: https://chromewebstore.google.com/detail/scribbr-citation-generato/epbobagokhieoonfplomdklollconnkl
docs: https://chromewebstore.google.com/detail/scribbr-citation-generato/epbobagokhieoonfplomdklollconnkl
sourceCode: ""
verified: true
featured: false
tags:
  - chrome-extension
  - citation
  - writing
  - education
atGlance: Generate accurate citations for webpages directly from Chrome.
fullDescription: Scribbr Citation Generator is a Chrome extension for students, teachers, and researchers that creates reference list entries and in-text citations for online sources.
coreFeatures:
  - name: Multi-Style Citations
    description: Generates accurate citations for webpages in APA, MLA, Chicago, Harvard, and other styles.
    icon: check
  - name: In-Page Research Workflow
    description: Creates reference list entries and in-text citations while browsing online sources.
    icon: check
additionalFeatures:
  - name: Chrome Web Store Installation
    description: Installed directly from the Chrome Web Store as a browser extension.
    icon: check
similarTools: []
extensionSpecific:
  chromeWebStoreId: epbobagokhieoonfplomdklollconnkl
  chromeWebStoreRating: 4.7
  userCount: 500000
  permissions:
    - activeTab
    - scripting
    - storage
  manifestVersion: 3
  installButtonBehavior: redirect-to-chrome-web-store
```

## Sorting

Extensions are sorted by:

1. `featured: true`
2. `chromeWebStoreRating` descending

## Regeneration

`bun dev` and `bun run build` regenerate the index automatically. To regenerate
manually:

```bash
bun run generate:extensions
```

Output:

- `src/content/extensions-index.json` — imported by the Pinia store
- `public/content/extensions-index.json` — fetched at runtime by the app
