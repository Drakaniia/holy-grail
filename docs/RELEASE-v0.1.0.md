# Holy Grail v0.1.0

Release date: 2026-05-31

This is a site-only release. It does not publish an installable package, but it is tagged because
the changes affect production catalog behavior, admin workflows, and content shipped to users.

## Summary

- Adds a Supabase-backed dashboard queue for site issue reports.
- Refines the sites catalog browsing controls.
- Clarifies anonymous publishing before a submission is sent for review.
- Refreshes UI-library metadata, generated indexes, and Spartan preview assets.
- Includes recent home page motion and random-site navigation polish.

## User-Facing Changes

- Site detail pages can report more than one issue type: not working, legacy, wrong URL, or other.
- Reports now land in the admin dashboard instead of relying on email delivery.
- The admin dashboard can filter, resolve, ignore, reopen, and delete site issue reports.
- The sites page defaults to popular ordering and adds clearer controls for popular, recent, explore,
  and time-range browsing.
- The publish page now warns anonymous users before the final review step and links to sign in with a
  redirect back to publishing.

## Content Changes

- Refreshed UI-library metadata for the development catalog.
- Regenerated `src/content/sites-index.json` and `public/content/sites-index.json`.
- Updated `public/previews/spartan-ng.webp`, `public/previews/spartan-ng-sm.webp`, and preview
  manifests.

## Operations

- Apply `supabase/migrations/20260531000000_add_site_issue_reports.sql` before relying on the admin
  site issue queue.
- Deploy `supabase/functions/report-site-issue` after the migration.
- The report function reuses the existing submission origin and rate-limit environment settings.
- No npm, yarn, or pnpm commands are required; this project remains Bun-only.

## Verification

- `bun run type-check`
- `bun lint`
- `bun run build`
- `git diff --check`

## Commit Range

This release covers the local `grail` branch changes from `2c15183` through `663eaef` before the
release documentation commit.
