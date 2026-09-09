create or replace function public.replace_season_champions(
  p_year integer,
  p_boat_id bigint default null,
  p_angler_id bigint default null,
  p_youth_id bigint default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.has_app_role('admin') then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_year < 1900 or p_year > 2100 then
    raise exception 'Invalid season year' using errcode = '22023';
  end if;

  delete from public.boat_awards
  where award_year = p_year
    and award_name = 'Boat Champion';

  delete from public.angler_awards
  where award_year = p_year
    and award_name in ('Angling Champion', 'Dutch Prager Youth Champion');

  if p_boat_id is not null then
    insert into public.boat_awards (boat_id, award_name, award_year)
    values (p_boat_id, 'Boat Champion', p_year);
  end if;

  if p_angler_id is not null then
    insert into public.angler_awards (angler_id, award_name, award_year)
    values (p_angler_id, 'Angling Champion', p_year);
  end if;

  if p_youth_id is not null then
    insert into public.angler_awards (angler_id, award_name, award_year)
    values (p_youth_id, 'Dutch Prager Youth Champion', p_year);
  end if;
end;
$$;

revoke all on function public.replace_season_champions(integer, bigint, bigint, bigint)
  from public, anon;
grant execute on function public.replace_season_champions(integer, bigint, bigint, bigint)
  to authenticated;

comment on function public.replace_season_champions(integer, bigint, bigint, bigint)
  is 'Atomically replaces generated season champions; callable only by an authenticated club admin.';
