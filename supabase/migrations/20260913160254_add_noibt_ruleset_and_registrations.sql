begin;

alter table public.events
  add column if not exists scoring_ruleset text not null default 'nobgfc_club';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_scoring_ruleset_allowed'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_scoring_ruleset_allowed
      check (scoring_ruleset in ('nobgfc_club', 'noibt_2026'));
  end if;
end
$$;

comment on column public.events.scoring_ruleset is
  'Versioned tournament scoring ruleset. Annual NOBGFC points remain stored separately on catches.points_awarded.';

update public.events
set scoring_ruleset = 'noibt_2026'
where name = 'New Orleans Invitational Billfish Tournament'
  and start_date >= date '2026-01-01'
  and start_date < date '2027-01-01';

create table if not exists public.tournament_registrations (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete restrict,
  boat_id bigint not null references public.boats(id) on delete restrict,
  status text not null default 'registered',
  registered_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  constraint tournament_registrations_event_boat_unique unique (event_id, boat_id),
  constraint tournament_registrations_status_allowed
    check (status in ('registered', 'withdrawn'))
);

create table if not exists public.tournament_registration_participants (
  id bigint generated always as identity primary key,
  registration_id bigint not null
    references public.tournament_registrations(id) on delete cascade,
  angler_id bigint not null references public.anglers(id) on delete restrict,
  participant_role text not null default 'angler',
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tournament_registration_participant_unique
    unique (registration_id, angler_id),
  constraint tournament_registration_participant_role_allowed
    check (participant_role in ('captain', 'mate', 'angler'))
);

comment on table public.tournament_registrations is
  'Tournament-specific boat/team registrations. This is separate from legacy event_rosters and is required only by an explicit event ruleset such as NOIBT.';
comment on table public.tournament_registration_participants is
  'Registered participants assigned to a tournament team/boat, including captains and mates who are registered as anglers.';

create index if not exists tournament_registrations_event_status_idx
  on public.tournament_registrations (event_id, status);
create index if not exists tournament_registration_participants_angler_idx
  on public.tournament_registration_participants (angler_id);

alter table public.tournament_registrations enable row level security;
alter table public.tournament_registration_participants enable row level security;

revoke all on table
  public.tournament_registrations,
  public.tournament_registration_participants
from public, anon, authenticated;
revoke all on sequence
  public.tournament_registrations_id_seq,
  public.tournament_registration_participants_id_seq
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.tournament_registrations,
  public.tournament_registration_participants
to authenticated;
grant usage, select on sequence
  public.tournament_registrations_id_seq,
  public.tournament_registration_participants_id_seq
to authenticated;

create policy "Competition officials can view tournament registrations"
on public.tournament_registrations
for select
to authenticated
using ((select public.has_app_role('weighmaster')));

create policy "Admins can manage tournament registrations"
on public.tournament_registrations
for all
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create policy "Competition officials can view registration participants"
on public.tournament_registration_participants
for select
to authenticated
using ((select public.has_app_role('weighmaster')));

create policy "Admins can manage registration participants"
on public.tournament_registration_participants
for all
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

create or replace function public.enforce_tournament_registration_ruleset()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from public.events
    where id = new.event_id
      and scoring_ruleset = 'noibt_2026'
  ) then
    raise exception 'Tournament registrations are only supported for an explicit registration-based ruleset.'
      using errcode = '23514';
  end if;

  return new;
end
$function$;

revoke all on function public.enforce_tournament_registration_ruleset()
  from public;

create trigger enforce_tournament_registration_ruleset
before insert or update of event_id on public.tournament_registrations
for each row execute function public.enforce_tournament_registration_ruleset();

create or replace function public.protect_event_scoring_ruleset()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.scoring_ruleset is distinct from old.scoring_ruleset
     and (
       exists (select 1 from public.catches where event_id = old.id)
       or exists (
         select 1 from public.tournament_registrations where event_id = old.id
       )
     ) then
    raise exception 'An event scoring ruleset cannot change after catches or registrations exist.'
      using errcode = '23514';
  end if;

  return new;
end
$function$;

revoke all on function public.protect_event_scoring_ruleset() from public;

create trigger protect_event_scoring_ruleset
before update of scoring_ruleset on public.events
for each row execute function public.protect_event_scoring_ruleset();

create or replace function public.enforce_catch_event_workflow()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  selected_event public.events%rowtype;
  species_minimum numeric;
  validate_eligibility boolean;
begin
  if tg_op = 'DELETE' then
    select * into selected_event
    from public.events
    where id = old.event_id;

    if selected_event.status = 'locked' then
      raise exception 'Catches in a locked event cannot be deleted.'
        using errcode = '23514';
    end if;

    return old;
  end if;

  select * into selected_event
  from public.events
  where id = new.event_id;

  if not found then
    raise exception 'The selected event does not exist.'
      using errcode = '23503';
  end if;

  if selected_event.status = 'locked' then
    raise exception 'Catches in a locked event cannot be changed.'
      using errcode = '23514';
  end if;

  if selected_event.status = 'cancelled' then
    raise exception 'Catches cannot be assigned to a cancelled event.'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    validate_eligibility := new.status = 'approved';
  else
    validate_eligibility :=
      new.status = 'approved'
      and (
        new.status is distinct from old.status
        or new.event_id is distinct from old.event_id
        or new.boat_id is distinct from old.boat_id
        or new.angler_id is distinct from old.angler_id
        or new.species_id is distinct from old.species_id
        or new.weight is distinct from old.weight
        or new.released is distinct from old.released
      );
  end if;

  if validate_eligibility then
    select minimum_weight into species_minimum
    from public.species
    where id = new.species_id;

    if not new.released
       and species_minimum is not null
       and new.weight < species_minimum then
      raise exception 'Catch does not meet the species minimum weight.'
        using errcode = '23514';
    end if;

    if selected_event.scoring_ruleset = 'noibt_2026'
       and not exists (
         select 1
         from public.tournament_registrations registration
         join public.tournament_registration_participants participant
           on participant.registration_id = registration.id
         where registration.event_id = new.event_id
           and registration.boat_id = new.boat_id
           and registration.status = 'registered'
           and participant.angler_id = new.angler_id
       ) then
      raise exception 'NOIBT catches require a registered team, boat, and angler before approval.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end
$function$;

revoke all on function public.enforce_catch_event_workflow() from public;

commit;
