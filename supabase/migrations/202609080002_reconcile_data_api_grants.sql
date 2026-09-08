-- Signed-in catch-management queries join catches to this public lookup table.
-- The existing RLS policy permits read access, but PostgREST also requires the
-- underlying table privilege for the authenticated role.

grant select on table public.species to authenticated;
