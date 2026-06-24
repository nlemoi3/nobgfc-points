-- Fix RLS policy on user_roles to allow admins to manage roles
-- while allowing authenticated users to read all roles (for admin page)

-- Drop the restrictive "Admins can manage user roles" policy
drop policy if exists "Admins can manage user roles" on public.user_roles;

-- Create policy to allow admins to read, insert, update, and delete
create policy "Admins can manage user roles"
on public.user_roles
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));

-- Create policy to allow all authenticated users to read all roles (for admin UI)
-- This is needed for the admin members page to display pending accounts
create policy "Authenticated users can read all roles"
on public.user_roles
for select
to authenticated
using (true);

-- Manually set nlemoi3@lsu.edu as admin if not already set
-- First, find the user ID for nlemoi3@lsu.edu
do $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where email = 'nlemoi3@lsu.edu'
  limit 1;
  
  if admin_user_id is not null then
    insert into public.user_roles (user_id, role)
    values (admin_user_id, 'admin')
    on conflict (user_id) do update
    set role = 'admin', updated_at = now();
  end if;
end $$;
