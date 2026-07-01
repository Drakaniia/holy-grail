# Extension meta.yaml Schema Reference

Each Chrome extension in the Holy Grail catalog is defined by a `meta.yaml` file at:
```
src/content/extensions/{parentCategory}/{slug}/meta.yaml
```

This file is read by `scripts/build/generate-extensions-index.js` to produce `src/content/extensions-index.json`.

## Field Reference

### Identity Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | **Yes** | URL-friendly identifier. Must match the directory name. Lowercase with hyphens. Example: `video-downloader-professional` |
| `name` | string | **Yes** | Display name shown in cards and headers. Example: `Eye Dropper` |
| `description` | string | **Yes** | Short card description, 80-120 characters. Example: `Pick colors from any website with a precise eyedropper tool.` |
| `category` | string | **Yes** | Display category label. Always `Chrome Extensions` for Chrome extensions. |

### Categorization Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parentCategory` | string | **Yes** | Top-level folder name under `src/content/extensions/`. Must match an actual directory. Supported values: `design`, `developer-tools`, `privacy`, `productivity`, `writing` |
| `subcategory` | string or null | **Yes** | Nested route category. Defaults to `parentCategory` value when using a flat directory structure. Example: `design`, `productivity` |
| `tags` | string[] | No | Search/filter tags. Always include `chrome-extension` plus relevant keywords. Example: `[chrome-extension, color-picker, design, eyedropper]` |

### Version & Stats Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `version` | string | **Yes** | — | Current version from Chrome Web Store. Example: `4.10.3.15` |
| `addedDaysAgo` | number | **Yes** | `0` | Days since the extension was added to the catalog. |
| `license` | string | **Yes** | `Proprietary` | License. Most Chrome Web Store extensions are `Proprietary`. Use `GPL-3.0`, `MIT`, etc. for open source extensions. |
| `stars` | number | No | `0` | GitHub stars (rarely applicable for CWS extensions). Include `0`. |
| `watchers` | number | No | `0` | GitHub watchers. Include `0`. |
| `lastCommit` | string | No | `N/A` | Repo-backed date. `N/A` for CWS extensions. |
| `lastRelease` | string | No | `N/A` | Repo-backed date. `N/A` for CWS extensions. |
| `contributors` | number | No | `0` | GitHub contributors. Include `0`. |
| `commitsThisYear` | number | No | `0` | GitHub commits. Include `0`. |
| `releases` | number | No | `0` | GitHub releases. Include `0`. |

### Platform & Link Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platforms` | string[] | **Yes** | Supported platforms. Always include `Chrome Extension`. Example: `[Chrome Extension]` |
| `deployment` | string[] | **Yes** | Distribution method. Always include `Chrome Web Store`. Example: `[Chrome Web Store]` |
| `website` | string | **Yes** | Chrome Web Store URL. Format: `https://chromewebstore.google.com/detail/.../STORE_ID` |
| `docs` | string | **Yes** | Documentation URL. Use `website` when no separate docs page exists. |
| `sourceCode` | string | **Yes** | Public repo URL when available, otherwise empty string. |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `website` | string | **Yes** | Chrome Web Store URL. Format: `https://chromewebstore.google.com/detail/.../STORE_ID` |
| `docs` | string | **Yes** | Documentation URL. Use `website` when no separate docs page exists. |
| `sourceCode` | string | **Yes** | Public repo URL when available, otherwise empty string. |

### Display Flags

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `icon` | string | No | — | Internal icon key. Usually matches the slug. |
| `verified` | boolean | No | `true` | Chrome Web Store extensions are typically `verified: true` since they pass store review. |
| `featured` | boolean | No | `false` | Pins entry on the home page featured section. |

### Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `atGlance` | string | No | One-line summary for the detail page header. 50-80 chars. Example: `Pick colors from any website with a precise eyedropper tool.` |
| `fullDescription` | string | No | 2-4 sentence description for the detail page body. Should explain what the extension does and its key workflow. |

### Feature Section Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `coreFeatures` | object[] | No | 3 key features rendered in the Core Features section. Each has `name`, `description`, `icon`. |
| `additionalFeatures` | object[] | No | 2-3 supplementary features. Same structure as `coreFeatures`. |
| `similarTools` | object[] | No | Related extensions from the catalog. Can be an empty list `[]`. |

## Extension-Specific Fields (extensionSpecific)

Unlike sites, extensions have a dedicated `extensionSpecific` section that holds Chrome Web Store metadata. This is **required** for all extension entries.

```yaml
extensionSpecific:
  chromeWebStoreId: hmdcmlfkchdmnmnmheododdhjedfccka
  chromeWebStoreRating: 4.6
  userCount: 1000000
  permissions:
    - activeTab
    - scripting
    - storage
  manifestVersion: 3
  installButtonBehavior: redirect-to-chrome-web-store
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chromeWebStoreId` | string | **Yes** | The unique extension ID from the Chrome Web Store URL. Extracted from: `https://chromewebstore.google.com/detail/.../THIS_PART` |
| `chromeWebStoreRating` | number | **Yes** | Star rating out of 5 (e.g., `4.6`, `4.7`). Obtained from the Chrome Web Store listing. |
| `userCount` | number | **Yes** | Number of users. Examples: `1000000` (1 million), `500000` (500k), `40000000` (40 million). |
| `permissions` | string[] | **Yes** | List of Chrome API permissions the extension requests. Common values: `activeTab`, `scripting`, `storage`, `tabs`, `webRequest`, `webRequestBlocking`, `browsingData`, `notifications`, `unlimitedStorage` |
| `manifestVersion` | number | **Yes** | Chrome extension manifest version. Almost always `3` for modern extensions. Legacy extensions may use `2`. |
| `installButtonBehavior` | string | No | How the install button behaves. Currently only supported value: `redirect-to-chrome-web-store`. |

