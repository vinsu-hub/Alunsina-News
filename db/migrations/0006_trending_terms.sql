CREATE TABLE IF NOT EXISTS trending_terms (
  term text NOT NULL, slug text NOT NULL, window_start date NOT NULL,
  articles int NOT NULL, sources int NOT NULL, stories int NOT NULL,
  prev_articles int NOT NULL DEFAULT 0, score real NOT NULL,
  sample_story_ids jsonb NOT NULL DEFAULT '[]', updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, window_start)
);
ALTER TABLE trending_terms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON trending_terms FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON trending_terms FROM authenticated;
  END IF;
END $$;
-- Sample edition only: derive illustrative terms from its fictional reporting.
INSERT INTO trending_terms(term,slug,window_start,articles,sources,stories,prev_articles,score,sample_story_ids)
SELECT t.term,t.slug,current_date-7,count(*)::int,count(DISTINCT a.source_id)::int,
 count(DISTINCT a.story_id)::int,0,count(*)::real,jsonb_agg(DISTINCT a.story_id)
FROM (VALUES ('Rice','rice'),('Flooding','flooding'),('Cebu','cebu')) t(term,slug)
JOIN public_articles a ON a.headline ~* ('\m' || t.term || '\M')
WHERE a.source_id LIKE 'sample-%' AND a.story_id IS NOT NULL
GROUP BY t.term,t.slug ON CONFLICT DO NOTHING;
