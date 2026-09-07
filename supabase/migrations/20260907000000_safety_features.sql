-- Phase 2 Safety foundation: authenticated tables and row-level security.

create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text check (phone is null or char_length(btrim(phone)) between 7 and 32),
  email text check (email is null or (char_length(btrim(email)) between 3 and 320 and position('@' in email) > 1)),
  relationship text check (relationship is null or char_length(btrim(relationship)) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trusted_contacts_reachable check (phone is not null or email is not null)
);

create index if not exists trusted_contacts_user_id_idx on public.trusted_contacts(user_id);
create index if not exists trusted_contacts_active_idx on public.trusted_contacts(user_id, is_active);

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint emergency_alerts_resolution check (resolved_at is null or status = 'resolved')
);

create index if not exists emergency_alerts_user_created_idx on public.emergency_alerts(user_id, created_at desc);
create index if not exists emergency_alerts_status_idx on public.emergency_alerts(status);

create table if not exists public.location_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  sharing boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint location_shares_coordinates check (
    (latitude is null and longitude is null) or (latitude is not null and longitude is not null)
  )
);

create index if not exists location_shares_sharing_idx on public.location_shares(user_id, sharing);

create or replace function public.set_safety_updated_at()
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

drop trigger if exists trusted_contacts_set_updated_at on public.trusted_contacts;
create trigger trusted_contacts_set_updated_at
before update on public.trusted_contacts
for each row execute function public.set_safety_updated_at();

drop trigger if exists location_shares_set_updated_at on public.location_shares;
create trigger location_shares_set_updated_at
before update on public.location_shares
for each row execute function public.set_safety_updated_at();

alter table public.trusted_contacts enable row level security;
alter table public.emergency_alerts enable row level security;
alter table public.location_shares enable row level security;

drop policy if exists "trusted_contacts_select_own" on public.trusted_contacts;
create policy "trusted_contacts_select_own"
on public.trusted_contacts for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "trusted_contacts_insert_own" on public.trusted_contacts;
create policy "trusted_contacts_insert_own"
on public.trusted_contacts for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "trusted_contacts_update_own" on public.trusted_contacts;
create policy "trusted_contacts_update_own"
on public.trusted_contacts for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "trusted_contacts_delete_own" on public.trusted_contacts;
create policy "trusted_contacts_delete_own"
on public.trusted_contacts for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "emergency_alerts_select_own" on public.emergency_alerts;
create policy "emergency_alerts_select_own"
on public.emergency_alerts for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "emergency_alerts_insert_own" on public.emergency_alerts;
create policy "emergency_alerts_insert_own"
on public.emergency_alerts for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "emergency_alerts_update_own" on public.emergency_alerts;

drop policy if exists "location_shares_select_own" on public.location_shares;
create policy "location_shares_select_own"
on public.location_shares for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "location_shares_insert_own" on public.location_shares;
create policy "location_shares_insert_own"
on public.location_shares for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "location_shares_update_own" on public.location_shares;
create policy "location_shares_update_own"
on public.location_shares for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "location_shares_delete_own" on public.location_shares;
create policy "location_shares_delete_own"
on public.location_shares for delete to authenticated
using (auth.uid() = user_id);
