-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261027_court_lifecycle_and_history.sql
-- JURISTIV: Authoritative Courtroom Lifecycle, Session Timers & History
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Add authoritative timestamps and duration to court_multiplayer_rooms
ALTER TABLE public.court_multiplayer_rooms 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- 2) Performance Indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_lobby 
  ON public.court_multiplayer_rooms(status, is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_multiplayer_participants_user 
  ON public.court_multiplayer_participants(user_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_multiplayer_participants_room_user 
  ON public.court_multiplayer_participants(room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_multiplayer_evidence_visibility 
  ON public.court_multiplayer_evidence(room_id, visibility, status);

-- 3) Ensure RLS is active on all multiplayer tables
ALTER TABLE public.court_multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_multiplayer_events ENABLE ROW LEVEL SECURITY;

-- 4) Upgraded Policies
-- Public active rooms or rooms user participated in
DROP POLICY IF EXISTS mp_rooms_read ON public.court_multiplayer_rooms;
CREATE POLICY mp_rooms_read ON public.court_multiplayer_rooms
  FOR SELECT USING (
    is_public = true 
    OR host_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.court_multiplayer_participants p
      WHERE p.room_id = id AND p.user_id = auth.uid()::text
    )
  );

-- Participants viewable for accessible rooms
DROP POLICY IF EXISTS mp_participants_read ON public.court_multiplayer_participants;
CREATE POLICY mp_participants_read ON public.court_multiplayer_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.court_multiplayer_rooms r
      WHERE r.id = room_id AND (
        r.is_public = true 
        OR r.host_id = auth.uid()::text
        OR user_id = auth.uid()::text
      )
    )
  );

-- Messages viewable for participants or public active rooms
DROP POLICY IF EXISTS mp_messages_read ON public.court_multiplayer_messages;
CREATE POLICY mp_messages_read ON public.court_multiplayer_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.court_multiplayer_rooms r
      WHERE r.id = room_id AND (
        r.is_public = true 
        OR r.host_id = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.court_multiplayer_participants p
          WHERE p.room_id = r.id AND p.user_id = auth.uid()::text
        )
      )
    )
  );

-- Evidence visibility
DROP POLICY IF EXISTS mp_evidence_read ON public.court_multiplayer_evidence;
CREATE POLICY mp_evidence_read ON public.court_multiplayer_evidence
  FOR SELECT USING (
    visibility = 'public'
    OR submitted_by_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.court_multiplayer_participants p
      WHERE p.room_id = room_id AND p.user_id = auth.uid()::text AND (
        p.role = 'SUDYA'
        OR (visibility = 'prosecution_only' AND p.role = 'PROKUROR')
        OR (visibility = 'defense_only' AND p.role IN ('ADVOKAT', 'AYBLANUVCHI'))
      )
    )
  );
