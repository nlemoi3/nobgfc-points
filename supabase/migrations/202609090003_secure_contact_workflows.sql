create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.claim_angler_profile()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.anglers;
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into claimed
  from public.anglers
  where user_id = auth.uid()
  limit 1;

  if claimed.id is null and caller_email <> '' then
    update public.anglers
    set user_id = auth.uid()
    where id = (
      select id
      from public.anglers
      where user_id is null
        and lower(email) = caller_email
      order by id
      limit 1
    )
    returning * into claimed;
  end if;

  return case when claimed.id is null then null else to_jsonb(claimed) end;
end;
$$;

create or replace function private.update_current_angler_profile(
  p_email text,
  p_phone_number text,
  p_date_of_birth date,
  p_address text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.anglers
  set email = nullif(trim(p_email), ''),
      phone_number = nullif(trim(p_phone_number), ''),
      date_of_birth = p_date_of_birth,
      address = nullif(trim(p_address), '')
  where user_id = auth.uid()
  returning id into updated_id;

  return updated_id;
end;
$$;

create or replace function private.admin_get_anglers(p_id bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_app_role('admin') then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(to_jsonb(a) order by a.last_name, a.first_name, a.id)
      from public.anglers a
      where p_id is null or a.id = p_id
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function private.admin_upsert_angler(
  p_id bigint,
  p_record jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id bigint;
begin
  if not public.has_app_role('admin') then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.anglers (
      first_name, last_name, is_member, is_youth, active, date_of_birth,
      photo_url, biography, member_id, user_id, phone_number, email, address
    ) values (
      coalesce(p_record ->> 'first_name', ''),
      coalesce(p_record ->> 'last_name', ''),
      coalesce((p_record ->> 'is_member')::boolean, false),
      coalesce((p_record ->> 'is_youth')::boolean, false),
      coalesce((p_record ->> 'active')::boolean, true),
      nullif(p_record ->> 'date_of_birth', '')::date,
      nullif(p_record ->> 'photo_url', ''),
      nullif(p_record ->> 'biography', ''),
      nullif(p_record ->> 'member_id', '')::bigint,
      nullif(p_record ->> 'user_id', '')::uuid,
      nullif(p_record ->> 'phone_number', ''),
      nullif(p_record ->> 'email', ''),
      nullif(p_record ->> 'address', '')
    )
    returning id into saved_id;
  else
    update public.anglers
    set first_name = coalesce(p_record ->> 'first_name', ''),
        last_name = coalesce(p_record ->> 'last_name', ''),
        is_member = coalesce((p_record ->> 'is_member')::boolean, false),
        is_youth = coalesce((p_record ->> 'is_youth')::boolean, false),
        active = case
          when p_record ? 'active' then coalesce((p_record ->> 'active')::boolean, true)
          else active
        end,
        date_of_birth = nullif(p_record ->> 'date_of_birth', '')::date,
        photo_url = nullif(p_record ->> 'photo_url', ''),
        biography = nullif(p_record ->> 'biography', ''),
        member_id = case
          when p_record ? 'member_id' then nullif(p_record ->> 'member_id', '')::bigint
          else member_id
        end,
        user_id = nullif(p_record ->> 'user_id', '')::uuid,
        phone_number = nullif(p_record ->> 'phone_number', ''),
        email = nullif(p_record ->> 'email', ''),
        address = nullif(p_record ->> 'address', '')
    where id = p_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

create or replace function private.admin_get_boats(p_id bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_app_role('admin') then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(to_jsonb(b) order by b.name, b.id)
      from public.boats b
      where p_id is null or b.id = p_id
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function private.admin_upsert_boat(
  p_id bigint,
  p_record jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id bigint;
begin
  if not public.has_app_role('admin') then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.boats (
      name, owner_name, active, make, model, year, length_feet, home_port,
      photo_url, logo_url, website_url, facebook_url, instagram_url,
      youtube_url, notes, captain_name, captain_email, owner_email,
      profile_status, user_id
    ) values (
      coalesce(p_record ->> 'name', ''),
      nullif(p_record ->> 'owner_name', ''),
      coalesce((p_record ->> 'active')::boolean, true),
      nullif(p_record ->> 'make', ''),
      nullif(p_record ->> 'model', ''),
      nullif(p_record ->> 'year', '')::integer,
      nullif(p_record ->> 'length_feet', '')::numeric,
      nullif(p_record ->> 'home_port', ''),
      nullif(p_record ->> 'photo_url', ''),
      nullif(p_record ->> 'logo_url', ''),
      nullif(p_record ->> 'website_url', ''),
      nullif(p_record ->> 'facebook_url', ''),
      nullif(p_record ->> 'instagram_url', ''),
      nullif(p_record ->> 'youtube_url', ''),
      nullif(p_record ->> 'notes', ''),
      nullif(p_record ->> 'captain_name', ''),
      nullif(p_record ->> 'captain_email', ''),
      nullif(p_record ->> 'owner_email', ''),
      coalesce(nullif(p_record ->> 'profile_status', ''), 'approved'),
      nullif(p_record ->> 'user_id', '')::uuid
    )
    returning id into saved_id;
  else
    update public.boats
    set name = coalesce(p_record ->> 'name', name),
        owner_name = nullif(p_record ->> 'owner_name', ''),
        active = coalesce((p_record ->> 'active')::boolean, active),
        make = nullif(p_record ->> 'make', ''),
        model = nullif(p_record ->> 'model', ''),
        year = nullif(p_record ->> 'year', '')::integer,
        length_feet = nullif(p_record ->> 'length_feet', '')::numeric,
        home_port = nullif(p_record ->> 'home_port', ''),
        photo_url = nullif(p_record ->> 'photo_url', ''),
        logo_url = nullif(p_record ->> 'logo_url', ''),
        website_url = nullif(p_record ->> 'website_url', ''),
        facebook_url = nullif(p_record ->> 'facebook_url', ''),
        instagram_url = nullif(p_record ->> 'instagram_url', ''),
        youtube_url = nullif(p_record ->> 'youtube_url', ''),
        notes = nullif(p_record ->> 'notes', ''),
        captain_name = nullif(p_record ->> 'captain_name', ''),
        captain_email = nullif(p_record ->> 'captain_email', ''),
        owner_email = nullif(p_record ->> 'owner_email', ''),
        profile_status = coalesce(nullif(p_record ->> 'profile_status', ''), profile_status),
        user_id = case
          when p_record ? 'user_id' then nullif(p_record ->> 'user_id', '')::uuid
          else user_id
        end
    where id = p_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

create or replace function public.claim_angler_profile()
returns jsonb language sql security invoker set search_path = ''
as $$ select private.claim_angler_profile(); $$;

create or replace function public.update_current_angler_profile(
  p_email text, p_phone_number text, p_date_of_birth date, p_address text
)
returns bigint language sql security invoker set search_path = ''
as $$ select private.update_current_angler_profile(p_email, p_phone_number, p_date_of_birth, p_address); $$;

create or replace function public.admin_get_anglers(p_id bigint default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.admin_get_anglers(p_id); $$;

create or replace function public.admin_upsert_angler(p_id bigint, p_record jsonb)
returns bigint language sql security invoker set search_path = ''
as $$ select private.admin_upsert_angler(p_id, p_record); $$;

create or replace function public.admin_get_boats(p_id bigint default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.admin_get_boats(p_id); $$;

create or replace function public.admin_upsert_boat(p_id bigint, p_record jsonb)
returns bigint language sql security invoker set search_path = ''
as $$ select private.admin_upsert_boat(p_id, p_record); $$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

revoke all on function public.claim_angler_profile() from public, anon;
revoke all on function public.update_current_angler_profile(text, text, date, text) from public, anon;
revoke all on function public.admin_get_anglers(bigint) from public, anon;
revoke all on function public.admin_upsert_angler(bigint, jsonb) from public, anon;
revoke all on function public.admin_get_boats(bigint) from public, anon;
revoke all on function public.admin_upsert_boat(bigint, jsonb) from public, anon;

grant execute on function public.claim_angler_profile() to authenticated;
grant execute on function public.update_current_angler_profile(text, text, date, text) to authenticated;
grant execute on function public.admin_get_anglers(bigint) to authenticated;
grant execute on function public.admin_upsert_angler(bigint, jsonb) to authenticated;
grant execute on function public.admin_get_boats(bigint) to authenticated;
grant execute on function public.admin_upsert_boat(bigint, jsonb) to authenticated;
