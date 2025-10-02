#!/bin/bash
set -e

echo "🚀 Initializing Supabase local development environment..."

# Copy .env.example to .env if it doesn't exist
if [ ! -f /workspaces/projectRoom/.env ]; then
    echo "📝 Creating .env from .env.example..."
    cp /workspaces/projectRoom/.env.example /workspaces/projectRoom/.env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please rebuild the devcontainer."
    exit 1
fi

echo "✅ Supabase CLI is installed"
supabase --version

# Initialize Supabase project if not already initialized
if [ ! -f /workspaces/projectRoom/supabase/config.toml ]; then
    echo "📦 Initializing Supabase project..."
    cd /workspaces/projectRoom
    supabase init
else
    echo "ℹ️  Supabase project already initialized"
fi

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: docker-compose up -d"
echo "  2. Run: supabase db reset (to apply migrations)"
echo "  3. Access Supabase Studio: http://localhost:3000"
echo "  4. Access API: http://localhost:8000"
echo ""
