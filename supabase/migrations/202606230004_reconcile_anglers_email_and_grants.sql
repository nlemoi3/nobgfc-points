-- Reconcile anglers schema/grants with production hotfixes.
-- Safe to run multiple times.

alter table if exists public.anglers
  add column if not exists email text;

alter table if exists public.anglers
  add column if not exists phone_number text;

alter table if exists public.anglers enable row level security;

grant select on public.anglers to anon, authenticated;
grant insert, update, delete on public.anglers to authenticated;

-- If anglers.id uses a sequence, allow authenticated inserts to get ids.
do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.anglers', 'id') into seq_name;
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to authenticated', seq_name);
  end if;
end
$$;

-- Re-assert expected policy shape.
drop policy if exists "Public read access" on public.anglers;
create policy "Public read access"
on public.anglers
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage records" on public.anglers;
create policy "Admins can manage records"
on public.anglers
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));
