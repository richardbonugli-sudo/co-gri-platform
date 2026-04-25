# SEC Baseline Run — Error State

**Run ID:** 2026-04-25T18-48-26-044Z
**Timestamp:** 2026-04-25T18:48:26.045Z

## ❌ Missing GitHub Secrets

Missing required secrets: SUPABASE_URL and/or SUPABASE_ANON_KEY. Please add these as GitHub repository secrets under Settings → Secrets and variables → Actions.

## How to Fix

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - `SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `SUPABASE_ANON_KEY` — your Supabase anon/public key
4. Re-run the **SEC Runtime Baseline** workflow