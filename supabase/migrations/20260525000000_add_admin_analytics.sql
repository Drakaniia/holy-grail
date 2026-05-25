create table if not exists public.analytics_settings (
  id text primary key default 'global' check (id = 'global'),
  tracking_enabled boolean not null default true,
  track_authenticated_users boolean not null default true,
  track_search_terms boolean not null default true,
  track_outbound_clicks boolean not null default true,
  retention_days integer not null default 90 check (retention_days in (30, 90, 365)),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.analytics_settings (
  id,
  tracking_enabled,
  track_authenticated_users,
  track_search_terms,
  track_outbound_clicks,
  retention_days
)
values ('global', true, true, true, true, 90)
on conflict (id) do nothing;

alter table public.analytics_settings enable row level security;

revoke all on public.analytics_settings from public;
revoke all on public.analytics_settings from anon;
revoke all on public.analytics_settings from authenticated;

grant select on public.analytics_settings to anon, authenticated;
grant update on public.analytics_settings to authenticated;

create index if not exists analytics_settings_updated_by_idx
  on public.analytics_settings (updated_by)
  where updated_by is not null;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_settings'
      and policyname = 'analytics_settings_public_select'
  ) then
    create policy "analytics_settings_public_select"
      on public.analytics_settings
      for select
      to anon, authenticated
      using (id = 'global');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_settings'
      and policyname = 'analytics_settings_admin_update'
  ) then
    create policy "analytics_settings_admin_update"
      on public.analytics_settings
      for update
      to authenticated
      using (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
      )
      with check (
        id = 'global'
        and (
          ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          or (((select auth.jwt()) -> 'app_metadata' -> 'roles') ? 'admin')
        )
      );
  end if;
end
$$;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('page_view', 'search', 'outbound_click', 'signup', 'bookmark')
  ),
  session_id text not null check (
    char_length(session_id) between 16 and 80
    and session_id !~ '[\r\n]'
  ),
  user_id uuid references auth.users(id) on delete set null,
  route_path text check (
    route_path is null
    or char_length(route_path) <= 400
  ),
  route_name text check (
    route_name is null
    or char_length(route_name) <= 80
  ),
  resource_type text check (
    resource_type is null
    or resource_type in ('site', 'skill')
  ),
  resource_slug text check (
    resource_slug is null
    or char_length(resource_slug) <= 160
  ),
  target_url text check (
    target_url is null
    or (
      char_length(target_url) <= 1000
      and target_url ~* '^https?://'
    )
  ),
  search_query text check (
    search_query is null
    or char_length(search_query) <= 160
  ),
  device_type text check (
    device_type is null
    or device_type in ('desktop', 'tablet', 'mobile')
  ),
  browser_family text check (
    browser_family is null
    or browser_family in ('chrome', 'edge', 'firefox', 'safari', 'other')
  ),
  referrer_host text check (
    referrer_host is null
    or char_length(referrer_host) <= 255
  ),
  viewport_width integer check (
    viewport_width is null
    or viewport_width between 1 and 10000
  ),
  created_at timestamptz not null default now(),
  constraint analytics_events_payload_check check (
    (
      event_type = 'page_view'
      and route_path is not null
    )
    or (
      event_type = 'search'
      and search_query is not null
    )
    or (
      event_type = 'outbound_click'
      and target_url is not null
    )
    or (
      event_type = 'signup'
      and user_id is not null
    )
    or (
      event_type = 'bookmark'
      and resource_type is not null
      and resource_slug is not null
    )
  )
);

alter table public.analytics_events enable row level security;

revoke all on public.analytics_events from public;
revoke all on public.analytics_events from anon;
revoke all on public.analytics_events from authenticated;

grant insert on public.analytics_events to anon, authenticated;
grant select, delete on public.analytics_events to authenticated;

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_session_created_at_idx
  on public.analytics_events (session_id, created_at desc);

create index if not exists analytics_events_user_created_at_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists analytics_events_route_path_idx
  on public.analytics_events (route_path, created_at desc)
  where event_type = 'page_view';

create index if not exists analytics_events_search_query_idx
  on public.analytics_events (search_query, created_at desc)
  where event_type = 'search';

create index if not exists analytics_events_target_url_idx
  on public.analytics_events (target_url, created_at desc)
  where event_type = 'outbound_click';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'analytics_events_anon_insert'
  ) then
    create policy "analytics_events_anon_insert"
      on public.analytics_events
      for insert
      to anon
      with check (user_id is null);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'analytics_events_authenticated_insert'
  ) then
    create policy "analytics_events_authenticated_insert"
      on public.analytics_events
      for insert
      to authenticated
      with check (
        user_id is null
        or user_id = (select auth.uid())
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
      and tablename = 'analytics_events'
      and policyname = 'analytics_events_admin_select'
  ) then
    create policy "analytics_events_admin_select"
      on public.analytics_events
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
      and tablename = 'analytics_events'
      and policyname = 'analytics_events_admin_delete'
  ) then
    create policy "analytics_events_admin_delete"
      on public.analytics_events
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
