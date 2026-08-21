create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  url text not null check (url ~* '^https?://'),
  description text not null check (char_length(trim(description)) between 1 and 600),
  category text not null check (char_length(trim(category)) between 1 and 120),
  submitter_note text check (
    submitter_note is null
    or char_length(trim(submitter_note)) <= 1000
  ),
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_by_email text check (
    submitted_by_email is null
    or char_length(trim(submitted_by_email)) <= 320
  ),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

revoke all on public.submissions from public;
revoke all on public.submissions from anon;
revoke all on public.submissions from authenticated;

grant insert on public.submissions to anon, authenticated;
grant select, update, delete on public.submissions to authenticated;

create index if not exists submissions_status_created_at_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submissions'
      and policyname = 'submissions_insert_anon_pending'
  ) then
    create policy "submissions_insert_anon_pending"
      on public.submissions
      for insert
      to anon
      with check (
        status = 'pending'
        and submitted_by is null
        and submitted_by_email is null
        and reviewed_by is null
        and reviewed_at is null
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
      and tablename = 'submissions'
      and policyname = 'submissions_insert_authenticated_pending'
  ) then
    create policy "submissions_insert_authenticated_pending"
      on public.submissions
      for insert
      to authenticated
      with check (
        status = 'pending'
        and submitted_by = (select auth.uid())
        and (
          submitted_by_email is null
          or submitted_by_email = ((select auth.jwt()) ->> 'email')
        )
        and reviewed_by is null
        and reviewed_at is null
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
      and tablename = 'submissions'
      and policyname = 'submissions_admin_select'
  ) then
    create policy "submissions_admin_select"
      on public.submissions
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
      and tablename = 'submissions'
      and policyname = 'submissions_admin_update'
  ) then
    create policy "submissions_admin_update"
      on public.submissions
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
      and tablename = 'submissions'
      and policyname = 'submissions_admin_delete'
  ) then
    create policy "submissions_admin_delete"
      on public.submissions
      for delete
      to authenticated
      using (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      );
  end if;
end
$$;
