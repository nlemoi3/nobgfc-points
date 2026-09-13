begin;

create or replace function private.admin_apply_boat_profile_request(
  p_request_id bigint,
  p_boat_id bigint default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_record public.boat_profile_requests%rowtype;
  saved_boat_id bigint;
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into request_record
  from public.boat_profile_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Boat profile request not found' using errcode = 'P0002';
  end if;

  if request_record.status not in ('new', 'reviewed') then
    raise exception 'Only new or reviewed requests can be applied'
      using errcode = '23514';
  end if;

  if p_boat_id is null then
    insert into public.boats (
      name, owner_name, active, make, model, year, length_feet, home_port,
      website_url, facebook_url, instagram_url, youtube_url, notes,
      captain_name, captain_email, profile_status
    ) values (
      request_record.boat_name, null, true, request_record.make,
      request_record.model, request_record.year, request_record.length_feet,
      request_record.home_port, request_record.website_url,
      request_record.facebook_url, request_record.instagram_url,
      request_record.youtube_url, request_record.notes,
      request_record.contact_name, request_record.contact_email, 'approved'
    )
    returning id into saved_boat_id;
  else
    update public.boats
    set make = nullif(request_record.make, ''),
        model = nullif(request_record.model, ''),
        year = request_record.year,
        length_feet = request_record.length_feet,
        home_port = nullif(request_record.home_port, ''),
        website_url = nullif(request_record.website_url, ''),
        facebook_url = nullif(request_record.facebook_url, ''),
        instagram_url = nullif(request_record.instagram_url, ''),
        youtube_url = nullif(request_record.youtube_url, ''),
        notes = nullif(request_record.notes, ''),
        profile_status = 'approved'
    where id = p_boat_id
    returning id into saved_boat_id;

    if saved_boat_id is null then
      raise exception 'Boat not found' using errcode = 'P0002';
    end if;
  end if;

  update public.boat_profile_requests
  set status = 'applied'
  where id = p_request_id;

  return saved_boat_id;
end;
$$;

create or replace function public.admin_apply_boat_profile_request(
  p_request_id bigint,
  p_boat_id bigint default null
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select private.admin_apply_boat_profile_request(p_request_id, p_boat_id);
$$;

revoke all on function private.admin_apply_boat_profile_request(bigint, bigint)
  from public, anon;
revoke all on function public.admin_apply_boat_profile_request(bigint, bigint)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.admin_apply_boat_profile_request(bigint, bigint)
  to authenticated;
grant execute on function public.admin_apply_boat_profile_request(bigint, bigint)
  to authenticated;

commit;
