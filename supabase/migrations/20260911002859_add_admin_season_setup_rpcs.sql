create or replace function private.admin_get_seasons()
returns table (
  id bigint,
  year integer,
  active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select season.id, season.year, season.active, season.created_at
  from public.seasons as season
  order by season.year desc;
end;
$$;

create or replace function public.admin_get_seasons()
returns table (
  id bigint,
  year integer,
  active boolean,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_get_seasons();
$$;

create or replace function private.admin_create_season(p_year integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_id bigint;
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_year < 2000 or p_year > 2100 then
    raise exception 'Season year is outside the supported range'
      using errcode = '22023';
  end if;

  insert into public.seasons (year, active)
  values (p_year, false)
  on conflict (year) do update set year = excluded.year
  returning id into created_id;

  return created_id;
end;
$$;

create or replace function public.admin_create_season(p_year integer)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select private.admin_create_season(p_year);
$$;

revoke all on function private.admin_get_seasons() from public, anon;
revoke all on function private.admin_create_season(integer) from public, anon;
revoke all on function public.admin_get_seasons() from public, anon;
revoke all on function public.admin_create_season(integer) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.admin_get_seasons() to authenticated;
grant execute on function private.admin_create_season(integer) to authenticated;
grant execute on function public.admin_get_seasons() to authenticated;
grant execute on function public.admin_create_season(integer) to authenticated;