## Feature Object Format

```yaml
coreFeatures:
  - name: Precision Eyedropper
    description: Pick any color on screen with pixel-level precision.
    icon: check
  - name: Color Format Support
    description: View and copy colors in HEX, RGB, HSL, and other formats.
    icon: check
  - name: Color History
    description: Automatically saves a history of all picked colors for reference.
    icon: check

additionalFeatures:
  - name: Palette Collection
    description: Organize picked colors into named palettes for projects.
    icon: check
  - name: Zoom Loupe
    description: Magnified view around the cursor for accurate color selection.
    icon: check
```

**Icon values**: Use `check` for all feature icons. The UI renders a standard icon for these feature cards.

## Similar Tools Format

```yaml
similarTools: []
```

Extensions often have few related entries. When you do reference other extensions:

```yaml
similarTools:
  - slug: ublock-origin
    name: uBlock Origin
    description: An efficient content blocker that is easy on CPU and memory.
    stars: 0
    addedDaysAgo: 0
    verified: true
    website: https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm
```

## Complete Example

```yaml
slug: eye-dropper
name: Eye Dropper
description: Pick colors from any website.
category: Chrome Extensions
parentCategory: design
subcategory: design
version: "4.10.3.15"
addedDaysAgo: 0
license: Proprietary
website: https://chromewebstore.google.com/detail/eye-dropper/hmdcmlfkchdmnmnmheododdhjedfccka
docs: https://chromewebstore.google.com/detail/eye-dropper/hmdcmlfkchdmnmnmheododdhjedfccka
sourceCode: ""
icon: eye-dropper
verified: true
featured: false
tags:
  - chrome-extension
  - color-picker
  - design
  - eyedropper
atGlance: Pick colors from any website with a precise eyedropper tool.
fullDescription: >-
  Eye Dropper is a Chrome extension that lets you pick colors from any webpage
  using a precise eyedropper tool. It captures the exact color value and provides
  the hex code, RGB values, and other color formats. It includes a color history
  and a palette manager for collecting colors during design work.
coreFeatures:
  - name: Precision Eyedropper
    description: Pick any color on screen with pixel-level precision.
    icon: check
  - name: Color Format Support
    description: View and copy colors in HEX, RGB, HSL, and other formats.
    icon: check
  - name: Color History
    description: Automatically saves a history of all picked colors for reference.
    icon: check
additionalFeatures:
  - name: Palette Collection
    description: Organize picked colors into named palettes for projects.
    icon: check
  - name: Zoom Loupe
    description: Magnified view around the cursor for accurate color selection.
    icon: check
similarTools: []
extensionSpecific:
  chromeWebStoreId: hmdcmlfkchdmnmnmheododdhjedfccka
  chromeWebStoreRating: 4.6
  userCount: 1000000
  permissions:
    - activeTab
    - scripting
    - storage
  manifestVersion: 3
  installButtonBehavior: redirect-to-chrome-web-store
```

## Category → Folder Mapping Reference

| parentCategory | Display Label | Description | Existing Extensions |
|---------------|--------------|-------------|-------------------|
| `design` | Design | Color pickers, font detectors, design utilities | Eye Dropper, WhatFont |
| `developer-tools` | Developer Tools | Cache clearing, debugging, page inspection | Clear Cache, 3D MView Extractor, MD This Page |
| `privacy` | Privacy | Ad blockers, tracker blockers, security | uBlock Origin, uBlock Origin Lite |
| `productivity` | Productivity | Screenshot tools, downloaders, workflow enhancers | GoFullPage, Imageye, Video Downloader |
| `writing` | Writing | Citation generators, grammar checkers, research | Scribbr Citation Generator |

## Where to Find Extension Metadata

To find the required `extensionSpecific` fields for a new extension:

1. Open the extension's Chrome Web Store listing
2. The **Store ID** is in the URL: `https://chromewebstore.google.com/detail/.../STORE_ID`
3. The **Rating** is displayed on the listing page (e.g., 4.6 out of 5 stars)
4. The **User count** is displayed on the listing page (e.g., "1,000,000+ users")
5. **Permissions** are listed in the "Permissions" section of the Chrome Web Store listing
6. The **Version** is shown in the "Additional Information" section
7. **Manifest version** is typically v3 — check "Manifest version" in additional info

## Validation

After creating or updating extension meta.yaml files, always run:

```bash
# Regenerate the index
bun run generate:extensions

# Type-check
npx vue-tsc --noEmit
```

The index generator reads all `meta.yaml` files recursively from `src/content/extensions/` and produces sorted JSON. Extensions are sorted by:
1. `featured: true` entries first
2. `chromeWebStoreRating` descending
