-- Fix article_number_int for proper numeric sorting
-- Run this in Supabase SQL Editor

-- 1. Update article_number_int from article_number
UPDATE articles 
SET article_number_int = CAST(article_number AS INTEGER)
WHERE article_number ~ '^\d+$' AND article_number_int IS NULL;

-- 2. Add index for faster sorting
CREATE INDEX IF NOT EXISTS idx_articles_code_id_number_int 
ON articles (code_id, article_number_int);

-- 3. Add index for full-text search
CREATE INDEX IF NOT EXISTS idx_articles_title_content_search 
ON articles USING gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));
