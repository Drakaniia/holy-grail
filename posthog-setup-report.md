# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the Holy Grail Vue 3 project. `posthog-js` was installed and initialized in `src/main.ts` alongside the existing custom Supabase analytics — no existing code was removed or restructured. A global Vue error handler was wired to `posthog.captureException`. User identification is performed on every sign-in and sign-up (email and OAuth), and `posthog.reset()` is called on sign-out and account deletion to clear the session. Thirteen custom events were added across five files covering the full user lifecycle: authentication, catalog engagement (bookmarks), the multi-step publish/submission funnel, profile updates, and admin moderation actions.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `user_signed_up` | User successfully created a new account with email and password. | `src/stores/auth.ts` |
| `user_signed_in` | User successfully signed in with email and password (or completed OAuth callback). | `src/stores/auth.ts` |
| `user_signed_in_with_oauth` | User initiated OAuth sign-in with a third-party provider (GitHub or Google). | `src/stores/auth.ts` |
| `user_signed_out` | User signed out of their account. | `src/stores/auth.ts` |
| `user_account_deleted` | User permanently deleted their account. | `src/stores/auth.ts` |
| `profile_updated` | User saved changes to their display name, avatar, or bio. | `src/stores/auth.ts` |
| `submission_step_completed` | User advanced to the next step in the multi-step publish/submit flow. | `src/pages/SubmitPage.vue` |
| `submission_submitted` | User successfully submitted a site or skill for admin review. | `src/pages/SubmitPage.vue` |
| `submission_failed` | A submission attempt failed with an error from the server. | `src/pages/SubmitPage.vue` |
| `resource_bookmarked` | User bookmarked a site or skill resource. | `src/components/bookmarks/BookmarkButton.vue` |
| `resource_unbookmarked` | User removed a site or skill from their bookmarks. | `src/components/bookmarks/BookmarkButton.vue` |
| `admin_submission_approved` | Admin approved a pending community submission. | `src/components/admin/AdminSubmissionsPanel.vue` |
| `admin_submission_rejected` | Admin rejected a pending community submission. | `src/components/admin/AdminSubmissionsPanel.vue` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/495745/dashboard/1793405)
- [New signups over time (wizard)](https://us.posthog.com/project/495745/insights/1NH7YfEz)
- [Sign-ins over time (wizard)](https://us.posthog.com/project/495745/insights/xwLHfSFo)
- [Submission conversion funnel (wizard)](https://us.posthog.com/project/495745/insights/USlO2XdR)
- [Resource bookmarks over time (wizard)](https://us.posthog.com/project/495745/insights/qoiqhX5p)
- [Account deletions — churn signal (wizard)](https://us.posthog.com/project/495745/insights/VuUPZclu)

## Verify before merging

- [ ] Run a full production build (`bun run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` to `.env.example` (and any onboarding/bootstrap scripts) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the OAuth callback handler identifies on every fresh login, but users who return with an existing session (via `auth.initialize()`) are not re-identified in this integration. Consider calling `posthog.identify` in the `initialize()` function when a session is found.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
