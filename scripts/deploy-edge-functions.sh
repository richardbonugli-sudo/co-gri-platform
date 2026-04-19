#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys the sustainability report edge functions to Supabase

set -e

echo "============================================"
echo "Supabase Edge Functions Deployment"
echo "============================================"
echo ""

# Check if project ref is provided
if [ -z "$1" ]; then
  echo "❌ Error: Project REF is required"
  echo ""
  echo "Usage: ./scripts/deploy-edge-functions.sh <PROJECT_REF>"
  echo "Example: ./scripts/deploy-edge-functions.sh aiwcckbkqlwvbibzvupb"
  echo ""
  exit 1
fi

PROJECT_REF=$1

echo "📦 Project REF: $PROJECT_REF"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI not found. Installing via npx..."
  echo ""
  
  # Use npx to run supabase commands
  SUPABASE_CMD="npx supabase@latest"
else
  SUPABASE_CMD="supabase"
fi

echo "🔗 Linking to Supabase project..."
$SUPABASE_CMD link --project-ref $PROJECT_REF

echo ""
echo "🚀 Deploying edge functions..."
echo ""

# Deploy fetch_sustainability_report
echo "📤 Deploying fetch_sustainability_report..."
$SUPABASE_CMD functions deploy fetch_sustainability_report --no-verify-jwt

echo ""

# Deploy download_pdf_report
echo "📤 Deploying download_pdf_report..."
$SUPABASE_CMD functions deploy download_pdf_report --no-verify-jwt

echo ""
echo "✅ Deployment complete!"
echo ""

# List deployed functions
echo "📋 Listing deployed functions..."
$SUPABASE_CMD functions list

echo ""
echo "============================================"
echo "✅ All edge functions deployed successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Test the functions using the examples in docs/SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md"
echo "2. Update your frontend .env.local with Supabase credentials"
echo "3. Run a CO-GRI assessment to validate the integration"
echo ""