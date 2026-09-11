create or replace function private.admin_get_boat_profile_requests(
  p_id bigint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(to_jsonb(request) order by request.created_at desc)
      from public.boat_profile_requests as request
      where p_id is null or request.id = p_id
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.admin_get_boat_profile_requests(
  p_id bigint default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.admin_get_boat_profile_requests(p_id);
$$;

create or replace function private.admin_update_boat_profile_request_status(
  p_id bigint,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_status not in ('new', 'reviewed', 'applied', 'rejected') then
    raise exception 'Invalid request status' using errcode = '22023';
  end if;

  update public.boat_profile_requests
  set status = p_status
  where id = p_id;

  return found;
end;
$$;

create or replace function public.admin_update_boat_profile_request_status(
  p_id bigint,
  p_status text
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.admin_update_boat_profile_request_status(p_id, p_status);
$$;

revoke all on function private.admin_get_boat_profile_requests(bigint) from public, anon;
revoke all on function private.admin_update_boat_profile_request_status(bigint, text) from public, anon;
revoke all on function public.admin_get_boat_profile_requests(bigint) from public, anon;
revoke all on function public.admin_update_boat_profile_request_status(bigint, text) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.admin_get_boat_profile_requests(bigint) to authenticated;
grant execute on function private.admin_update_boat_profile_request_status(bigint, text) to authenticated;
grant execute on function public.admin_get_boat_profile_requests(bigint) to authenticated;
grant execute on function public.admin_update_boat_profile_request_status(bigint, text) to authenticated;
