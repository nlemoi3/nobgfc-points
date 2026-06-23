-- NOBGFC authentication roles and Row Level Security foundation.
-- Run this migration before relying on the application role checks.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (
    role in ('member', 'boat', 'weighmaster', 'admin')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

alter table if exists public.anglers
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

create or replace function public.has_app_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and (
        role = required_role
        or role = 'admin'
      )
  );
$$;

revoke all on function public.has_app_role(text) from public;
grant execute on function public.has_app_role(text) to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can manage user roles" on public.user_roles;
create policy "Admins can manage user roles"
on public.user_roles
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));

do $$
declare
  table_name text;
  policy_name text;
  public_tables text[] := array[
    'anglers',
    'angler_awards',
    'boats',
    'boat_awards',
    'catches',
    'events',
    'event_rosters',
    'historical_boat_standings',
    'line_class_multipliers',
    'species'
  ];
begin
  foreach table_name in array public_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);

      for policy_name in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = table_name
      loop
        execute format(
          'drop policy if exists %I on public.%I',
          policy_name,
          table_name
        );
      end loop;

      execute format(
        'create policy "Public read access" on public.%I for select to anon, authenticated using (true)',
        table_name
      );
      execute format(
        'create policy "Admins can manage records" on public.%I for all to authenticated using (public.has_app_role(''admin'')) with check (public.has_app_role(''admin''))',
        table_name
      );
    end if;
  end loop;
end
$$;

alter table public.catches enable row level security;

drop policy if exists "Weighmasters can create catches" on public.catches;
create policy "Weighmasters can create catches"
on public.catches
for insert
to authenticated
with check (public.has_app_role('weighmaster'));

drop policy if exists "Weighmasters can update catches" on public.catches;
create policy "Weighmasters can update catches"
on public.catches
for update
to authenticated
using (public.has_app_role('weighmaster'))
with check (public.has_app_role('weighmaster'));

drop policy if exists "Weighmasters can delete catches" on public.catches;
create policy "Weighmasters can delete catches"
on public.catches
for delete
to authenticated
using (public.has_app_role('weighmaster'));

alter table public.boat_profile_requests enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'boat_profile_requests'
  loop
    execute format(
      'drop policy if exists %I on public.boat_profile_requests',
      policy_name
    );
  end loop;
end
$$;

create policy "Public can submit boat profile requests"
on public.boat_profile_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can manage boat profile requests"
on public.boat_profile_requests;
create policy "Admins can manage boat profile requests"
on public.boat_profile_requests
for all
to authenticated
using (public.has_app_role('admin'))
with check (public.has_app_role('admin'));

drop policy if exists "Public can view club media" on storage.objects;
create policy "Public can view club media"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('boat-media', 'catch-media'));

drop policy if exists "Admins can manage boat media" on storage.objects;
create policy "Admins can manage boat media"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'boat-media'
  and public.has_app_role('admin')
)
with check (
  bucket_id = 'boat-media'
  and public.has_app_role('admin')
);

drop policy if exists "Weighmasters can manage catch media" on storage.objects;
create policy "Weighmasters can manage catch media"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'catch-media'
  and public.has_app_role('weighmaster')
)
with check (
  bucket_id = 'catch-media'
  and public.has_app_role('weighmaster')
);

-- Bootstrap the first administrator after creating the Auth user:
-- insert into public.user_roles (user_id, role)
-- values ('AUTH_USER_UUID', 'admin')
-- on conflict (user_id) do update set role = excluded.role, updated_at = now();
