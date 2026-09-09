-- Allow signed-in administrators to list Auth accounts and assign roles
-- without relying on a long-lived service credential in the application.

create or replace function private.admin_get_auth_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text
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
  select
    users.id,
    users.email::text,
    users.created_at,
    users.last_sign_in_at,
    user_roles.role
  from auth.users as users
  left join public.user_roles as user_roles on user_roles.user_id = users.id
  order by users.created_at desc;
end;
$$;

create or replace function public.admin_get_auth_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_get_auth_users();
$$;

create or replace function private.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_app_role('admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_role not in ('member', 'boat', 'weighmaster', 'admin') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id) do update
  set role = excluded.role, updated_at = now();
end;
$$;

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.admin_set_user_role(p_user_id, p_role);
$$;

revoke all on function private.admin_get_auth_users() from public;
revoke all on function private.admin_set_user_role(uuid, text) from public;
revoke all on function public.admin_get_auth_users() from public;
revoke all on function public.admin_set_user_role(uuid, text) from public;

grant usage on schema private to authenticated;
grant execute on function private.admin_get_auth_users() to authenticated;
grant execute on function private.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_get_auth_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
