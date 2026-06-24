-- Harden storage.objects policies by removing unexpected policy entries
-- and recreating only the approved set used by this app.
-- Safe to run multiple times.

do $$
declare
  policy_name text;
  keep_policies text[] := array[
    'Public can view club media',
    'Admins can manage boat media',
    'Weighmasters can manage catch media'
  ];
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  loop
    if not (policy_name = any(keep_policies)) then
      execute format('drop policy if exists %I on storage.objects', policy_name);
    end if;
  end loop;
end
$$;

-- Recreate approved policies explicitly.
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
