-- Phase 7: authenticated trip records and explicit sharing state.

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  destination text not null check (char_length(btrim(destination)) between 1 and 160),
  start_date date not null,
  end_date date not null,
  sharing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_range check (end_date >= start_date)
);

create index if not exists trips_user_created_idx on public.trips(user_id, created_at desc);
create index if not exists trips_user_sharing_idx on public.trips(user_id, sharing);

create or replace function public.set_trip_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_trip_updated_at();

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own"
on public.trips for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own"
on public.trips for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own"
on public.trips for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own"
on public.trips for delete to authenticated
using (auth.uid() = user_id);
