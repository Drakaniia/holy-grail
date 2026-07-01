---
name: add-sites
description: "Use when adding one or more sites to the Holy Grail site catalog. Covers web research, category classification, meta.yaml creation, index regeneration, and validation. Designed for batch additions of 1-10 sites in a single pass."
metadata:
  version: "1.0"
---

# Add Sites to Holy Grail Catalog

This skill documents the complete methodology for adding new sites to the Holy Grail catalog. It captures the parallel research, categorization, file creation, and validation workflow used effectively in practice.

## Workflow Summary

```
Research (parallel) → Categorize → Create meta.yaml files (parallel) → Regenerate index → Validate
```

## Step 1: Gather Context (Always do first)

Before creating any files, understand the existing structure:

```bash
# Explore top-level categories
ls src/content/sites/

# Explore specific categories to find where your sites belong
ls src/content/sites/design/
ls src/content/sites/development/
ls src/content/sites/ai/
```

Read a few existing `meta.yaml` files from the **same category** your new sites will go into. This ensures you match the exact naming style, description tone, feature object structure, and similar tools conventions.

```bash
cat src/content/sites/design/icons-svg/iconly/meta.yaml
cat src/content/sites/design/design-tools/jitter/meta.yaml
cat src/content/sites/ai/wb/lovable/meta.yaml
```

