-- Ensure angler linking column exists and grant SELECT to authenticated role
-- Run this in your production Supabase SQL editor if not already applied.

ALTER TABLE IF EXISTS public.anglers
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.boats
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

GRANT SELECT ON public.anglers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.anglers TO authenticated;

GRANT SELECT ON public.boats TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.boats TO authenticated;

-- If you prefer to also grant on other admin-read tables, add them here:
-- GRANT SELECT ON public.awards TO authenticated;
