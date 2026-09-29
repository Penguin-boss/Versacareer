create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  constraint rate_limit_buckets_request_count_nonnegative check (request_count >= 0)
);

alter table public.rate_limit_buckets enable row level security;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_key) = 0 then
    return false;
  end if;

  insert into public.rate_limit_buckets (key, window_started_at, request_count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_started_at = case
      when now() >= public.rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limit_buckets.window_started_at
    end,
    request_count = case
      when now() >= public.rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limit_buckets.request_count + 1
    end;

  select request_count into current_count
  from public.rate_limit_buckets
  where key = p_key;

  return current_count <= p_limit;
end;
$$;

revoke all on table public.rate_limit_buckets from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
