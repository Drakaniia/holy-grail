# Design Spec: DigitalPlat FreeDomain Site Addition

**Date:** 2026-06-18
**Topic:** Adding `domain.digitalplat.org` to the hosting/deployment directory.

## 1. Overview
The goal is to add **DigitalPlat FreeDomain** to the `holy-grail` site index. This platform provides free domain registration and DNS management, fitting into the developer utility ecosystem.

## 2. Information Architecture
- **Slug:** `digitalplat-freedomain`
- **Parent Category:** `development`
- **Subcategory:** `cloud-hosting`
- **Directory:** `src/content/sites/development/cloud-hosting/digitalplat-freedomain/`

## 3. Metadata (`meta.yaml`)
| Field | Value |
| --- | --- |
| `slug` | `digitalplat-freedomain` |
| `name` | `DigitalPlat FreeDomain` |
| `description` | `Free Domain For Everyone - A platform offering free domain names and management.` |
| `category` | `Deployment` |
| `stars` | `179000` |
| `license` | `AGPL-3.0` |
| `website` | `https://domain.digitalplat.org` |
| `sourceCode` | `https://github.com/DigitalPlatDev/FreeDomain` |
| `verified` | `true` |

### Core Features
1. **Free Domain Registration**: Offers unique domain names with no strings attached.
2. **Multiple Extensions**: Supports `.DPDNS.ORG`, `.US.KG`, `.QZZ.IO`, `.XX.KG`, and `.QD.JE`.
3. **DNS Compatibility**: Allows hosting with Cloudflare, FreeDNS, or Hostry.

### Similar Tools
- `vercel`
- `supabase`
- `appwrite`

## 4. Implementation Steps
1. Create directory `src/content/sites/development/cloud-hosting/digitalplat-freedomain/`.
2. Write `meta.yaml` with the specified content.
3. Run `bun run scripts/generate-sites-index.js` to update the global index.
4. Run `bun run generate:previews:missing` to capture screenshots.
5. Validate with `bun run type-check` and `bun lint`.

## 5. Success Criteria
- The site appears in the "Development > Cloud Hosting" section.
- The detail page shows correct features and GitHub stars.
- Previews are generated and served correctly.
