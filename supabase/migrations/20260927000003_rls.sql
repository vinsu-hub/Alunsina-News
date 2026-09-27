-- Lock down Supabase's auto-generated REST API (PostgREST). The app connects
-- as the database owner and bypasses RLS; the anon/publishable key gets no
-- access to any table. Add explicit policies later if a client-side read path
-- is ever needed. Local PGlite has no anon/authenticated roles, so the revoke
-- only runs where they exist.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.tablename);
    END IF;
  END LOOP;
END $$;
