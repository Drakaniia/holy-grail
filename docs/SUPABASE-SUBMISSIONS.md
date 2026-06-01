# Supabase Submissions

Holy Grail keeps the published catalog in `src/content/**/meta.yaml`. Supabase only stores the
submission inbox, site issue inbox, review status, and submission email notification.

## Database

Apply these migrations in order:

```bash
supabase db push
```

- `supabase/migrations/20260521000000_create_submissions.sql` creates the
  `public.submissions` table and admin review RLS policies.
- `supabase/migrations/20260524000000_harden_submissions.sql` removes direct
  browser inserts and adds the server-side rate limit table/function used by
  the submission Edge Function.
- `supabase/migrations/20260525000000_add_admin_analytics.sql` adds the
  analytics settings and event tables used by the admin dashboard.
- `supabase/migrations/20260531000000_add_site_issue_reports.sql` adds the
  `public.site_issue_reports` table used by the broken and legacy site dashboard queue.

Admin access is based on server-controlled `app_metadata`, not user-editable
`user_metadata`:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
where email = 'you@example.com';
```

After updating app metadata, sign out and sign in again so the JWT refreshes.

## Submission Function

Deploy `supabase/functions/submit-tool` as the public submission endpoint:

```bash
supabase functions deploy submit-tool --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

This function validates the request origin, rate-limits by hashed client IP, inserts the pending
submission with the service role key, and sends the admin email notification after the row is saved.
It reads Supabase's built-in service secret from `SUPABASE_SERVICE_ROLE_KEY` or the newer
`SUPABASE_SECRET_KEYS` environment shape.

Set these Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set ADMIN_EMAIL=you@example.com
supabase secrets set SUBMISSION_FROM_EMAIL="Holy Grail <submissions@your-domain.com>"
supabase secrets set PUBLIC_SITE_URL=https://holy-grail-eta.vercel.app
supabase secrets set SUBMISSION_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app
supabase secrets set ACCOUNT_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app
supabase secrets set SUBMISSION_RATE_LIMIT_MAX=5
supabase secrets set SUBMISSION_RATE_LIMIT_WINDOW_SECONDS=3600
supabase secrets set SUBMISSION_RATE_LIMIT_SALT=use-a-long-random-string
```

`ADMIN_REVIEW_URL` can be used instead of `PUBLIC_SITE_URL` when the admin link should point to a
custom review URL.

The older `notify-submission` function is no longer called by the app. Redeploy the checked-in
disabled shim once, or delete the function from Supabase, so the old public email-only endpoint
cannot be used for notification spam:

```bash
supabase functions deploy notify-submission --no-verify-jwt
# or remove it from the hosted project:
# supabase functions delete notify-submission
```

For local browser testing, include the Vite origin in the relevant origin secrets:

```bash
supabase secrets set SUBMISSION_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app,http://localhost:5173
supabase secrets set SITE_REPORT_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app,http://localhost:5173
supabase secrets set ACCOUNT_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app,http://localhost:5173
```

## Review Flow

1. Visitor publishes a tool or skill at `/publish` (`/submit` remains a compatibility alias).
2. The app invokes `submit-tool`.
3. `submit-tool` validates origin, applies the rate limit, inserts a pending row, and emails the admin.
4. Admin reviews `/admin` and marks the row approved or rejected.
5. Approved items are still manually added as YAML and published through the normal build.

## Site Issue Reports

Deploy `supabase/functions/report-site-issue` so catalog visitors can add a dashboard report when a
published site is down, unreachable, deprecated, legacy, or pointing at the wrong URL:

```bash
supabase functions deploy report-site-issue --no-verify-jwt
```

The app calls this function from each site detail page. The function validates origin, applies the
same server-side IP rate-limit RPC used by submissions, optionally attaches the signed-in reporter's
email, and inserts an open `site_issue_reports` row for `/admin`.

It reuses `PUBLIC_SITE_URL`, `SUBMISSION_ALLOWED_ORIGINS`, and `SUBMISSION_RATE_LIMIT_SALT` by
default. These optional overrides can be set when site issue reports need different origins or rate
limits:

```bash
supabase secrets set SITE_REPORT_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app
supabase secrets set SITE_REPORT_RATE_LIMIT_MAX=5
supabase secrets set SITE_REPORT_RATE_LIMIT_WINDOW_SECONDS=3600
supabase secrets set SITE_REPORT_RATE_LIMIT_SALT=use-a-long-random-string
```
