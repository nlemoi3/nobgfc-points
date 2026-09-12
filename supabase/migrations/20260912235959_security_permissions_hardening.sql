begin;

-- Public-schema objects start private. Each application privilege is granted
-- explicitly below, so future tables cannot inherit TRUNCATE or mutation
-- privileges before an RLS policy is designed for them.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

revoke all on table
  public.angler_awards,
  public.anglers,
  public.boat_awards,
  public.boat_owners,
  public.boat_profile_requests,
  public.boats,
  public.catch_audit_log,
  public.catches,
  public.event_rosters,
  public.events,
  public.historical_boat_standings,
  public.line_class_multipliers,
  public.seasons,
  public.species,
  public.user_roles
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- Public competition data. RLS still limits catches to approved rows.
grant select on table
  public.angler_awards,
  public.boat_awards,
  public.boat_owners,
  public.catches,
  public.event_rosters,
  public.events,
  public.historical_boat_standings,
  public.line_class_multipliers,
  public.seasons,
  public.species
to anon, authenticated;

-- Public profiles deliberately exclude contact details, dates of birth,
-- member IDs, and linked Auth user IDs.
grant select (
  id, first_name, last_name, is_member, is_youth, active, created_at,
  photo_url, biography
) on table public.anglers to anon, authenticated;

grant select (
  id, name, owner_name, active, created_at, make, model, year, length_feet,
  home_port, photo_url, logo_url, website_url, facebook_url, instagram_url,
  youtube_url, notes, captain_name, profile_status
) on table public.boats to anon, authenticated;

-- Anonymous and signed-in visitors may submit a request, but cannot choose its
-- workflow status or read another submitter's contact information.
grant insert (
  boat_name, contact_name, contact_email, make, model, year, length_feet,
  home_port, website_url, facebook_url, instagram_url, youtube_url, notes
) on table public.boat_profile_requests to anon, authenticated;
grant usage, select on sequence public.boat_profile_requests_id_seq
  to anon, authenticated;

alter table public.boat_profile_requests
  alter column status set default 'new',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'boat_profile_requests_status_allowed'
      and conrelid = 'public.boat_profile_requests'::regclass
  ) then
    alter table public.boat_profile_requests
      add constraint boat_profile_requests_status_allowed
      check (status in ('new', 'reviewed', 'applied', 'rejected'));
  end if;
end
$$;

drop policy if exists "Public can submit boat profile requests"
  on public.boat_profile_requests;
create policy "Public can submit boat profile requests"
on public.boat_profile_requests
for insert
to anon, authenticated
with check (status = 'new');

-- A weighmaster may submit a catch only into the review queue. Admins retain
-- their separate all-operations policy for recovery and data stewardship.
drop policy if exists "Weighmasters can create catches" on public.catches;
create policy "Weighmasters can create pending catches"
on public.catches
for insert
to authenticated
with check (
  (select public.has_app_role('weighmaster'))
  and status = 'pending'
);

-- Authenticated table capabilities are the minimum needed by the current app;
-- RLS decides which application roles may act on each row.
grant select, insert, update, delete on table public.catches to authenticated;
grant select, insert, update, delete on table
  public.angler_awards,
  public.boat_awards,
  public.boat_owners,
  public.event_rosters,
  public.events,
  public.historical_boat_standings,
  public.line_class_multipliers,
  public.seasons,
  public.species
to authenticated;
grant select on table public.catch_audit_log to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;

grant usage, select on sequence
  public.angler_awards_id_seq,
  public.boat_awards_id_seq,
  public.catches_id_seq,
  public.event_rosters_id_seq,
  public.events_id_seq,
  public.historical_boat_standings_id_seq,
  public.seasons_id_seq,
  public.species_id_seq
to authenticated;

commit;
