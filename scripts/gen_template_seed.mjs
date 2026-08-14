// ── Generator: document_templates seed SQL ───────────────────────────────
// `node scripts/gen_template_seed.mjs` → supabase/migrations/20250814_document_templates_seed.sql
import { writeFileSync } from 'node:fs'
import { DOCUMENT_TEMPLATES, TEMPLATE_CATEGORIES } from '../src/data/document-templates.ts'

const esc = (s) => String(s ?? '').replace(/'/g, "''")

let sql = `-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Hujjat shablonlari (document_templates) — jadval + 32 ta to'liq namuna
-- Bu fayl avtomatik generatsiya qilingan (scripts/gen_template_seed.mjs).
-- Idempotent: mavjud bazada xavfsiz qayta RUN qilish mumkin.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  law_ref VARCHAR(500) DEFAULT '',
  format VARCHAR(10) DEFAULT 'DOCX' CHECK (format IN ('TXT', 'DOCX', 'PDF')),
  file_size VARCHAR(20) DEFAULT '0 KB',
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(100) DEFAULT 'file-text',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kategoriyalar
INSERT INTO template_categories (slug, name, icon, sort_order) VALUES
`

for (const c of TEMPLATE_CATEGORIES) {
  sql += `  ('${esc(c.id)}', '${esc(c.name)}', '${esc(c.icon)}', ${TEMPLATE_CATEGORIES.indexOf(c) + 1}),\n`
}
sql = sql.replace(/,\n$/, '\n') + `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;\n\n`

// Indekslar
sql += `CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_tags ON document_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_doc_templates_name ON document_templates USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_doc_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_slug ON template_categories(slug);

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active templates" ON document_templates;
CREATE POLICY "Anyone can view active templates"
  ON document_templates FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Templates admin write" ON document_templates;
CREATE POLICY "Templates admin write"
  ON document_templates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Template categories read" ON template_categories;
CREATE POLICY "Template categories read"
  ON template_categories FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE document_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_categories;

-- ── Seed: 32 ta real O'zbekiston huquqiy hujjat namunasi ────────────────
`

for (const t of DOCUMENT_TEMPLATES) {
  sql += `INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('${esc(t.id)}', '${esc(t.name)}', '${esc(t.category)}', '${esc(t.description)}', '${esc(t.content)}',
   '${esc(t.lawRef || '')}', '${esc(t.format)}', '${esc(t.size)}', ${t.downloads || 0}, ARRAY[${t.tags.map(tag => `'${esc(tag)}'`).join(', ')}], true, '${esc(t.createdAt)}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
`
}

writeFileSync('supabase/migrations/20250814_document_templates_seed.sql', sql)
console.log(`✅ SQL generatsiya qilindi: supabase/migrations/20250814_document_templates_seed.sql (${DOCUMENT_TEMPLATES.length} ta shablon)`)
