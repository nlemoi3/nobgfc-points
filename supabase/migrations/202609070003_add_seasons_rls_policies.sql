-- Let public standings resolve the active season while retaining admin control.

alter table public.seasons enable row level security;

drop policy if exists "Public read access" on public.seasons;
create policy "Public read access"
on public.seasons
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage records" on public.seasons;
create policy "Admins can manage records"
on public.seasons
for all
to authenticated
using ((select public.has_app_role('admin')))
with check ((select public.has_app_role('admin')));
