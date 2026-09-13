begin;

create index if not exists tournament_registrations_boat_id_idx
  on public.tournament_registrations (boat_id);

-- The officials' SELECT policy already includes administrators because
-- has_app_role('weighmaster') treats administrators as senior officials.
-- Split administrator writes by command so SELECT has one permissive policy.
drop policy if exists "Admins can manage tournament registrations"
  on public.tournament_registrations;

create policy "Admins can create tournament registrations"
on public.tournament_registrations
for insert
to authenticated
with check ((select public.has_app_role('admin')));

create policy "Admins can update tournament registrations"
on public.tournament_registrations
for update
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create policy "Admins can delete tournament registrations"
on public.tournament_registrations
for delete
to authenticated
using ((select public.has_app_role('admin')));

drop policy if exists "Admins can manage registration participants"
  on public.tournament_registration_participants;

create policy "Admins can create registration participants"
on public.tournament_registration_participants
for insert
to authenticated
with check ((select public.has_app_role('admin')));

create policy "Admins can update registration participants"
on public.tournament_registration_participants
for update
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create policy "Admins can delete registration participants"
on public.tournament_registration_participants
for delete
to authenticated
using ((select public.has_app_role('admin')));

commit;
