-- Ensure authenticated role can update tournament events.
-- RLS policies still enforce role-based access (admin via has_app_role).

ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.events_id_seq') IS NOT NULL THEN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.events_id_seq TO authenticated';
  END IF;
END
$$;
