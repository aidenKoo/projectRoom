# Supabase Setup Guide

## 🚀 Quick Start

### 1. Local Development with Docker Compose

```bash
# Start all services (Supabase + Redis + MinIO + Analytics)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 2. Access Points

#### Core Services
- **Supabase Studio**: http://localhost:3000 (Database UI)
- **API Gateway**: http://localhost:8000 (REST/Realtime/Storage)
- **PostgreSQL**: localhost:5432
  - User: `postgres`
  - Password: `postgres`
  - Database: `postgres`

#### Additional Services (per 작업서)
- **Redis**: localhost:6379 (Caching, Sessions, A/B Testing)
- **MinIO Console**: http://localhost:9001 (S3-compatible storage)
  - Username: `minioadmin`
  - Password: `minioadmin`
- **MailHog**: http://localhost:8025 (Email testing)
- **Metabase**: http://localhost:3001 (Analytics/BI)
- **Adminer**: http://localhost:8080 (Database management)

### 3. Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

## 📁 Project Structure

```
supabase/
├── config.toml                 # Supabase CLI configuration
├── config/
│   ├── kong.yml               # API Gateway routes
│   └── vector.yml             # Logging configuration
├── migrations/                # Database migrations
│   └── 20250101000000_initial_schema.sql
├── functions/                 # Edge Functions
│   ├── _shared/
│   │   └── anthropic.ts      # Claude API utilities
│   ├── profile-analyzer/     # Profile analysis with Claude
│   ├── content-moderator/    # Content moderation
│   └── match-explainer/      # "Why this match?" generator
└── seed.sql                   # Seed data for development
```

## 🔑 Default Credentials

### API Keys (Local Development)

```bash
# Anonymous Key (client-side)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (server-side - KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Warning**: These are demo keys for local development only. Never use them in production!

## 📊 Database Migrations

### Create a new migration

```bash
supabase migration new migration_name
```

### Apply migrations

```bash
# Reset database and apply all migrations
supabase db reset

# Or push to remote
supabase db push
```

### Migration files location

All SQL migrations are in: `supabase/migrations/`

## 🧪 Using Supabase CLI

### Initialize Supabase (already done via postCreateCommand)

```bash
supabase init
```

### Start Supabase locally (alternative to docker-compose)

```bash
supabase start
```

### Stop Supabase

```bash
supabase stop
```

### Check status

```bash
supabase status
```

## 🔌 Flutter Integration

### 1. Add package to pubspec.yaml

Already added:
```yaml
dependencies:
  supabase_flutter: ^2.8.0
  firebase_core: ^3.8.1
  firebase_messaging: ^15.1.6
```

### 2. Initialize in Flutter

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase (for push notifications)
  await Firebase.initializeApp();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'http://localhost:8000',
    anonKey: 'your-anon-key',
  );

  runApp(MyApp());
}
```

### 3. Use Supabase client

```dart
final supabase = Supabase.instance.client;

// Query data
final data = await supabase.from('profiles').select();

// Insert data
await supabase.from('profiles').insert({
  'display_name': 'John Doe',
});

// Call Edge Function
final response = await supabase.functions.invoke(
  'profile-analyzer',
  body: {'user_id': userId},
);
```

## 🤖 Edge Functions (Claude Integration)

### Available Functions

1. **profile-analyzer** - Analyzes user profiles using Claude
   - Generates summary, tone analysis, tags
   - Detects safety issues

2. **content-moderator** - Moderates messages and content
   - Detects 욕설, 성희롱, 사기 징후
   - Auto-updates risk scores

3. **match-explainer** - Generates "Why this match?" explanations
   - Compares profiles and finds common interests
   - Creates human-readable match reasons

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy profile-analyzer
supabase functions deploy content-moderator
supabase functions deploy match-explainer
```

### Test locally

```bash
# Serve functions locally
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/profile-analyzer' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"user_id": "..."}'
```

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Example: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

## 📦 Services Included

### Core Supabase Stack
- **PostgreSQL 15**: Main database with pgvector extension
- **PostgREST**: Auto-generated REST API
- **GoTrue**: Authentication service
- **Realtime**: WebSocket subscriptions
- **Storage**: File storage service
- **Kong**: API Gateway
- **Supabase Studio**: Database management UI

### Additional Services (per 작업서)
- **Redis**: Caching, sessions, A/B testing flags
- **MinIO**: S3-compatible photo storage
- **MailHog**: Email testing (SMTP)
- **Metabase**: Analytics and BI dashboards
- **Adminer**: Lightweight database management

## 🧠 LLM Features (Claude API)

Per 작업서 requirements:

1. **프로필 요약 & 톤 분석**
   - Edge Function: `profile-analyzer`
   - Analyzes intro text and values
   - Generates personality scores

2. **콘텐츠 모더레이션**
   - Edge Function: `content-moderator`
   - Detects inappropriate content
   - Auto-updates risk scores

3. **매칭 이유 설명**
   - Edge Function: `match-explainer`
   - "왜 이 매칭이 좋았는지" 설명
   - Shows common interests and compatibility

Configure your Anthropic API key in `.env`:
```bash
ANTHROPIC_API_KEY=your-api-key-here
```

## 🐛 Troubleshooting

### Port conflicts

If ports are already in use, modify in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433
```

### Reset everything

```bash
docker-compose down -v
docker-compose up -d
supabase db reset
```

### Check logs

```bash
docker-compose logs supabase-db
docker-compose logs supabase-auth
docker-compose logs redis
docker-compose logs minio
```

### Redis connection test

```bash
docker exec -it projectroom-redis redis-cli ping
# Should return: PONG
```

### MinIO bucket setup

```bash
# Access MinIO console at http://localhost:9001
# Login: minioadmin / minioadmin
# Create bucket: projectroom-uploads
```

## 🚢 Production Deployment

1. Create a project at [supabase.com](https://supabase.com)
2. Get your production keys from Settings > API
3. Update your `.env` or Flutter config:

```dart
await Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-production-anon-key',
);
```

4. Deploy Edge Functions:
```bash
supabase link --project-ref your-project-ref
supabase functions deploy profile-analyzer
```

5. Set environment variables in Supabase dashboard:
   - `ANTHROPIC_API_KEY`
   - `REDIS_URL`
   - `MINIO_ENDPOINT`

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Flutter Supabase](https://supabase.com/docs/reference/dart/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [Claude API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
