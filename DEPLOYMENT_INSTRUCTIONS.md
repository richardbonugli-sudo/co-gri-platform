# 🚀 CSI Enhancement Backend Deployment Instructions

## Atoms Platform Deployment

### Prerequisites
- Atoms account with deployment access
- Project published at: https://zziy78.atoms.world

---

## Step 1: Add PostgreSQL Database

### Option A: Via Atoms Dashboard
1. Go to your project settings
2. Click "Add Service"
3. Select "PostgreSQL 15"
4. Name: `csi_enhancement`
5. Click "Create"
6. Copy the `DATABASE_URL` connection string

### Option B: Via Atoms CLI
```bash
atoms db create --type postgresql --version 15 --name csi_enhancement
atoms db info csi_enhancement
```

---

## Step 2: Set Environment Variables

Add these environment variables to your Atoms project:

```bash
DATABASE_URL=<your-postgres-connection-string>
NODE_ENV=production
PORT=3001
INGESTION_INTERVAL_MINUTES=15
```

### Via Atoms Dashboard:
1. Project Settings → Environment Variables
2. Add each variable
3. Save

### Via Atoms CLI:
```bash
atoms env set DATABASE_URL="postgresql://..."
atoms env set NODE_ENV="production"
atoms env set PORT="3001"
```

---

## Step 3: Run Database Migrations

Connect to your database and run migrations:

```bash
# Get database connection string
atoms db info csi_enhancement

# Run migrations
psql <DATABASE_URL> -f database/migrations/csi-enhancement/001_create_tables.sql
psql <DATABASE_URL> -f database/migrations/csi-enhancement/002_create_phase2_tables.sql
```

Or use the migration script:
```bash
npm run csi:migrate-phase2
```

---

## Step 4: Deploy Backend

### Via Atoms Dashboard:
1. Go to your project
2. Click "Deploy"
3. Ensure `server.js` is set as entry point
4. Click "Deploy Now"

### Via Atoms CLI:
```bash
atoms deploy
```

### Via Git Push:
```bash
git add .
git commit -m "Deploy Phase 1 + Phase 2 backend"
git push atoms main
```

---

## Step 5: Verify Deployment

### Check Health Endpoint:
```bash
curl https://zziy78.atoms.world/api/csi-enhancement/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "database": "connected",
  "phase1": "operational",
  "phase2": "operational"
}
```

### Check Signals Endpoint:
```bash
curl https://zziy78.atoms.world/api/csi-enhancement/signals/stats
```

### Check Enhanced CSI Endpoint:
```bash
curl https://zziy78.atoms.world/api/csi-enhancement/statistics
```

---

## Step 6: Start Background Services

### Option A: Via Atoms Scheduler
Add scheduled jobs in Atoms dashboard:

**Job 1: Signal Ingestion (every 15 minutes)**
```bash
Command: npm run csi:ingest
Schedule: */15 * * * *
```

**Job 2: CSI Calculation (daily at midnight)**
```bash
Command: npm run csi:calculate
Schedule: 0 0 * * *
```

### Option B: Via Separate Worker Service
Deploy `scheduler-phase2.ts` as a separate worker:
```bash
atoms worker create --name csi-scheduler --command "npm run csi:scheduler-phase2"
```

---

## Step 7: Verify Full System

Run the health check script:
```bash
./scripts/daily-health-check.sh
```

Expected output:
```
✅ CSI Enhancement service: RUNNING
✅ PostgreSQL database: RUNNING
Total Signals: 0 (will increase after first ingestion)
✅ API: HEALTHY
```

---

## API Endpoints Now Available

### Phase 1 Endpoints:
- `GET /api/csi-enhancement/health` - Health check
- `GET /api/csi-enhancement/signals` - All signals
- `GET /api/csi-enhancement/signals/qualified` - Qualified signals
- `GET /api/csi-enhancement/signals/country/:country` - Signals by country
- `GET /api/csi-enhancement/signals/stats` - Signal statistics

### Phase 2 Endpoints:
- `GET /api/csi-enhancement/enhanced-csi` - Enhanced CSI scores
- `GET /api/csi-enhancement/comparison` - Legacy vs Enhanced
- `GET /api/csi-enhancement/explanation/:country/:vector` - Detailed explanation
- `GET /api/csi-enhancement/statistics` - System statistics
- `GET /api/csi-enhancement/drift-by-vector` - Drift by vector
- `GET /api/csi-enhancement/drift-by-country` - Drift by country
- `GET /api/csi-enhancement/calculation-history` - Calculation history
- `POST /api/csi-enhancement/calculate` - Trigger calculation

---

## Troubleshooting

### Issue: 404 on API endpoints
**Solution:** Ensure `server.js` is running and routes are configured

### Issue: Database connection failed
**Solution:** Check `DATABASE_URL` environment variable

### Issue: No signals ingested
**Solution:** Start the scheduler or run `npm run csi:ingest` manually

### Issue: No CSI scores
**Solution:** Run `npm run csi:calculate` manually

---

## Monitoring

### Daily Health Check:
```bash
curl https://zziy78.atoms.world/api/csi-enhancement/health
```

### View Logs:
```bash
atoms logs --tail 100
```

### Check Database:
```bash
atoms db connect csi_enhancement
SELECT COUNT(*) FROM signals;
SELECT COUNT(*) FROM enhanced_csi;
```

---

## Next Steps After Deployment

1. ✅ Verify all API endpoints work
2. ✅ Run first signal ingestion
3. ✅ Run first CSI calculation
4. ✅ Start 60-day validation
5. ✅ Monitor daily with health checks

---

## Support

If you encounter issues:
1. Check Atoms logs: `atoms logs`
2. Check database: `atoms db connect`
3. Review environment variables: `atoms env list`
4. Contact Atoms support: support@atoms.dev

---

**Deployment Status:** Ready to deploy  
**Files Created:** ✅ All backend files ready  
**Configuration:** ✅ Complete  
**Next Action:** Deploy to Atoms platform  