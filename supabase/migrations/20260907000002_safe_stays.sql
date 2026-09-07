-- Phase 8: authenticated Safe Stay records with explicit status.

create table if not exists public.safe_stays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stay_name text not null check (char_length(btrim(stay_name)) between 1 and 160),
  address text check (address is null or char_length(btrim(address)) <= 300),
  check_in timestamptz not null,
  check_out timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint safe_stays_date_range check (check_out >= check_in)
);

create index if not exists safe_stays_user_created_idx on public.safe_stays(user_id, created_at desc);
create index if not exists safe_stays_user_status_idx on public.safe_stays(user_id, status);

create or replace function public.set_safe_stay_updated_at()
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

drop trigger if exists safe_stays_set_updated_at on public.safe_stays;
create trigger safe_stays_set_updated_at
before update on public.safe_stays
for each row execute function public.set_safe_stay_updated_at();

alter table public.safe_stays enable row level security;

drop policy if exists "safe_stays_select_own" on public.safe_stays;
create policy "safe_stays_select_own"
on public.safe_stays for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "safe_stays_insert_own" on public.safe_stays;
create policy "safe_stays_insert_own"
on public.safe_stays for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "safe_stays_update_own" on public.safe_stays;
create policy "safe_stays_update_own"
on public.safe_stays for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "safe_stays_delete_own" on public.safe_stays;
create policy "safe_stays_delete_own"
on public.safe_stays for delete to authenticated
using (auth.uid() = user_id);
