create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.submission_rate_limits (
  rate_key text primary key,
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  last_request_at timestamptz not null default now()
);

alter table private.submission_rate_limits enable row level security;

revoke all on private.submission_rate_limits from public;
revoke all on private.submission_rate_limits from anon;
revoke all on private.submission_rate_limits from authenticated;

create index if not exists submission_rate_limits_last_request_at_idx
  on private.submission_rate_limits (last_request_at);

drop policy if exists "submissions_insert_anon_pending" on public.submissions;
drop policy if exists "submissions_insert_authenticated_pending" on public.submissions;

revoke insert on public.submissions from anon;
revoke insert on public.submissions from authenticated;

create or replace function public.check_submission_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_window interval;
  v_window_start timestamptz;
  v_request_count integer;
begin
  if p_key is null or length(trim(p_key)) = 0 or p_limit < 1 or p_window_seconds < 10 then
    return query select false, 0, greatest(p_window_seconds, 60);
    return;
  end if;

  v_window := make_interval(secs => p_window_seconds);

  insert into private.submission_rate_limits (
    rate_key,
    window_start,
    request_count,
    last_request_at
  )
  values (
    p_key,
    v_now,
    1,
    v_now
  )
  on conflict (rate_key) do update
  set
    window_start = case
      when private.submission_rate_limits.window_start + v_window <= v_now then v_now
      else private.submission_rate_limits.window_start
    end,
    request_count = case
      when private.submission_rate_limits.window_start + v_window <= v_now then 1
      else private.submission_rate_limits.request_count + 1
    end,
    last_request_at = v_now
  returning window_start, request_count
  into v_window_start, v_request_count;

  return query
  select
    v_request_count <= p_limit,
    greatest(p_limit - v_request_count, 0),
    case
      when v_request_count <= p_limit then 0
      else greatest(1, ceil(extract(epoch from (v_window_start + v_window - v_now)))::integer)
    end;
end;
$$;

revoke all on function public.check_submission_rate_limit(text, integer, integer) from public;
revoke all on function public.check_submission_rate_limit(text, integer, integer) from anon;
revoke all on function public.check_submission_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_submission_rate_limit(text, integer, integer) to service_role;
