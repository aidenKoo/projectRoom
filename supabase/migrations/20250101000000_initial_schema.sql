-- Initial Schema Migration for Dating App
-- Based on the product specification (작업서.txt)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'N')),
  birth_year INT CHECK (birth_year BETWEEN 1950 AND EXTRACT(YEAR FROM NOW())::INT - 19),
  region_code TEXT,
  height_cm INT CHECK (height_cm BETWEEN 100 AND 250),
  job_group TEXT,
  edu_level TEXT,
  religion TEXT,
  drink TEXT,
  smoke TEXT,
  intro_text TEXT,
  values_json JSONB DEFAULT '{}'::JSONB,
  active_time_band INT,
  visibility_flags JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User verification status
CREATE TABLE user_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_verified BOOLEAN DEFAULT FALSE,
  pass_verified BOOLEAN DEFAULT FALSE,
  selfie_verified BOOLEAN DEFAULT FALSE,
  pass_verified_at TIMESTAMPTZ,
  selfie_verified_at TIMESTAMPTZ,
  verification_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  safety_score FLOAT CHECK (safety_score BETWEEN 0 AND 1),
  ai_gen_suspect_score FLOAT CHECK (ai_gen_suspect_score BETWEEN 0 AND 1),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_is_primary ON photos(user_id, is_primary);

-- Preferences
CREATE TABLE preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  age_min INT CHECK (age_min >= 19),
  age_max INT CHECK (age_max <= 100),
  distance_km INT,
  religion_ok TEXT[],
  drink_ok TEXT[],
  smoke_ok TEXT[],
  want_children TEXT,
  tags_include TEXT[],
  tags_exclude TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings for vector similarity search
CREATE TABLE embeddings (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_vec VECTOR(768),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index for fast similarity search
CREATE INDEX ON embeddings USING ivfflat (profile_vec vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- MATCHING & INTERACTIONS
-- ============================================================================

-- Swipes (likes/passes)
CREATE TABLE swipes (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_swipes_actor ON swipes(actor_id, created_at DESC);
CREATE INDEX idx_swipes_target ON swipes(target_id);
CREATE UNIQUE INDEX unique_swipe ON swipes(actor_id, target_id);

-- Matches
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  user_a UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'reported')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT unique_match UNIQUE (user_a, user_b),
  CONSTRAINT check_different_users CHECK (user_a != user_b)
);

CREATE INDEX idx_matches_user_a ON matches(user_a, status);
CREATE INDEX idx_matches_user_b ON matches(user_b, status);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- Messages
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  body TEXT,
  type TEXT CHECK (type IN ('text', 'voice', 'image', 'icebreaker')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::JSONB,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_flagged ON messages(flagged) WHERE flagged = TRUE;

-- ============================================================================
-- SAFETY & MODERATION
-- ============================================================================

-- Reports
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  evidence_data JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_target ON reports(target_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- User blocks
CREATE TABLE blocks (
  id BIGSERIAL PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT check_different_users CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- Risk scores (for shadow banning)
CREATE TABLE risk_scores (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  score FLOAT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  factors JSONB DEFAULT '{}'::JSONB,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================================================

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'plus', 'pro')),
  price_cents INT NOT NULL,
  provider TEXT,
  provider_transaction_id TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Coins/Credits
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  coins INT DEFAULT 0 CHECK (coins >= 0),
  response_credits INT DEFAULT 0 CHECK (response_credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OFFLINE FEATURES
-- ============================================================================

-- Venues (safe dating spots)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  address TEXT,
  partner BOOLEAN DEFAULT FALSE,
  safety_rating FLOAT CHECK (safety_rating BETWEEN 0 AND 5),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues(lat, lng);
CREATE INDEX idx_venues_partner ON venues(partner);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id),
  starts_at TIMESTAMPTZ NOT NULL,
  voucher_code TEXT,
  state TEXT DEFAULT 'pending' CHECK (state IN ('pending', 'confirmed', 'completed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_match ON reservations(match_id);
CREATE INDEX idx_reservations_venue ON reservations(venue_id);
CREATE INDEX idx_reservations_starts_at ON reservations(starts_at);

-- ============================================================================
-- EXPERIMENTS & A/B TESTING
-- ============================================================================

CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  variant TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_experiment UNIQUE (key, user_id)
);

CREATE INDEX idx_experiments_user ON experiments(user_id);
CREATE INDEX idx_experiments_key ON experiments(key);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON user_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create mutual match
CREATE OR REPLACE FUNCTION create_match_if_mutual()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a reciprocal like
  IF NEW.action = 'like' AND EXISTS (
    SELECT 1 FROM swipes
    WHERE actor_id = NEW.target_id
      AND target_id = NEW.actor_id
      AND action = 'like'
  ) THEN
    -- Create match (ensure user_a < user_b for consistency)
    INSERT INTO matches (user_a, user_b, status)
    VALUES (
      LEAST(NEW.actor_id, NEW.target_id),
      GREATEST(NEW.actor_id, NEW.target_id),
      'active'
    )
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_match AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION create_match_if_mutual();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile and public profiles of others
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Photos: Users can manage their own photos
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);

-- Preferences: Users can manage their own preferences
CREATE POLICY "Users can view own preferences" ON preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON preferences
  FOR ALL USING (auth.uid() = user_id);

-- Swipes: Users can view and create their own swipes
CREATE POLICY "Users can view own swipes" ON swipes
  FOR SELECT USING (auth.uid() = actor_id);

CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Matches: Users can view their own matches
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Messages: Users can view and send messages in their matches
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND (user_a = auth.uid() OR user_b = auth.uid()) AND status = 'active'
    )
  );

-- Reports: Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Blocks: Users can manage their own blocks
CREATE POLICY "Users can view own blocks" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Payments: Users can view their own payment history
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- User Credits: Users can view their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Venues: Public read access
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (TRUE);

-- Reservations: Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert some sample venues (optional for development)
-- This can be moved to seed.sql if preferred

COMMENT ON TABLE profiles IS 'User profiles with personal information and preferences';
COMMENT ON TABLE embeddings IS 'Vector embeddings for AI-powered matching';
COMMENT ON TABLE matches IS 'Mutual likes that create a match';
COMMENT ON TABLE messages IS 'Messages exchanged between matched users';
COMMENT ON TABLE reports IS 'User reports for safety and moderation';
COMMENT ON TABLE venues IS 'Partner venues for safe offline meetings';