Also read the reference document for the full meta.yaml schema:
> Load `references/meta-yaml-schema.md` (in this skill's references folder)

## Step 2: Check for Existing Sites

Before creating anything new, check if the site already exists in the catalog:

```bash
# Search by domain name or slug pattern
find src/content/sites -type d -name "*everydev*" 2>/dev/null
find src/content/sites -type d -name "*holygrid*" 2>/dev/null

# Or check the generated index
grep -l "everydev" src/content/sites-index.json 2>/dev/null
```

Skip any site that already exists. Only create new entries.

## Step 3: Research Sites in Parallel

Spawn **one web researcher per URL** in parallel to understand what each site does. This is the most efficient approach — all researchers run concurrently.

```yaml
# Spawn pattern — one researcher per site
agents:
  - agent_type: researcher-web
    prompt: "What is iconinspo.com? An icon inspiration gallery or resource?"
  - agent_type: researcher-web
    prompt: "What is holygrid.studio? A design studio or template marketplace?"
  - agent_type: researcher-web
    prompt: "What is orchids.app? An AI IDE or app builder?"
```

For each site, determine:
- **Purpose**: What problem does it solve? What kind of tool is it?
- **Category fit**: Which existing category/subcategory does it map to?
- **GitHub repo**: Is there a public repo? (for stars, contributors, etc.)
- **License**: MIT, Proprietary, Apache-2.0, etc.
- **Platforms**: Web, Desktop, CLI, Figma, etc.
- **Deployment**: Cloud, Docker Compose, Self-hosted, etc.

## Step 4: Determine Category Structure

Map each site to the correct folder path. The three top-level categories are:

```
src/content/sites/
├── ai/           # AI tools, chatbots, ML, automation, website builders
│   ├── automation/
│   ├── chat/
│   ├── image/
│   ├── ml/
│   ├── video/
│   ├── wb/       # Website builders (v0, lovable, orchids)
│   └── others/   # Catch-all for uncategorized AI sites
├── design/       # Design tools, icons, fonts, inspiration
│   ├── design-tools/
│   ├── icons-svg/
│   ├── fonts/
│   ├── 3d/
│   └── inspiration/
├── development/  # Developer tools, hosting, CLI, learning
│   ├── cli-tools/
│   ├── cloud-hosting/
│   ├── ui-libraries/
│   ├── learning/
│   └── repositories/
├── downloads/    # Game downloads, software, torrents, VFX
└── watch/        # Anime, movies, streaming
```

**Classification guidelines**:
| Site Type | parentCategory | Category (display) | Subcategory |
|-----------|---------------|-------------------|-------------|
| SVG icons library | `design` | `Icons/SVG` | `icons-svg` |
| Design templates | `design` | `Design Tools` | `design-tools` |
| Motion/animation tool | `design` | `Design Tools` | `design-tools` |
| AI app builder/IDE | `ai` | `Website Development` | `wb` |
| AI tools directory/community | `ai` | `AI` | `others` |
| AI CLI tool | `development` | `AI CLI` | `cli-tools` |
| Hosting platform | `development` | `Hosting` | `cloud-hosting` |

## Step 5: Create Directories

Create all required directories in a single command:

```bash
mkdir -p src/content/sites/design/icons-svg/iconinspo \
  src/content/sites/design/design-tools/holygrid-studio \
  src/content/sites/ai/wb/orchids
```

**Naming conventions**:
- **Slug**: Lowercase, use hyphens for multi-word names (`holygrid-studio`)
- **Directory name**: Must match the `slug` field exactly
- **Single-word domains**: Use just the name (`iconinspo`, `animos`, `orchids`)

## Step 6: Create meta.yaml Files in Parallel

Write one `meta.yaml` per site directory. Use `write_file` for each — they can all be created simultaneously.

### Required fields (always include):

```yaml
slug: site-slug
name: Display Name
description: Short card description for list views.
category: Display Category
parentCategory: top-level-folder
subcategory: nested-folder-or-null
stars: 0
watchers: 0
addedDaysAgo: 0
license: Proprietary
lastCommit: N/A
lastRelease: N/A
version: ""
contributors: 0
commitsThisYear: 0
releases: 0
platforms:
  - Web
deployment:
  - Cloud
website: https://example.com
docs: https://example.com
sourceCode: ""
icon: icon-name
verified: false
featured: false
tags:
  - bookmark
```

### Core features and additional features:

Write 2-3 `coreFeatures` and 2-3 `additionalFeatures`. Each feature has:
- `name`: Short label
- `description`: One-line explanation
- `icon`: Use `check` for generic features, or descriptive names like `sparkles`, `layers`, `rocket` for standout features

```yaml
coreFeatures:
  - name: AI Code Generation
    description: Build apps from natural language prompts.
    icon: sparkles
  - name: Built-in Editor
    description: Integrated VS Code editor for manual code adjustments.
    icon: check
additionalFeatures:
  - name: Diverse App Support
    description: Build mobile apps, extensions, bots, and agents.
    icon: layers
  - name: One-Click Deploy
    description: Deploy applications directly from the platform.
    icon: rocket
```

### Similar tools:

Reference 3 existing sites from the same category/subcategory. Use actual slugs that exist in the codebase:

```yaml
similarTools:
  - slug: lovable
    name: Lovable
    description: AI-powered full-stack web app builder.
    stars: 8900
    addedDaysAgo: 0
    verified: true
    website: https://lovable.dev
  - slug: bolt
    name: Bolt
    description: AI-powered web app builder from prompt to deployment.
    stars: 0
    addedDaysAgo: 0
    verified: false
    website: https://bolt.new/
```

**Tips for good meta.yaml**:
- Description should be concise but descriptive (used in site cards)
- `atGlance` is a one-line summary for the detail page header
- `fullDescription` can be 2-3 sentences explaining what the site does
- Tags help with search — include the category and relevant keywords
- Set `verified: false` for all manual entries. The enrichment script (`enrich-site-metadata.js --apply`) handles setting it to `true` after confirming a GitHub repo
- `similarTools` star counts go stale — refresh from the actual `sites-index.json` periodically
- For `icon`, use the slug name — this maps to the favicon fallback system

## Step 7: Regenerate the Sites Index

After all meta.yaml files are created, regenerate the index:

```bash
node scripts/build/generate-sites-index.js
```

This reads all `meta.yaml` files from `src/content/sites/` and writes:
- `src/content/sites-index.json` (source)
- `public/content/sites-index.json` (build output)

**Note**: The output will print "Generated sites index with N sites". Compare N to the previous count to verify your new sites were added.

## Step 8: Validate

Run type checking and linting:

```bash
npx vue-tsc --noEmit
npx oxlint --fix
```

Also spawn a code reviewer to verify the meta.yaml files follow conventions.

## Full Example Run

Here's the exact workflow used to add 5 sites in a single session:

```bash
# 1. Research — spawned 6 parallel web researchers to understand each URL
#    (thesvg.org was found to already exist, so skipped)

# 2. Create directories
mkdir -p src/content/sites/design/icons-svg/iconinspo \
  src/content/sites/design/design-tools/holygrid-studio \
  src/content/sites/design/design-tools/animos \
  src/content/sites/ai/others/everydev \
  src/content/sites/ai/wb/orchids

# 3. Write meta.yaml files — 5 files created in parallel using write_file
#    Each followed the template: slug, name, description, category, features, similar tools

# 4. Regenerate index
node scripts/build/generate-sites-index.js
# Output: Generated sites index with 403 sites (was 398)

# 5. Validate
npx vue-tsc --noEmit        # Passes
```

## Post-Creation: Generate Preview Images

New sites won't have preview screenshots until you run the preview generator:

```bash
bun run generate:previews       # captures only sites without previews
bun run review:previews         # check if previews are present or fallback
```

This is optional — sites display fine without previews (they show a fallback).

## Verification Checklist

- [ ] Each site's directory exists under the correct category path
- [ ] Each `meta.yaml` has all required fields
- [ ] `slug` matches directory name
- [ ] `parentCategory` and `subcategory` match actual folder structure
- [ ] `similarTools` references use existing slugs (verify with `find src/content/sites -type d -name "SLUG"`)
- [ ] The `sites-index.json` regeneration succeeded and shows correct count
- [ ] Type checking passes (`vue-tsc --noEmit`)
- [ ] No duplicate entries (site wasn't already in the catalog)

## References

- `references/meta-yaml-schema.md` — Full meta.yaml field reference
- `docs/ADDING-SITES.md` — Original documentation
- `scripts/build/generate-sites-index.js` — Index generation script
