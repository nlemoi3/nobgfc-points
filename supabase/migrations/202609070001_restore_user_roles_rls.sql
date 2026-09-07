-- Restore row-level security for application roles.
-- The previous migration disabled RLS, leaving role assignments writable by
-- every authenticated user. Keep the table privileges needed by the app, but
-- enforce row access through the policies below.

begin;

alter table public.user_roles enable row level security;

-- TRUNCATE is not governed by RLS. Remove broad administrative privileges and
-- grant only the row-level operations controlled by policies.
revoke all on table public.user_roles from anon, authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;

-- Limit the role helper to signed-in users. It is SECURITY DEFINER so it can
-- safely check the caller's own role without recursively invoking RLS.
revoke all on function public.has_app_role(text) from public;
grant execute on function public.has_app_role(text) to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
drop policy if exists "Admins can read all roles" on public.user_roles;
drop policy if exists "Admins can manage user roles" on public.user_roles;
drop policy if exists "Authenticated users can read all roles" on public.user_roles;
drop policy if exists "Service role can manage user_roles" on public.user_roles;

create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can manage user roles"
on public.user_roles
for all
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));

commit;
