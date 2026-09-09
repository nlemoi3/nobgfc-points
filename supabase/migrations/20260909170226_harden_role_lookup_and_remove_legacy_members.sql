-- Keep the privileged role lookup outside the exposed Data API schema.
-- The public function remains SECURITY INVOKER so existing RLS policies do
-- not need to change, while the private implementation performs the minimal
-- RLS-bypassing lookup required to avoid policy recursion on user_roles.

create schema if not exists private;

create or replace function private.has_app_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and (role = required_role or role = 'admin')
    );
$$;

revoke all on function private.has_app_role(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_app_role(text) to authenticated;

create or replace function public.has_app_role(required_role text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_app_role(required_role);
$$;

revoke all on function public.has_app_role(text) from public;
grant execute on function public.has_app_role(text) to authenticated;

-- This legacy table is empty and unused. Account management is backed by
-- auth.users plus public.user_roles, not public.members.
drop table public.members;
