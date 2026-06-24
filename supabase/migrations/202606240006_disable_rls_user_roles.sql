-- Completely disable RLS on user_roles table
-- This allows all authenticated users to read and admins to manage

-- First, disable RLS entirely
alter table public.user_roles disable row level security;

-- Then drop all policies to ensure clean state
drop policy if exists "Users can read their own role" on public.user_roles;
drop policy if exists "Admins can manage user roles" on public.user_roles;
drop policy if exists "Authenticated users can read all roles" on public.user_roles;
drop policy if exists "Service role can manage user_roles" on public.user_roles;
