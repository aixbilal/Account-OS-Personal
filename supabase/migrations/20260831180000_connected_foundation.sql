-- V2 connected foundation: one encrypted vault envelope per authenticated owner.
-- Sensitive vault data exists only inside encrypted_payload.
create table public.devices (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null check (char_length(device_name) between 1 and 120),
  platform text not null check (char_length(platform) between 1 and 80),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index devices_owner_id_idx on public.devices(owner_id);
create unique index devices_id_owner_id_key on public.devices(id, owner_id);

create table public.vault_sync (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  encrypted_payload text not null,
  format_version smallint not null check (format_version = 1),
  writer_device_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  , foreign key (writer_device_id, owner_id) references public.devices(id, owner_id)
);

alter table public.devices enable row level security;
alter table public.vault_sync enable row level security;

create policy "Owners manage their devices" on public.devices
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners read their encrypted vault" on public.vault_sync
  for select using ((select auth.uid()) = owner_id);

create policy "Owners create their encrypted vault" on public.vault_sync
  for insert with check ((select auth.uid()) = owner_id);

create policy "Owners update their encrypted vault" on public.vault_sync
  for update using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Optimistic concurrency: a stale device receives conflict rather than overwriting.
create or replace function public.write_vault_sync(
  expected_revision bigint,
  payload text,
  device_id uuid
)
returns table(status text, revision bigint)
language plpgsql
security invoker
set search_path = public
as $$
declare current_revision bigint;
begin
  if not exists (
    select 1 from public.devices
    where id = device_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Unknown device';
  end if;

  select vault_sync.revision into current_revision
  from public.vault_sync
  where owner_id = (select auth.uid());

  if not found then
    if expected_revision <> 0 then
      return query select 'conflict'::text, 0::bigint;
      return;
    end if;
    insert into public.vault_sync (owner_id, revision, encrypted_payload, format_version, writer_device_id)
    values ((select auth.uid()), 1, payload, 1, device_id);
    return query select 'synced'::text, 1::bigint;
    return;
  end if;

  if current_revision <> expected_revision then
    return query select 'conflict'::text, current_revision;
    return;
  end if;

  update public.vault_sync
  set revision = current_revision + 1,
      encrypted_payload = payload,
      writer_device_id = device_id,
      updated_at = now()
  where owner_id = (select auth.uid());
  update public.devices set last_seen_at = now() where id = device_id;
  return query select 'synced'::text, current_revision + 1;
end;
$$;

revoke all on function public.write_vault_sync(bigint, text, uuid) from public;
grant execute on function public.write_vault_sync(bigint, text, uuid) to authenticated;
