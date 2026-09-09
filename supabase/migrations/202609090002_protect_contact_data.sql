-- Public directories need names and profile fields, but never direct access to
-- contact details, birth dates, membership identifiers, or linked auth IDs.
revoke all privileges on table public.anglers from anon, authenticated;
grant select (
  id,
  first_name,
  last_name,
  is_member,
  is_youth,
  active,
  created_at,
  photo_url,
  biography
) on table public.anglers to anon, authenticated;

revoke all privileges on table public.boats from anon, authenticated;
grant select (
  id,
  name,
  owner_name,
  active,
  created_at,
  make,
  model,
  year,
  length_feet,
  home_port,
  photo_url,
  logo_url,
  website_url,
  facebook_url,
  instagram_url,
  youtube_url,
  notes,
  captain_name,
  profile_status
) on table public.boats to anon, authenticated;

comment on column public.anglers.email
  is 'Private contact data; accessible only through verified server-side workflows.';
comment on column public.anglers.phone_number
  is 'Private contact data; accessible only through verified server-side workflows.';
comment on column public.anglers.address
  is 'Private contact data; accessible only through verified server-side workflows.';
comment on column public.anglers.date_of_birth
  is 'Private personal data; accessible only through verified server-side workflows.';
comment on column public.anglers.member_id
  is 'Private club identifier; accessible only through verified server-side workflows.';
comment on column public.anglers.user_id
  is 'Private authentication link; accessible only through verified server-side workflows.';
comment on column public.boats.captain_email
  is 'Private contact data; accessible only through verified server-side workflows.';
comment on column public.boats.owner_email
  is 'Private contact data; accessible only through verified server-side workflows.';
comment on column public.boats.user_id
  is 'Private authentication link; accessible only through verified server-side workflows.';
