-- Preserve RLS and candidate semantics; accelerate bounded ingest windows and screening anti-joins.
CREATE INDEX IF NOT EXISTS stories_created ON stories(created_at);
CREATE INDEX IF NOT EXISTS pitch_publications_held_article ON pitch_publications(article_id) WHERE screening_status <> 'passed';
CREATE INDEX IF NOT EXISTS fact_checks_unlinked_published ON fact_checks(published_at) WHERE story_id IS NULL;
