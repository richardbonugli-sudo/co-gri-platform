# Manual Supabase Edge Functions Deployment Guide

Since automated CLI installation is restricted, here are **three alternative deployment methods**:

---

## Method 1: Using npx (Recommended - No Installation Required)

This method uses `npx` to run Supabase CLI without installing it globally.

### Step 1: Link Your Project

```bash
cd /workspace/shadcn-ui
npx supabase@latest link --project-ref aiwcckbkqlwvbibzvupb
```

When prompted, enter your **database password**.

### Step 2: Deploy Edge Functions

```bash
# Deploy fetch_sustainability_report
npx supabase@latest functions deploy fetch_sustainability_report --no-verify-jwt

# Deploy download_pdf_report
npx supabase@latest functions deploy download_pdf_report --no-verify-jwt
```

### Step 3: Verify Deployment

```bash
npx supabase@latest functions list
```

You should see both functions listed with status "ACTIVE".

---

## Method 2: Using the Deployment Script

I've created a deployment script that automates the process.

### Run the Script:

```bash
cd /workspace/shadcn-ui
./scripts/deploy-edge-functions.sh aiwcckbkqlwvbibzvupb
```

The script will:
1. Link to your Supabase project
2. Deploy both edge functions
3. List all deployed functions
4. Show next steps

---

## Method 3: Manual Deployment via Supabase Dashboard

If CLI methods don't work, you can deploy manually through the Supabase Dashboard.

### Step 1: Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/aiwcckbkqlwvbibzvupb/functions

### Step 2: Create New Function

Click **"New Function"** button.

### Step 3: Deploy fetch_sustainability_report

1. **Function Name**: `fetch_sustainability_report`
2. **Copy the entire content** from:
   `/workspace/shadcn-ui/supabase/functions/fetch_sustainability_report/index.ts`
3. Paste into the editor
4. Click **"Deploy"**

### Step 4: Deploy download_pdf_report

1. **Function Name**: `download_pdf_report`
2. **Copy the entire content** from:
   `/workspace/shadcn-ui/supabase/functions/download_pdf_report/index.ts`
3. Paste into the editor
4. Click **"Deploy"**

### Step 5: Verify Deployment

In the Functions tab, you should see:
- ✅ `fetch_sustainability_report` - Status: Active
- ✅ `download_pdf_report` - Status: Active

---

## Testing After Deployment

### Test 1: Fetch Sustainability Report

```bash
curl -i --location --request POST \
  'https://aiwcckbkqlwvbibzvupb.supabase.co/functions/v1/fetch_sustainability_report' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"ticker":"AAPL","year":2023}'
```

**Expected Response**: 200 OK with list of reports

### Test 2: Download PDF Report

```bash
curl -i --location --request POST \
  'https://aiwcckbkqlwvbibzvupb.supabase.co/functions/v1/download_pdf_report' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://www.apple.com/environment/pdf/Apple_Environmental_Progress_Report_2023.pdf"}'
```

**Expected Response**: 200 OK with base64 encoded PDF content

---

## Get Your Anon Key

1. Go to: https://supabase.com/dashboard/project/aiwcckbkqlwvbibzvupb/settings/api
2. Copy the **"anon public"** key
3. Use it in the `Authorization: Bearer` header for testing

---

## Frontend Configuration

After deployment, update your `.env.local`:

```bash
VITE_SUPABASE_URL=https://aiwcckbkqlwvbibzvupb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Troubleshooting

### Issue: "Function not found"
- **Solution**: Wait 1-2 minutes after deployment for functions to become active

### Issue: "Invalid JWT"
- **Solution**: Make sure you're using the correct anon key from project settings

### Issue: "CORS error"
- **Solution**: Edge functions already include CORS headers. Check that you're using the correct project URL

### Issue: "Timeout"
- **Solution**: Some sustainability reports are large. The timeout is set to 30 seconds, which should be sufficient for most cases.

---

## Next Steps

1. ✅ Deploy both edge functions using one of the methods above
2. ✅ Test the functions with curl commands
3. ✅ Update frontend `.env.local` with credentials
4. ✅ Run a CO-GRI assessment to validate the integration

---

**Need Help?** Refer to the comprehensive guide at:
`/workspace/shadcn-ui/docs/SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md`