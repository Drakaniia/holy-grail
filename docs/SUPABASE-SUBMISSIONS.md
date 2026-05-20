# Supabase Submissions

Holy Grail keeps the published catalog in `src/content/**/meta.yaml`. Supabase only stores the
submission inbox, review status, and admin email notification.

## Database

Apply `supabase/migrations/20260521000000_create_submissions.sql` to create the
`public.submissions` table and RLS policies.

Admin access is based on server-controlled `app_metadata`, not user-editable
`user_metadata`:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
where email = 'you@example.com';
```

After updating app metadata, sign out and sign in again so the JWT refreshes.

## Email Notification

Deploy `supabase/functions/notify-submission` as a public Edge Function because anonymous
visitors can submit tools:

```bash
supabase functions deploy notify-submission --no-verify-jwt
```

Set these Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set ADMIN_EMAIL=you@example.com
supabase secrets set SUBMISSION_FROM_EMAIL="Holy Grail <submissions@your-domain.com>"
supabase secrets set PUBLIC_SITE_URL=https://your-site.example
```

`ADMIN_REVIEW_URL` can be used instead of `PUBLIC_SITE_URL` when the admin link should point to a
custom review URL.

## Review Flow

1. Visitor submits a tool at `/submit`.
2. The app inserts a pending row in `public.submissions`.
3. The app invokes `notify-submission` to email the admin.
4. Admin reviews `/admin` and marks the row approved or rejected.
5. Approved items are still manually added as YAML and published through the normal build.
