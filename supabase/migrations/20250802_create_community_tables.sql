-- ═══════════════════════════════════════════════════════════════════════
-- Community Tables — Groups, Experts, Webinars
-- ═══════════════════════════════════════════════════════════════════════

-- 1. GROUPS
CREATE TABLE IF NOT EXISTS community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '👥',
  category TEXT DEFAULT 'Umumiy',
  created_by UUID REFERENCES registered_users(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view groups" ON community_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage groups" ON community_groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM registered_users WHERE id::TEXT = auth.uid()::TEXT AND role = 'admin')
  );

CREATE POLICY "Any user can create groups" ON community_groups
  FOR INSERT WITH CHECK (true);

-- 2. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS community_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES registered_users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view group members" ON community_group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON community_group_members
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

CREATE POLICY "Users can leave groups" ON community_group_members
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- 3. EXPERTS
CREATE TABLE IF NOT EXISTS community_experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  reputation INTEGER DEFAULT 0,
  webinars_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view experts" ON community_experts
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage experts" ON community_experts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM registered_users WHERE id::TEXT = auth.uid()::TEXT AND role = 'admin')
  );

-- 4. EXPERT REVIEWS / RATINGS
CREATE TABLE IF NOT EXISTS community_expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES community_experts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES registered_users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(expert_id, user_id)
);

ALTER TABLE community_expert_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view reviews" ON community_expert_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can add reviews" ON community_expert_reviews
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

-- 5. WEBINARS
CREATE TABLE IF NOT EXISTS community_webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  host TEXT DEFAULT '',
  host_title TEXT DEFAULT '',
  category TEXT DEFAULT 'Umumiy',
  date DATE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 500,
  participants_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  recording_url TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_webinars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view webinars" ON community_webinars
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage webinars" ON community_webinars
  FOR ALL USING (
    EXISTS (SELECT 1 FROM registered_users WHERE id::TEXT = auth.uid()::TEXT AND role = 'admin')
  );

-- 6. WEBINAR REGISTRATIONS
CREATE TABLE IF NOT EXISTS community_webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES community_webinars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES registered_users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(webinar_id, user_id)
);

ALTER TABLE community_webinar_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view registrations" ON community_webinar_registrations
  FOR SELECT USING (true);

CREATE POLICY "Users can register" ON community_webinar_registrations
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA — Sample experts, groups, webinars
-- ═══════════════════════════════════════════════════════════════════════

-- Sample Groups
INSERT INTO community_groups (name, description, icon, category, member_count) VALUES
  ('Xalqaro huquq ixlosmandlari', 'Xalqaro huquq va konvensiyalar bo''yicha muhokamalar', '🌍', 'Xalqaro huquq', 234),
  ('Bo''lajak advokatlar klubi', 'Yosh advokatlar uchun qo''llab-quvvatlash guruhi', '💼', 'Kasbiy rivojlanish', 456),
  ('Sud ekspertizasi guruhi', 'Sud ekspertizasi va sud-tibbiyot masalalari', '🔍', 'Ekspertiza', 189),
  ('Mehnat huquqi mutaxassislari', 'Mehnat huquqi va ishchi-huquqiy munosabatlar', '📋', 'Mehnat huquqi', 321),
  ('Kiberjinoyat va IT huquqi', 'Kiberjinoyat, IT huquqi va raqamli texnologiyalar', '💻', 'IT huquqi', 167)
ON CONFLICT DO NOTHING;

-- Sample Experts
INSERT INTO community_experts (name, title, specialization, reputation, webinars_count, is_verified, is_active) VALUES
  ('Dr. Aziz Karimov', 'Huquqshunoslik fanlari doktori', 'Fuqarolik va tijorat huquqi', 2850, 12, true, true),
  ('Prof. Dilora Nazarova', 'Jinoyat huquqi professori', 'Jinoyat huquqi va kriminologiya', 3200, 18, true, true),
  ('Bahodir Toshmatov', 'Prokuratura boshlig''i', 'Jinoyat protsessi', 1950, 6, true, true),
  ('Malika Umarova', 'Advokat', 'Xalqaro arbitraj', 1670, 8, true, true),
  ('Akmal Rahimov', 'Oliy sud sudyasi', 'Fuqarolik protsessi', 2400, 15, true, true)
ON CONFLICT DO NOTHING;

-- Sample Webinars
INSERT INTO community_webinars (title, description, host, host_title, category, date, duration_minutes, participants_count, is_live) VALUES
  ('Kiberjinoyatlar: Yangi qonunchilik va amaliyot', 'Kiberjinoyatlarga qarshi kurashishning yangi usullari va qonunchilikdagi o''zgarishlar', 'Prof. Dilora Nazarova', 'Jinoyat huquqi professori', 'Jinoyat huquqi', CURRENT_DATE + INTERVAL '3 days', 90, 156, true),
  ('Sud amaliyotida dalillarni yig''ish usullari', 'Sud jarayonida dalillarni to''plash va taqdim etishning samarali usullari', 'Dr. Aziz Karimov', 'Huquqshunoslik fanlari doktori', 'Sud amaliyoti', CURRENT_DATE + INTERVAL '7 days', 120, 89, false),
  ('Tijorat nizolari: Xalqaro tajriba', 'Tijorat nizolarini hal qilishda xalqaro tajriba va arbitraj', 'Malika Umarova', 'Advokat', 'Tijorat huquqi', CURRENT_DATE + INTERVAL '14 days', 60, 234, false),
  ('Mehnat nizolari va ularni hal qilish', 'Mehnat nizolarining oldini olish va ularni sudgacha hal qilish tartibi', 'Akmal Rahimov', 'Oliy sud sudyasi', 'Mehnat huquqi', CURRENT_DATE + INTERVAL '21 days', 90, 112, false)
ON CONFLICT DO NOTHING;
