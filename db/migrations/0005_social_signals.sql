CREATE TABLE social_signals (
 article_id text PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
 platform text NOT NULL CHECK (platform IN ('reddit','x')),
 subreddit text,
 metrics jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metrics) = 'object')
);
CREATE INDEX social_signals_platform ON social_signals(platform);
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON public.social_signals FROM %I',r); END IF;
 END LOOP;
END $$;
