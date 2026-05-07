# Supabase Edge Functions Deployment Guide

## Overview

This guide provides detailed instructions for deploying the two Supabase Edge Functions required for Phase 2: Sustainability Reports Integration.

## Edge Functions

### 1. `fetch_sustainability_report`
**Purpose**: Discovers sustainability/ESG reports from company investor relations pages

**Location**: `supabase/functions/fetch_sustainability_report/index.ts`

**Features**:
- Web scraping of investor relations pages
- Multiple search strategies (direct links, search results)
- File type detection (PDF, HTML)
- Publication date extraction
- Timeout controls (30 seconds)

**Request Format**:
```json
{
  "ticker": "AAPL",
  "year": 2023
}
```

**Response Format**:
```json
{
  "success": true,
  "reports": [
    {
      "url": "https://...",
      "title": "2023 Environmental Progress Report",
      "publishDate": "2023-04-01",
      "fileType": "pdf",
      "fileSize": 5242880,
      "reportType": "sustainability"
    }
  ],
  "searchStrategy": "investor_relations_page",
  "processingTime": 2500,
  "requestId": "uuid"
}
```

---

### 2. `download_pdf_report`
**Purpose**: Downloads PDF files and returns base64 encoded content

**Location**: `supabase/functions/download_pdf_report/index.ts`

**Features**:
- PDF download with size limits (50MB max)
- Base64 encoding for transmission
- Timeout controls (30 seconds)
- Error handling for 404, large files

**Request Format**:
```json
{
  "url": "https://example.com/report.pdf"
}
```

**Response Format**:
```json
{
  "success": true,
  "content": "base64_encoded_pdf_content",
  "fileSize": 5242880,
  "contentType": "application/pdf",
  "downloadTime": 1500,
  "requestId": "uuid"
}
```

---

## Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** created at https://supabase.com

3. **Project credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Project API Key (anon/public): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Project REF: `your-project-ref`

4. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```

---

## Deployment Steps

### Step 1: Link Your Project

```bash
cd /workspace/shadcn-ui
supabase link --project-ref your-project-ref
```

When prompted, enter your database password.

### Step 2: Deploy Edge Functions

Deploy both edge functions:

```bash
# Deploy fetch_sustainability_report
supabase functions deploy fetch_sustainability_report

# Deploy download_pdf_report
supabase functions deploy download_pdf_report
```

### Step 3: Verify Deployment

Check that functions are deployed:

```bash
supabase functions list
```

You should see:
```
┌─────────────────────────────────┬─────────┬────────────────────────┐
│ NAME                            │ VERSION │ CREATED AT             │
├─────────────────────────────────┼─────────┼────────────────────────┤
│ fetch_sustainability_report     │ 1       │ 2025-12-09 10:00:00    │
│ download_pdf_report             │ 2       │ 2025-12-09 10:01:00    │
└─────────────────────────────────┴─────────┴────────────────────────┘
```

---

## Testing Edge Functions

### Test 1: Fetch Sustainability Report

```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/fetch_sustainability_report' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"ticker":"AAPL","year":2023}'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "reports": [
    {
      "url": "https://www.apple.com/environment/pdf/Apple_Environmental_Progress_Report_2023.pdf",
      "title": "Environmental Progress Report 2023",
      "publishDate": "2023-04-01",
      "fileType": "pdf",
      "reportType": "environmental"
    }
  ],
  "searchStrategy": "investor_relations_page",
  "processingTime": 2341
}
```

### Test 2: Download PDF Report

```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/download_pdf_report' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://www.apple.com/environment/pdf/Apple_Environmental_Progress_Report_2023.pdf"}'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "content": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSAzIDAgUj4+Pj4vQ29udGVudHMgNCAwIFI+PgplbmRvYmoK...",
  "fileSize": 5242880,
  "contentType": "application/pdf",
  "downloadTime": 1523
}
```

---

## Frontend Integration

### Update Supabase Client Configuration

Ensure your Supabase client is configured in `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variables

