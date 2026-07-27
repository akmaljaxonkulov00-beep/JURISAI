-- ============================================================================
-- JURISAI: YURIDIK MA'LUMOTLAR BAZASI (QONUN KODEKSLARI)
-- Supabase Migration: 20250727
-- 
-- Tables:
--   categories  - legal code categories (Jinoyat Kodeksi, Fuqarolik Kodeksi, etc.)
--   articles    - individual articles within each code
-- ============================================================================

-- ── 1. Enable UUID extension ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. CATEGORIES TABLE ────────────────────────────────────────────────────
-- Each row represents a legal code
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'book-open',
  color TEXT DEFAULT 'from-blue-500 to-blue-600',
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. ARTICLES TABLE ──────────────────────────────────────────────────────
-- Each row is a single article (modda). NOTE: "references" is a reserved
-- keyword in PostgreSQL, so the cross-reference column is named
-- "cross_references" instead.
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT NOT NULL REFERENCES categories(code_id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  chapter TEXT DEFAULT 'Umumiy qoidalar',
  section TEXT DEFAULT '',
  penalties TEXT DEFAULT '',
  cross_references TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, article_number)
);

-- ── 4. FULL-TEXT SEARCH INDEX ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_content_search 
  ON articles USING GIN(to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_articles_number_search 
  ON articles(article_number);

CREATE INDEX IF NOT EXISTS idx_articles_code_id 
  ON articles(code_id);

-- ── 5. ROW LEVEL SECURITY ──────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories and articles
CREATE POLICY "Public can read categories" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "Public can read articles" 
  ON articles FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert categories" 
  ON categories FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can update categories" 
  ON categories FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can delete categories" 
  ON categories FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can insert articles" 
  ON articles FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can update articles" 
  ON articles FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can delete articles" 
  ON articles FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );
