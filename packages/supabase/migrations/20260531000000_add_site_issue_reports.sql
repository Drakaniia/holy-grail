create table if not exists public.site_issue_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (char_length(trim(slug)) between 1 and 160),
  name text not null check (char_length(trim(name)) between 1 and 120),
  url text not null check (url ~* '^https?://'),
  category text check (
    category is null
    or char_length(trim(category)) <= 120
  ),
  issue_type text not null default 'down' check (
    issue_type in ('down', 'deprecated', 'wrong-url', 'other')
  ),
  note text check (
    note is null
    or char_length(trim(note)) <= 1000
  ),
  reporter_email text check (
    reporter_email is null
    or char_length(trim(reporter_email)) <= 320
  ),
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.site_issue_reports enable row level security;

revoke all on public.site_issue_reports from public;
revoke all on public.site_issue_reports from anon;
revoke all on public.site_issue_reports from authenticated;

grant select, update, delete on public.site_issue_reports to authenticated;
grant insert, select, update, delete on public.site_issue_reports to service_role;

create index if not exists site_issue_reports_status_created_at_idx
  on public.site_issue_reports (status, created_at desc);

create index if not exists site_issue_reports_slug_status_idx
  on public.site_issue_reports (slug, status);

create index if not exists site_issue_reports_issue_type_status_idx
  on public.site_issue_reports (issue_type, status);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_issue_reports'
      and policyname = 'site_issue_reports_admin_select'
  ) then
    create policy "site_issue_reports_admin_select"
      on public.site_issue_reports
      for select
      to authenticated
      using (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_issue_reports'
      and policyname = 'site_issue_reports_admin_update'
  ) then
    create policy "site_issue_reports_admin_update"
      on public.site_issue_reports
      for update
      to authenticated
      using (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      )
      with check (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_issue_reports'
      and policyname = 'site_issue_reports_admin_delete'
  ) then
    create policy "site_issue_reports_admin_delete"
      on public.site_issue_reports
      for delete
      to authenticated
      using (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      );
  end if;
end
$$;

notify pgrst, 'reload schema';
