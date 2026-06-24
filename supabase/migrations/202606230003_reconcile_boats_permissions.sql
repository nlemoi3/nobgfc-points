-- Reconcile boats permissions and policies to match production fixes.
-- Safe to run multiple times.

alter table if exists public.boats enable row level security;

-- Ensure authenticated users can read boats and admins can write (RLS still applies).
grant select on public.boats to anon, authenticated;
grant insert, update, delete on public.boats to authenticated;

-- If boats.id uses a sequence, allow authenticated inserts to read next values.
do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.boats', 'id') into seq_name;
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to authenticated', seq_name);
  end if;
end
$$;

-- Keep public read and admin manage policies present and consistent.
drop policy if exists "Public read access" on public.boats;
create policy "Public read access"
on public.boats
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage records" on public.boats;
create policy "Admins can manage records"
on public.boats
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));

-- Re-assert boat_owners grants in case environments missed earlier migration.
grant select on public.boat_owners to anon, authenticated;
grant insert, update, delete on public.boat_owners to authenticated;
