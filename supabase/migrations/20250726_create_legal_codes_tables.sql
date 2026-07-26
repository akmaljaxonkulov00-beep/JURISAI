-- ============================================================================
-- JURISAI: LEGAL CODES & ARTICLES TABLES
-- ============================================================================
-- Run this migration in Supabase SQL Editor before using the seeder.
-- This creates tables for storing Uzbekistan legal codes and their articles.
-- ============================================================================

-- ── Categories (legal codes) table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  document_count INTEGER DEFAULT 0,
  document_type TEXT DEFAULT 'Kodeks',
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Articles table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Umumiy',
  penalties TEXT DEFAULT '',
  references JSONB DEFAULT '[]'::jsonb,
  chapter TEXT DEFAULT '',
  section TEXT DEFAULT '',
  keywords JSONB DEFAULT '[]'::jsonb,
  effective_date TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code_id, article_number)
);

-- ── Indexes for performance ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_code_id ON articles(code_id);
CREATE INDEX IF NOT EXISTS idx_articles_article_number ON articles(article_number);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_chapter ON articles(chapter);
CREATE INDEX IF NOT EXISTS idx_categories_document_type ON categories(document_type);

-- ── Full-text search index ──────────────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(article_number, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);

-- ── Enable Row Level Security ──────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ── RLS: Allow public read for authenticated users ──────────────────────
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
CREATE POLICY "Allow public read categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read articles" ON articles;
CREATE POLICY "Allow public read articles" ON articles
  FOR SELECT USING (true);

-- ── RLS: Allow admin full access ────────────────────────────────────────
DROP POLICY IF EXISTS "Allow admin all categories" ON categories;
CREATE POLICY "Allow admin all categories" ON categories
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.jwt() ->> 'role' = 'ADMIN'
  );

DROP POLICY IF EXISTS "Allow admin all articles" ON articles;
CREATE POLICY "Allow admin all articles" ON articles
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.jwt() ->> 'role' = 'ADMIN'
  );

-- ── Updated_at trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_legal_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_legal_tables_updated_at();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_legal_tables_updated_at();