Add to `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Usage Example

The edge functions are automatically called by the sustainability report parser:

```typescript
import { fetchSustainabilityReport, parseSustainabilityReport } from '@/services/dataIntegration/sustainabilityReportParser';

// Fetch and parse sustainability report
const reportResult = await fetchSustainabilityReport('AAPL', 2023);

if (reportResult) {
  const sustainabilityData = await parseSustainabilityReport(
    'AAPL',
    2023,
    reportResult.content,
    reportResult.fileType,
    reportResult.url
  );
  
  console.log(`Found ${sustainabilityData.supplierData.length} supplier entries`);
  console.log(`Found ${sustainabilityData.totalFacilities} facilities`);
}
```

---

## Monitoring and Debugging

### View Function Logs

```bash
# View logs for fetch_sustainability_report
supabase functions logs fetch_sustainability_report

# View logs for download_pdf_report
supabase functions logs download_pdf_report

# Follow logs in real-time
supabase functions logs fetch_sustainability_report --follow
```

### Common Issues

#### Issue 1: CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**: Edge functions already include CORS headers. Ensure you're using the correct Supabase URL and API key.

#### Issue 2: Timeout Errors

**Symptom**: Function times out after 30 seconds

**Solution**: 
- Check if the target website is slow or blocking requests
- Consider increasing timeout in edge function code
- Implement retry logic in frontend

#### Issue 3: PDF Too Large

**Symptom**: `File too large: XXX MB (max: 50MB)` error

**Solution**:
- Increase `MAX_FILE_SIZE` constant in `download_pdf_report/index.ts`
- Redeploy the function

#### Issue 4: No Reports Found

**Symptom**: `No reports found for TICKER` message

**Solution**:
- Verify the company has a sustainability report
- Check if the company domain mapping exists in `TICKER_TO_DOMAIN`
- Add custom domain mapping if needed

---

## Performance Optimization

### Caching Strategy

The sustainability report parser implements session-based caching (1-hour TTL) to avoid redundant downloads:

```typescript
// In-memory cache (already implemented)
const reportCache = new Map<string, { content: string; fileType: 'pdf' | 'html'; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour
```

### Rate Limiting

Consider implementing rate limiting for edge functions:

```typescript
// Add to edge function
const RATE_LIMIT = 10; // requests per minute
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}
```

---

## Security Considerations

### 1. API Key Protection

- **Never** commit API keys to version control
- Use environment variables for all credentials
- Rotate keys regularly

### 2. Input Validation

Edge functions already validate:
- Ticker format
- URL format
- File size limits
- Content type

### 3. Error Handling

Edge functions return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid input)
- `404`: Resource not found
- `413`: Payload too large
- `500`: Internal server error

---

## Cost Estimation

### Supabase Edge Functions Pricing

- **Free Tier**: 500,000 invocations/month
- **Pro Tier**: $25/month + $2 per 1M invocations

### Estimated Usage

For a typical CO-GRI assessment:
- 1 call to `fetch_sustainability_report` per company
- 1 call to `download_pdf_report` per company (if PDF found)
- Average: 2 invocations per assessment

**Monthly Cost** (assuming 10,000 assessments):
- Invocations: 20,000
- Cost: Free (within free tier)

---

## Troubleshooting Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Project linked correctly
- [ ] Edge functions deployed successfully
- [ ] Environment variables set in frontend
- [ ] CORS headers present in edge functions
- [ ] Test requests return 200 OK
- [ ] Logs show successful executions
- [ ] Frontend integration working

---

## Next Steps

After deploying edge functions:

1. **Test with real companies**: Apple (AAPL), Nike (NKE), Unilever
2. **Monitor performance**: Check logs for errors and slow requests
3. **Optimize as needed**: Add caching, improve parsing logic
4. **Document findings**: Track success rates and data quality

---

## Support

For issues or questions:
- Supabase Documentation: https://supabase.com/docs/guides/functions
- MGX Community: https://docs.mgx.dev/introduction/community
- GitHub Issues: https://github.com/your-repo/issues

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0