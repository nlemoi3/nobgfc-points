-- Support multiple owners per boat by linking boats and anglers.

create table if not exists public.boat_owners (
  boat_id bigint not null references public.boats(id) on delete cascade,
  angler_id bigint not null references public.anglers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (boat_id, angler_id)
);

grant select on public.boat_owners to anon, authenticated;
grant insert, update, delete on public.boat_owners to authenticated;

alter table public.boat_owners enable row level security;

drop policy if exists "Public read access" on public.boat_owners;
create policy "Public read access"
on public.boat_owners
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage records" on public.boat_owners;
create policy "Admins can manage records"
on public.boat_owners
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));
