# Architecture Migration Plan: Flutter/Firebase → PostgreSQL Web App

## Current State vs Target State

### Current Implementation
- **Frontend**: Flutter mobile app
- **Backend**: Firebase/Firestore
- **Auth**: Firebase Auth + Google Sign-In
- **Storage**: Firebase Storage
- **Matching**: Simple Big Five personality traits
- **Notifications**: FCM

### Target Implementation (Per Updated 작업서)
- **Frontend**: Web application (technology TBD)
- **Backend**: PostgreSQL + REST API
- **Auth**: Custom auth system with signup codes
- **Matching**: Complex ML-based mutual matching (YouLike + TheyLike)
- **Features**: Limits/quotas, appearance scoring, admin console, RBAC

## High-Level Migration Strategy

### Phase 1: Database Design & Core API
1. **PostgreSQL Schema Implementation**
   - Users (public/private data separation)
   - Signup codes system
   - Matches with state machine
   - Appearance metrics tracking
   - Admin/audit logging tables

2. **Core API Development**
   - Authentication with signup codes
   - User management (public/private profiles)
   - Basic matching endpoints
   - Limits/quotas enforcement

### Phase 2: Advanced Matching System
1. **Mutual Matching Algorithm**
   - ContentSim (content-based similarity)
   - Implicit-ALS collaborative filtering
   - CTR (Click-Through Rate) modeling
   - IPS (Inverse Propensity Scoring) logging

2. **Appearance Estimation System**
   - ML-based appearance scoring (internal)
   - Group normalization and calibration
   - 15% reranking cap enforcement

### Phase 3: Limits & Transaction System
1. **Monthly Limits Implementation**
   - Monthly attempts (15), successes (5), concurrent (3)
   - Transaction-based enforcement
   - Automatic monthly resets

2. **Matching State Machine**
   - requested → accepted/ignored/ended
   - Phone number exchange system
   - Rating/blacklist workflow

### Phase 4: Admin Console & RBAC
1. **Admin System**
   - Role-based access control
   - User management interface
   - Policy configuration
   - Monitoring dashboard

2. **Batch Jobs & Background Processing**
   - Appearance score recalculation
   - ALS model training
   - Ignored match cleanup

## Database Schema (Key Tables)

### Core User Tables
```sql
-- Main user table (public data)
users(
  id BIGSERIAL PK,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT, age INT, height_cm INT,
  job_title TEXT, education_level TEXT, mbti TEXT,
  region_sido TEXT, region_sigungu TEXT,
  living_alone BOOL, bio_note TEXT,
  status TEXT CHECK (status IN ('active','pause','dating')) DEFAULT 'active',
  monthly_attempts INT DEFAULT 0,
  monthly_successes INT DEFAULT 0,
  concurrent_matches INT DEFAULT 0,
  last_reset_yyyymm CHAR(6),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Private/sensitive data (separate table)
user_private(
  user_id PK FK,
  wealth_level TEXT CHECK (wealth_level IN ('unknown','mid','high','very_high')),
  look_confidence SMALLINT DEFAULT 0,   -- 0=미응답, 1~5
  body_confidence SMALLINT DEFAULT 0,
  values_json JSONB
);

-- User preferences ranking (1-5 priorities)
user_preferences(
  user_id FK,
  rank SMALLINT,
  factor_code TEXT,
  PRIMARY KEY(user_id, rank)
);
```

### Matching System Tables
```sql
-- Core matching table with state machine
matches(
  id BIGSERIAL PK,
  a_user_id BIGINT FK,
  b_user_id BIGINT FK,
  state TEXT CHECK (state IN ('requested','accepted','chatting','ended','ignored')),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  end_reason TEXT CHECK (end_reason IN ('normal','dating','ignored','blocked')),
  phone_exchanged_at TIMESTAMPTZ
);

-- Rating and feedback system
match_ratings(
  id BIGSERIAL PK,
  match_id BIGINT FK,
  rater_user_id BIGINT FK,
  target_user_id BIGINT FK,
  rating TEXT CHECK (rating IN ('down','up','double_up','none')),
  reasons_up JSONB,
  reason_down TEXT,
  blacklist_flag BOOL,
  blacklist_reason TEXT,
  created_at TIMESTAMPTZ
);
```

### Appearance & ML System Tables
```sql
-- Daily metrics for appearance scoring
user_metrics_daily(
  user_id FK,
  date DATE,
  impressions INT,
  photo_clicks INT,
  likes INT,
  requests INT,
  PRIMARY KEY(user_id, date)
);

-- Computed appearance scores (internal only)
user_appearance(
  user_id PK FK,
  appearance_score SMALLINT,      -- 0-100, internal use only
  appearance_confidence NUMERIC,  -- 0-1, based on impression count
  updated_at TIMESTAMPTZ
);

-- IPS logging for ML model training
impressions(
  user_id BIGINT,
  target_id BIGINT,
  rank INT,
  policy TEXT,
  propensity NUMERIC,
  ts TIMESTAMPTZ
);

events(
  user_id BIGINT,
  target_id BIGINT,
  type TEXT,  -- like, request, accept, etc.
  ts TIMESTAMPTZ
);
```

### Admin & Signup System
```sql
-- Monthly signup codes
signup_codes(
  id PK,
  code TEXT UNIQUE,
  valid_yyyymm CHAR(6),
  max_uses INT,
  used_count INT,
  is_active BOOL,
  created_at TIMESTAMPTZ
);

-- Blacklist system
blacklist(
  user_id BIGINT,
  blocked_user_id BIGINT,
  reason TEXT,
  created_at TIMESTAMPTZ,
  PRIMARY KEY(user_id, blocked_user_id)
);
```

## Implementation Priority

### Immediate (High Priority)
1. ✅ Fix Google Sign-In errors (COMPLETED)
2. 🏗️ **PostgreSQL schema creation**
3. 🏗️ **Basic REST API with signup codes**
4. 🏗️ **User registration/authentication system**

### Short-term (Next 2-3 iterations)
1. **Public/private survey system**
2. **Basic matching with limits enforcement**
3. **Transaction-based quota system**
4. **Match state machine implementation**

### Medium-term (Next 4-6 iterations)
1. **ML-based mutual matching (YouLike + TheyLike)**
2. **Appearance estimation system**
3. **Admin console with RBAC**
4. **Batch job system**

### Long-term (Final iterations)
1. **Advanced ML features (ALS, CTR, IPS)**
2. **Full monitoring and analytics**
3. **Production deployment and scaling**

## Migration Decision Points

### Frontend Technology Choice
- **Option A**: Continue with Flutter Web
- **Option B**: Migrate to React/Next.js
- **Option C**: Use Vue.js/Nuxt
- **Recommendation**: Evaluate based on admin console requirements

### Backend Architecture
- **Option A**: Node.js/Express + PostgreSQL
- **Option B**: Python/FastAPI + PostgreSQL
- **Option C**: Go + PostgreSQL
- **Recommendation**: Python/FastAPI for ML integration

### Deployment Strategy
- **Development**: Docker Compose locally
- **Production**: Kubernetes or cloud-managed services
- **Database**: Managed PostgreSQL service

This migration represents a fundamental shift from a simple mobile app to an enterprise-grade dating platform with ML capabilities, admin controls, and complex business logic.