CREATE TABLE IF NOT EXISTS gov_requests (
 id text PRIMARY KEY, received_at date NOT NULL,
 request_type text NOT NULL CHECK (request_type IN ('removal','takedown_notice','data_request','other')),
 legal_basis text NOT NULL CHECK (legal_basis IN ('court_order','informal_request','letter','other')),
 agency text, story_id text REFERENCES stories(id) ON DELETE SET NULL,
 source_id text REFERENCES sources(id) ON DELETE SET NULL,
 summary text NOT NULL CHECK (char_length(summary) <= 500),
 outcome text NOT NULL CHECK (outcome IN ('pending','not_actioned','removed_per_court_order','partially_actioned','withdrawn')),
 outcome_note text NOT NULL DEFAULT '' CHECK (char_length(outcome_note) <= 500),
 published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gov_requests_published_story ON gov_requests(story_id) WHERE published;
CREATE TABLE IF NOT EXISTS site_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO site_settings(key,value) VALUES ('independence_pledge','{"enabled":false}') ON CONFLICT(key) DO NOTHING;
ALTER TABLE gov_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE role_name text; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON gov_requests, site_settings FROM %I',role_name);
  END IF;
 END LOOP;
END $$;
