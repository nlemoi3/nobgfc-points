-- Reconcile catches table permissions and ensure weighmasters can delete catches.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS public.catches ENABLE ROW LEVEL SECURITY;

-- Table-level privileges needed before RLS can evaluate policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catches TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.catches_id_seq') IS NOT NULL THEN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.catches_id_seq TO authenticated';
  END IF;
END
$$;

-- Keep weighmaster policies explicitly present.
DROP POLICY IF EXISTS "Weighmasters can create catches" ON public.catches;
CREATE POLICY "Weighmasters can create catches"
ON public.catches
FOR INSERT
TO authenticated
WITH CHECK (public.has_app_role('weighmaster'));

DROP POLICY IF EXISTS "Weighmasters can update catches" ON public.catches;
CREATE POLICY "Weighmasters can update catches"
ON public.catches
FOR UPDATE
TO authenticated
USING (public.has_app_role('weighmaster'))
WITH CHECK (public.has_app_role('weighmaster'));

DROP POLICY IF EXISTS "Weighmasters can delete catches" ON public.catches;
CREATE POLICY "Weighmasters can delete catches"
ON public.catches
FOR DELETE
TO authenticated
USING (public.has_app_role('weighmaster'));
