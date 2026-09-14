begin;

create index if not exists angler_awards_angler_id_idx
  on public.angler_awards (angler_id);
create index if not exists boat_awards_boat_id_idx
  on public.boat_awards (boat_id);
create index if not exists boat_owners_angler_id_idx
  on public.boat_owners (angler_id);
create index if not exists event_rosters_event_id_idx
  on public.event_rosters (event_id);
create index if not exists event_rosters_boat_id_idx
  on public.event_rosters (boat_id);
create index if not exists event_rosters_angler_id_idx
  on public.event_rosters (angler_id);

-- Public SELECT already grants administrators the same readable rows on these
-- public-reference tables. Split the administrator ALL policies into write-only
-- policies so authenticated reads evaluate only one permissive SELECT policy.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'angler_awards',
    'anglers',
    'boat_awards',
    'boat_owners',
    'boats',
    'event_rosters',
    'events',
    'historical_boat_standings',
    'line_class_multipliers',
    'seasons',
    'species'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      'Admins can manage records',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.has_app_role(''admin'')))',
      'Admins can insert records',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.has_app_role(''admin''))) with check ((select public.has_app_role(''admin'')))',
      'Admins can update records',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.has_app_role(''admin'')))',
      'Admins can delete records',
      table_name
    );
  end loop;
end
$$;

-- Keep exactly the existing catch capabilities while collapsing each command
-- to one permissive policy. has_app_role('weighmaster') includes administrators.
drop policy if exists "Admins can manage records" on public.catches;
drop policy if exists "Public can read approved catches" on public.catches;
drop policy if exists "Weighmasters can view all catches" on public.catches;
drop policy if exists "Weighmasters can create pending catches" on public.catches;

create policy "Published catches or officials can read"
on public.catches
for select
to anon, authenticated
using (
  status = 'approved'
  or (select public.has_app_role('weighmaster'))
);

create policy "Authorized catch submission"
on public.catches
for insert
to authenticated
with check (
  (select public.has_app_role('admin'))
  or (
    (select public.has_app_role('weighmaster'))
    and status = 'pending'
  )
);

-- Anonymous/authenticated submissions remain restricted to new requests, while
-- administrators retain their prior ability to insert any valid workflow state.
drop policy if exists "Admins can manage boat profile requests"
  on public.boat_profile_requests;
drop policy if exists "Public can submit boat profile requests"
  on public.boat_profile_requests;

create policy "Authorized boat profile request submission"
on public.boat_profile_requests
for insert
to anon, authenticated
with check (
  status = 'new'
  or (select public.has_app_role('admin'))
);

create policy "Admins can read boat profile requests"
on public.boat_profile_requests
for select
to authenticated
using ((select public.has_app_role('admin')));

create policy "Admins can update boat profile requests"
on public.boat_profile_requests
for update
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create policy "Admins can delete boat profile requests"
on public.boat_profile_requests
for delete
to authenticated
using ((select public.has_app_role('admin')));

-- Users retain self-read access and administrators retain full role management.
drop policy if exists "Admins can manage user roles" on public.user_roles;
drop policy if exists "Users can read their own role" on public.user_roles;

create policy "Authorized role read"
on public.user_roles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select public.has_app_role('admin'))
);

create policy "Admins can insert user roles"
on public.user_roles
for insert
to authenticated
with check ((select public.has_app_role('admin')));

create policy "Admins can update user roles"
on public.user_roles
for update
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create policy "Admins can delete user roles"
on public.user_roles
for delete
to authenticated
using ((select public.has_app_role('admin')));

commit;
