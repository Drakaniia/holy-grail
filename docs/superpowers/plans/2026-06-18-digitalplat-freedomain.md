# DigitalPlat FreeDomain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DigitalPlat FreeDomain to the site index under Development > Cloud Hosting.

**Architecture:** Create a new site directory and meta.yaml, then regenerate the index and previews.

**Tech Stack:** Bun, YAML, Node.js scripts.

## Global Constraints
- **Slug:** `digitalplat-freedomain`
- **Category:** `Deployment`
- **Parent Category:** `development`
- **Subcategory:** `cloud-hosting`

---

### Task 1: Scaffolding and Metadata

**Files:**
- Create: `src/content/sites/development/cloud-hosting/digitalplat-freedomain/meta.yaml`

- [ ] **Step 1: Create directory and write meta.yaml**

```yaml
slug: digitalplat-freedomain
name: DigitalPlat FreeDomain
description: Free Domain For Everyone - A platform offering free domain names and management.
category: Deployment
parentCategory: development
subcategory: cloud-hosting
stars: 179000
watchers: 890
addedDaysAgo: 0
license: AGPL-3.0
lastCommit: 1 day ago
lastRelease: N/A
version: ""
contributors: 10
commitsThisYear: 50
releases: 0
platforms:
  - Web
deployment:
  - Cloud
website: https://domain.digitalplat.org
docs: https://domain.digitalplat.org
sourceCode: https://github.com/DigitalPlatDev/FreeDomain
icon: globe
verified: true
featured: false
tags:
  - domain
  - dns
  - free
atGlance: Free Domain For Everyone - A platform offering free domain names and management.
fullDescription: >-
  DigitalPlat FreeDomain is a non-profit project that provides free domain names (subdomains) 
  to developers, students, and open-source projects. It offers full DNS control and 
  compatibility with major providers like Cloudflare.
coreFeatures:
  - name: Free Domain Registration
    description: Offers unique domain names with no strings attached.
    icon: check
  - name: Multiple Extensions
    description: Supports extensions like .DPDNS.ORG, .US.KG, .QZZ.IO, .XX.KG, and .QD.JE.
    icon: check
  - name: DNS Compatibility
    description: Allows users to host their domains with popular DNS providers such as Cloudflare or FreeDNS.
    icon: check
additionalFeatures:
  - name: Non-Profit Backed
    description: Operated by the DigitalPlat Foundation, a non-profit organization.
    icon: check
  - name: Open Source
    description: The platform itself is open-source and community-driven.
    icon: check
similarTools:
  - slug: vercel
    name: Vercel
    description: Develop, preview, and ship web applications with the fastest global edge network.
    stars: 12500
    addedDaysAgo: 2
    verified: true
    website: https://vercel.com
  - slug: supabase
    name: Supabase
    description: The open source Firebase alternative.
    stars: 102722
    addedDaysAgo: 0
    verified: true
    website: https://supabase.com/
```

- [ ] **Step 2: Commit metadata**

```bash
git add src/content/sites/development/cloud-hosting/digitalplat-freedomain/meta.yaml
git commit -m "feat: add digitalplat-freedomain metadata"
```

### Task 2: Index Regeneration and Validation

**Files:**
- Modify: `src/content/sites-index.json`
- Modify: `src/content/site-previews.json`

- [ ] **Step 1: Regenerate site index**

Run: `bun run scripts/generate-sites-index.js`

- [ ] **Step 2: Generate missing previews**

Run: `bun run generate:previews:missing`

- [ ] **Step 3: Run validation**

Run: `bun run type-check && bun lint`

- [ ] **Step 4: Commit generated assets**

```bash
git add src/content/sites-index.json src/content/site-previews.json public/previews/digitalplat-freedomain*
git commit -m "build: regenerate site index and previews for digitalplat-freedomain"
```
