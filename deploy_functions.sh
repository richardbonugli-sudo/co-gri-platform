#!/bin/bash
echo "Deploying edge functions to Supabase..."

# Deploy fetch_sec_cik
curl -X POST "https://api.supabase.com/v1/projects/aiwcckbkqlwvbibzvupb/functions/fetch_sec_cik" \
  -H "Authorization: Bearer $(cat ~/.supabase/access-token 2>/dev/null || echo '')" \
  -H "Content-Type: application/json" \
  -d @supabase/functions/fetch_sec_cik/index.ts

echo ""
echo "Functions deployment initiated. Please check Supabase dashboard."
