---
name: add-extensions
description: "Use when adding one or more Chrome extensions to the Holy Grail extensions catalog. Covers Chrome Web Store research, category classification, extension-specific metadata, meta.yaml creation, index regeneration, and validation."
metadata:
  version: "1.0"
---

# Add Extensions to Holy Grail Catalog

This skill documents the complete methodology for adding Chrome extensions to the Holy Grail catalog. Extensions follow a similar pattern to sites but have additional Chrome Web Store-specific metadata.

## Workflow Summary

```
Research (parallel) → Categorize → Create meta.yaml files (parallel) → Regenerate index → Validate
```

## Step 1: Gather Context (Always do first)

Before creating any files, understand the existing structure:

```bash
# Explore top-level categories
ls src/content/extensions/

# Read a few existing meta.yaml files from the same category
cat src/content/extensions/writing/scribbr-citation-generator/meta.yaml
cat src/content/extensions/productivity/gofullpage/meta.yaml
cat src/content/extensions/developer-tools/clear-cache/meta.yaml
```

Also read the reference document for the full schema:
> Load `references/extension-meta-yaml-schema.md` (in this skill's references folder)

## Step 2: Check for Existing Extensions

Before creating anything new, check if the extension already exists:

```bash
# Search by slug or keyword
find src/content/extensions -type d -name "*keyword*" 2>/dev/null

# Or check the generated index
grep "your-extension" src/content/extensions-index.json 2>/dev/null
```

Skip any extension that already exists. Only create new entries.

## Step 3: Research Extensions in Parallel

Spawn **one web researcher per URL** in parallel to understand each extension:

```yaml
# Spawn pattern — one researcher per extension
agents:
  - agent_type: researcher-web
    prompt: "What is the Eye Dropper Chrome extension? Features, permissions, user count?"
  - agent_type: researcher-web
    prompt: "What is the GoFullPage Chrome extension? Features, user count, permissions?"
```

For each extension, determine:
- **Purpose**: What does it do? Who is it for?
- **Category fit**: Which existing category does it belong to (design, productivity, developer-tools, privacy, writing)?
- **Chrome Web Store ID**: The unique ID from the Chrome Web Store URL (the long hash at the end)
- **Rating**: The star rating out of 5
- **User count**: Number of users
- **Permissions**: Required Chrome API permissions (activeTab, storage, scripting, etc.)
- **Manifest version**: Typically v3 for modern extensions

Extract the Chrome Web Store ID from the URL pattern:
```
https://chromewebstore.google.com/detail/.../CHROME_WEB_STORE_ID
```

Example: `https://chromewebstore.google.com/detail/eye-dropper/hmdcmlfkchdmnmnmheododdhjedfccka`
→ Store ID: `hmdcmlfkchdmnmnmheododdhjedfccka`

## Step 4: Determine Category Structure

Map each extension to the correct folder path. Supported top-level categories:

```
src/content/extensions/
├── design/               # Color pickers, font detectors, design utilities
├── developer-tools/      # Cache clearing, debugging, page inspection
├── privacy/              # Ad blockers, tracker blockers, security
├── productivity/         # Screenshot tools, downloaders, workflow enhancers
├── writing/              # Citation generators, grammar checkers, research tools
```

The first-level directory becomes `parentCategory`. When `subcategory` is not provided, it defaults to the same value as `parentCategory`.

**Classification guidelines**:
| Extension Type | `parentCategory` | `category` (display) | Example |
|---------------|-----------------|---------------------|---------|
| Color picker/design utility | `design` | `Chrome Extensions` | Eye Dropper |
| Font detector | `design` | `Chrome Extensions` | WhatFont |
| Dev tool (cache, debug) | `developer-tools` | `Chrome Extensions` | Clear Cache |
| Ad blocker | `privacy` | `Chrome Extensions` | uBlock Origin |
| Screenshot tool | `productivity` | `Chrome Extensions` | GoFullPage |
| Citation/research | `writing` | `Chrome Extensions` | Scribbr Citation |

## Step 5: Create Directories

Create all required directories in a single command:

```bash
mkdir -p src/content/extensions/productivity/my-extension \
  src/content/extensions/design/my-extension
```

**Naming conventions**:
- **Slug**: Lowercase, use hyphens for multi-word names (`video-downloader-professional`)
- **Directory name**: Must match the `slug` field exactly
- **Single-word names**: Use just the name (`gofullpage`, `whatfont`)

## Step 6: Create meta.yaml Files in Parallel

Write one `meta.yaml` per extension directory using `write_file`. Extensions share the same base fields as sites but have a dedicated `extensionSpecific` section.

### Common fields (always include):

```yaml
slug: extension-slug
name: Display Name
description: Short card description for list views.
category: Chrome Extensions
parentCategory: category-folder
subcategory: category-folder
version: "1.0.0"
addedDaysAgo: 0
license: Proprietary
platforms:
  - Chrome Extension
deployment:
  - Chrome Web Store
website: https://chromewebstore.google.com/detail/.../STORE_ID
docs: https://chromewebstore.google.com/detail/.../STORE_ID
sourceCode: ""
icon: extension-slug
verified: true
featured: false
tags:
  - chrome-extension
```

### Extension-Specific Fields (required)

All Chrome Web Store metadata goes under an `extensionSpecific` key:

```yaml
extensionSpecific:
  chromeWebStoreId: hmdcmlfkchdmnmnmheododdhjedfccka    # Required — from the CWS URL
  chromeWebStoreRating: 4.6                              # Required — out of 5
  userCount: 1000000                                     # Required — number of users
  permissions:                                           # Required — Chrome API permissions
    - activeTab
    - scripting
    - storage
  manifestVersion: 3                                     # Required — typically 3
  installButtonBehavior: redirect-to-chrome-web-store    # Optional — default value
```

### Core features and additional features:

Write 3 `coreFeatures` and 2-3 `additionalFeatures`. Keep descriptions focused on what the extension actually does:

```yaml
coreFeatures:
  - name: One-Click Full Page Capture
    description: Capture an entire webpage from top to bottom with a single click.
    icon: check
  - name: No Extra Permissions
    description: Works without requesting any additional permissions beyond basic functionality.
    icon: check
  - name: Download as PNG or PDF
    description: Save the captured full-page screenshot as PNG image or PDF document.
    icon: check
additionalFeatures:
  - name: Visible Viewport Capture
    description: Also supports capturing only the visible portion of the page.
    icon: check
  - name: Screenshot History
    description: Access your recently captured screenshots from the extension popup.
    icon: check
```

### Similar tools:

Extensions often have few related entries, so `similarTools` may be an empty list `[]`:

```yaml
similarTools: []
```

When you do reference other extensions, use the same format as sites:

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

**Tips for good meta.yaml**:
- Description should be concise but descriptive (used in extension cards)
- `atGlance` is a one-line summary for the detail page header
- `fullDescription` can be 2-3 sentences explaining what the extension does
- Tags help with search — always include `chrome-extension`
- Set `verified: true` for Chrome Web Store extensions (they are published and reviewable)
- The `version` field should match the current Chrome Web Store version
- For `icon`, use the slug name
- Permissions should accurately reflect what the extension requests — check the Chrome Web Store listing

## Step 7: Regenerate the Extensions Index

After all meta.yaml files are created, regenerate the index:

```bash
bun run generate:extensions
```

This runs `scripts/build/generate-extensions-index.js` which reads all `meta.yaml` files from `src/content/extensions/` and writes:
- `src/content/extensions-index.json` (source)
- `public/content/extensions-index.json` (build output)

**Note**: The output will print "Generated extensions index with N extensions". Compare N to the previous count to verify your new extensions were added.

## Step 8: Validate

Run type checking:

```bash
npx vue-tsc --noEmit
```

Also spawn a code reviewer to verify the meta.yaml files follow conventions.

## Full Example Run

Here's what the workflow looks like for adding a single extension:

```bash
# 1. Research the extension on Chrome Web Store to get:
#    - Store ID, rating, user count, permissions, version

# 2. Create directory
mkdir -p src/content/extensions/design/eye-dropper

# 3. Write meta.yaml with all fields + extensionSpecific block

# 4. Regenerate index
bun run generate:extensions
# Output: Generated extensions index with 12 extensions

# 5. Validate
npx vue-tsc --noEmit        # Passes
```

## Verification Checklist

- [ ] Each extension's directory exists under the correct parent category
- [ ] Each `meta.yaml` has all required fields including `extensionSpecific`
- [ ] `slug` matches directory name
- [ ] `parentCategory` matches an actual directory under `src/content/extensions/`
- [ ] `chromeWebStoreId` is the correct ID from the Chrome Web Store URL
- [ ] `userCount`, `chromeWebStoreRating`, and `permissions` are accurate
- [ ] `website` and `docs` point to the correct Chrome Web Store URL
- [ ] The `extensions-index.json` regeneration succeeded and shows correct count
- [ ] Type checking passes (`vue-tsc --noEmit`)
- [ ] No duplicate entries (extension wasn't already in the catalog)

## References

- `references/extension-meta-yaml-schema.md` — Full meta.yaml field reference
- `docs/ADDING-EXTENSIONS.md` — Original documentation
- `scripts/build/generate-extensions-index.js` — Index generation script
