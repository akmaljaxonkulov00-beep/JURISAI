-- Document Templates Table
-- Stores legal document templates with full text content

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  law_ref VARCHAR(500) DEFAULT '',
  format VARCHAR(10) DEFAULT 'DOCX'
    CHECK (format IN ('TXT', 'DOCX', 'PDF')),
  file_size VARCHAR(20) DEFAULT '0 KB',
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table for template categorization
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(100) DEFAULT 'file-text',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO template_categories (slug, name, icon, sort_order) VALUES
  ('sud', 'Sud hujjatlari', 'scale', 1),
  ('shartnoma', 'Shartnomalar', 'file-signature', 2),
  ('da\'vo', 'Da\'vo va arizalar', 'file-text', 3),
  ('mehnat', 'Mehnat huquqi', 'briefcase', 4),
  ('vakolat', 'Ishonchnoma va vakolat', 'user-check', 5),
  ('majlis', 'Majlis va bayonnomalar', 'users', 6),
  ('xat', 'Xat va murojaatlar', 'mail', 7),
  ('moliya', 'Moliya va hisobot', 'dollar-sign', 8)
ON CONFLICT (slug) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_tags ON document_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_doc_templates_name ON document_templates USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_doc_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_slug ON template_categories(slug);

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read active templates
CREATE POLICY "Anyone can view active templates"
  ON document_templates FOR SELECT
  USING (is_active = true);

-- RLS: only admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON document_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'ADMIN'
    )
  );

-- RLS: anyone can view categories
CREATE POLICY "Anyone can view categories"
  ON template_categories FOR SELECT
  USING (true);

-- RLS: admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON template_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'ADMIN'
    )
  );

-- Update trigger
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doc_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_document_templates_updated_at();
