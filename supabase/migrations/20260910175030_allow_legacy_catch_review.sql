create or replace function public.enforce_catch_event_workflow()
returns trigger
language plpgsql
set search_path = ''
as $function$
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
      or (
        new.status = 'approved'
        and new.status is distinct from old.status
      );
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

    if (new.catch_datetime at time zone 'America/Chicago')::date < selected_event.start_date
       or (new.catch_datetime at time zone 'America/Chicago')::date > coalesce(selected_event.end_date, selected_event.start_date) then
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
$function$;

revoke all on function public.enforce_catch_event_workflow() from public;
