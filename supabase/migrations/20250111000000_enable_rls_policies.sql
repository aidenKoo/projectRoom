-- Enable Row Level Security on all tables
-- This migration adds comprehensive RLS policies for data protection

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns the profile
CREATE OR REPLACE FUNCTION owns_profile(profile_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if users are matched
CREATE OR REPLACE FUNCTION are_matched(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM matches
    WHERE (uid_a = user1_id AND uid_b = user2_id)
       OR (uid_a = user2_id AND uid_b = user1_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_blocked_by(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE blocker_user_id = blocker_id
      AND blocked_user_id = blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (owns_profile(user_id));

-- Users can read profiles of non-blocked users (for matching)
CREATE POLICY "Users can read visible profiles"
  ON profiles FOR SELECT
  USING (
    NOT is_blocked_by(user_id, auth.uid())
    AND NOT is_blocked_by(auth.uid(), user_id)
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (owns_profile(user_id))
  WITH CHECK (owns_profile(user_id));

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (owns_profile(user_id));

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- USER VERIFICATIONS
-- ============================================================================

-- Users can read their own verification
CREATE POLICY "Users can read own verification"
  ON user_verifications FOR SELECT
  USING (owns_profile(user_id));

-- Users can update their own verification
CREATE POLICY "Users can update own verification"
  ON user_verifications FOR UPDATE
  USING (owns_profile(user_id))
  WITH CHECK (owns_profile(user_id));

-- Moderators can read all verifications
CREATE POLICY "Moderators can read verifications"
  ON user_verifications FOR SELECT
  USING (is_moderator_or_admin());

-- Moderators can update verifications
CREATE POLICY "Moderators can update verifications"
  ON user_verifications FOR UPDATE
  USING (is_moderator_or_admin());

-- ============================================================================
-- PHOTOS
-- ============================================================================

-- Users can read their own photos
CREATE POLICY "Users can read own photos"
  ON photos FOR SELECT
  USING (owns_profile(user_id));

-- Users can read photos of visible profiles
CREATE POLICY "Users can read visible photos"
  ON photos FOR SELECT
  USING (
    NOT is_blocked_by(user_id, auth.uid())
    AND NOT is_blocked_by(auth.uid(), user_id)
  );

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT
  WITH CHECK (owns_profile(user_id));

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (owns_profile(user_id))
  WITH CHECK (owns_profile(user_id));

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (owns_profile(user_id));

-- Moderators can read all photos
CREATE POLICY "Moderators can read all photos"
  ON photos FOR SELECT
  USING (is_moderator_or_admin());

-- ============================================================================
-- PREFERENCES
-- ============================================================================

-- Users can read their own preferences
CREATE POLICY "Users can read own preferences"
  ON preferences FOR SELECT
  USING (owns_profile(user_id));

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON preferences FOR UPDATE
  USING (owns_profile(user_id))
  WITH CHECK (owns_profile(user_id));

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON preferences FOR INSERT
  WITH CHECK (owns_profile(user_id));

-- ============================================================================
-- EMBEDDINGS
-- ============================================================================

-- Service role only (used by backend matching algorithm)
CREATE POLICY "Service role can manage embeddings"
  ON embeddings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- SWIPES
-- ============================================================================

-- Users can read their own swipes
CREATE POLICY "Users can read own swipes"
  ON swipes FOR SELECT
  USING (actor_id = auth.uid());

-- Users can insert their own swipes
CREATE POLICY "Users can insert own swipes"
  ON swipes FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Admins can read all swipes
CREATE POLICY "Admins can read all swipes"
  ON swipes FOR SELECT
  USING (is_admin());

-- ============================================================================
-- MATCHES
-- ============================================================================

-- Users can read their own matches
CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  USING (uid_a = auth.uid() OR uid_b = auth.uid());

-- Service role can insert matches
CREATE POLICY "Service can insert matches"
  ON matches FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Admins can read all matches
CREATE POLICY "Admins can read all matches"
  ON matches FOR SELECT
  USING (is_admin());

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

-- Users can read conversations they're part of
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- Users can update conversations they're part of
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid())
  WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- ============================================================================
-- MESSAGES
-- ============================================================================

-- Users can read messages in their conversations
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
        AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update message status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user_a_id = auth.uid() OR conversations.user_b_id = auth.uid())
    )
  );

-- ============================================================================
-- REPORTS
-- ============================================================================

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Users can insert reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Moderators can read all reports
CREATE POLICY "Moderators can read all reports"
  ON reports FOR SELECT
  USING (is_moderator_or_admin());

-- Moderators can update reports
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  USING (is_moderator_or_admin());

-- ============================================================================
-- BLOCKS
-- ============================================================================

-- Users can read their own blocks
CREATE POLICY "Users can read own blocks"
  ON blocks FOR SELECT
  USING (blocker_user_id = auth.uid());

-- Users can insert their own blocks
CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (blocker_user_id = auth.uid());

-- Users can delete their own blocks
CREATE POLICY "Users can remove blocks"
  ON blocks FOR DELETE
  USING (blocker_user_id = auth.uid());

-- Admins can read all blocks
CREATE POLICY "Admins can read all blocks"
  ON blocks FOR SELECT
  USING (is_admin());

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_actor_id ON swipes(actor_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_id ON swipes(target_id);
CREATE INDEX IF NOT EXISTS idx_matches_uid_a ON matches(uid_a);
CREATE INDEX IF NOT EXISTS idx_matches_uid_b ON matches(uid_b);
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(user_b_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION is_moderator_or_admin() IS 'Check if current user has moderator or admin role';
COMMENT ON FUNCTION owns_profile(UUID) IS 'Check if current user owns the profile';
COMMENT ON FUNCTION are_matched(UUID, UUID) IS 'Check if two users are matched';
COMMENT ON FUNCTION is_blocked_by(UUID, UUID) IS 'Check if user is blocked by another user';
