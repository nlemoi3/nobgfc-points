-- Ensure authenticated role can operate on catches table.
-- RLS policies still control who can read/write/delete rows.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catches TO authenticated;

-- Grant sequence usage for integer PK inserts when sequence exists.
DO $$
BEGIN
  IF to_regclass('public.catches_id_seq') IS NOT NULL THEN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.catches_id_seq TO authenticated';
  END IF;
END
$$;
