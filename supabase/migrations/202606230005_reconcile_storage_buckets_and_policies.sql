-- Reconcile storage buckets and policies used by the app.
-- Safe to run multiple times.

-- Ensure expected buckets exist.
insert into storage.buckets (id, name, public)
values
  ('boat-media', 'boat-media', true),
  ('catch-media', 'catch-media', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

-- Re-assert known policy names used by this app.
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
