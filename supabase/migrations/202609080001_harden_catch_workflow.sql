begin;

-- New submissions must be reviewed before they affect public standings.
alter table public.catches alter column status set default 'pending';

-- These fields are required by every supported catch workflow. Existing rows
-- were audited before this migration and contain no null values.
alter table public.catches alter column event_id set not null;
alter table public.catches alter column boat_id set not null;
alter table public.catches alter column angler_id set not null;
alter table public.catches alter column species_id set not null;
alter table public.catches alter column line_class set not null;
alter table public.catches alter column released set not null;
alter table public.catches alter column tagged set not null;
alter table public.catches alter column points_awarded set not null;
alter table public.catches alter column catch_datetime set not null;
alter table public.catches alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'catches_status_allowed'
      and conrelid = 'public.catches'::regclass
  ) then
    alter table public.catches
      add constraint catches_status_allowed
      check (status in ('pending', 'approved', 'rejected')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'catches_line_class_allowed'
      and conrelid = 'public.catches'::regclass
  ) then
    alter table public.catches
      add constraint catches_line_class_allowed
      check (line_class in (130, 80, 50, 30, 20, 16, 12, 8, 4, 2)) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'catches_tag_requires_release'
      and conrelid = 'public.catches'::regclass
  ) then
    alter table public.catches
      add constraint catches_tag_requires_release
      check (not tagged or released) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'catches_weight_required_when_weighed'
      and conrelid = 'public.catches'::regclass
  ) then
    alter table public.catches
      add constraint catches_weight_required_when_weighed
      check (released or (weight is not null and weight > 0)) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'events_status_allowed'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_status_allowed
      check (status in ('scheduled', 'rescheduled', 'cancelled', 'locked', 'completed')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'events_dates_in_order'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_dates_in_order
      check (end_date >= start_date) not valid;
  end if;
end
$$;

alter table public.catches validate constraint catches_status_allowed;
alter table public.catches validate constraint catches_line_class_allowed;
alter table public.catches validate constraint catches_tag_requires_release;
alter table public.catches validate constraint catches_weight_required_when_weighed;
alter table public.events validate constraint events_status_allowed;
alter table public.events validate constraint events_dates_in_order;

-- Support the event review/lock checks and the standings grouping queries.
create index if not exists catches_event_id_idx on public.catches (event_id);
create index if not exists catches_boat_id_idx on public.catches (boat_id);
create index if not exists catches_angler_id_idx on public.catches (angler_id);
create index if not exists catches_species_id_idx on public.catches (species_id);
create index if not exists catches_status_idx on public.catches (status);
create index if not exists catches_catch_datetime_idx on public.catches (catch_datetime);

-- Keep pending and rejected submissions out of the public Data API while
-- allowing weighmasters and admins to review them through authenticated pages.
drop policy if exists "Public read access" on public.catches;
drop policy if exists "Public can read approved catches" on public.catches;
drop policy if exists "Weighmasters can view all catches" on public.catches;

create policy "Public can read approved catches"
on public.catches
for select
to anon, authenticated
using (status = 'approved');

create policy "Weighmasters can view all catches"
on public.catches
for select
to authenticated
using ((select public.has_app_role('weighmaster')));

create or replace function public.enforce_catch_event_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  selected_event public.events%rowtype;
  species_minimum numeric;
  validate_assignment boolean;
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

  if tg_op = 'INSERT' then
    validate_assignment := true;
    validate_eligibility := new.status = 'approved';
  else
    validate_assignment :=
      new.event_id is distinct from old.event_id
      or new.catch_datetime is distinct from old.catch_datetime
      or new.status is distinct from old.status;
    validate_eligibility :=
      new.status = 'approved'
      and (
        new.status is distinct from old.status
        or new.species_id is distinct from old.species_id
        or new.weight is distinct from old.weight
        or new.released is distinct from old.released
      );
  end if;

  if validate_assignment then
    if selected_event.status = 'cancelled' then
      raise exception 'Catches cannot be assigned to a cancelled event.'
        using errcode = '23514';
    end if;

    if new.catch_datetime::date < selected_event.start_date
       or new.catch_datetime::date > selected_event.end_date then
      raise exception 'Catch date must fall within the selected event dates.'
        using errcode = '23514';
    end if;
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
  end if;

  return new;
end
$$;

revoke all on function public.enforce_catch_event_workflow() from public;

drop trigger if exists enforce_catch_event_workflow on public.catches;
create trigger enforce_catch_event_workflow
before insert or update or delete on public.catches
for each row execute function public.enforce_catch_event_workflow();

create or replace function public.enforce_event_lock_readiness()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'locked'
     and new.status is distinct from old.status
     and exists (
       select 1
       from public.catches
       where event_id = new.id
         and status = 'pending'
     ) then
    raise exception 'Review every pending catch before locking this event.'
      using errcode = '23514';
  end if;

  return new;
end
$$;

revoke all on function public.enforce_event_lock_readiness() from public;

drop trigger if exists enforce_event_lock_readiness on public.events;
create trigger enforce_event_lock_readiness
before update of status on public.events
for each row execute function public.enforce_event_lock_readiness();

commit;
