# CSI Enhancement - Production Deployment Guide

## Deployment Date: 2026-01-26

---

## Pre-Deployment Checklist

### ✅ Infrastructure
- [x] PostgreSQL database provisioned
- [x] Docker installed and configured
- [x] Environment variables configured
- [x] Monitoring tools ready (Slack/PagerDuty)

### ✅ Code
- [x] All Phase 1 code complete
- [x] Configuration files created
- [x] Docker Compose setup
- [x] Scheduler implemented

### ✅ Database
- [x] Migration scripts ready
- [x] Indexes configured
- [x] Views created
- [x] Data sources pre-loaded

---

## Deployment Steps

### Step 1: Start Infrastructure (5 minutes)

```bash
# Navigate to project directory
cd /workspace/shadcn-ui

# Start PostgreSQL and ingestion service
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected Output:**
```
NAME            STATUS    PORTS
csi-postgres    Up        0.0.0.0:5432->5432/tcp
csi-ingestion   Up        
```

---

### Step 2: Verify Database (2 minutes)

```bash
# Check database connection
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT 1"

# Verify tables created
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "\dt"
```

**Expected Output:**
```
                List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | data_sources          | table | postgres
 public | signal_corroboration  | table | postgres
 public | signal_persistence    | table | postgres
 public | signals               | table | postgres
```

---

### Step 3: Run Initial Ingestion (10 minutes)

```bash
# Run first ingestion manually
docker exec csi-ingestion npm run csi:ingest
```

**Expected Output:**
```
🚀 Starting CSI Enhancement Ingestion...

[Orchestrator] Initializing default clients...
[Orchestrator] Registered client: gdelt
[Orchestrator] Starting ingestion run...
[Orchestrator] Fetching from gdelt...
[Orchestrator] Fetched 250 signals from gdelt

📊 Ingestion Complete:
   Signals Ingested: 250
   Signals Parsed: 245
   Signals Qualified: 98
   Signals Rejected: 147
   Errors: 0
   Duration: 12500ms
```

---

### Step 4: Verify Data (2 minutes)

```bash
# Check signal count
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT COUNT(*) FROM signals"

# Check qualified signals
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT COUNT(*) FROM signals WHERE is_qualified = TRUE"

# Check country coverage
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT * FROM signal_stats_by_country LIMIT 10"
```

---

### Step 5: Monitor System (Ongoing)

```bash
# View real-time logs
docker-compose logs -f csi-ingestion

# Check system health
docker exec csi-ingestion npm run csi:health

# View metrics
docker exec csi-ingestion npm run csi:monitor
```

---

## Production Monitoring

### Automated Ingestion Schedule

The scheduler runs automatically every 15 minutes:
- **00:00, 00:15, 00:30, 00:45** - Every hour

### Health Checks

```bash
# Manual health check
curl http://localhost:3000/api/csi-enhancement/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": true,
    "ingestion": true,
    "errors": true
  },
  "message": "All systems operational"
}
```

### Metrics Dashboard

Access metrics at:
```
http://localhost:3000/csi-enhancement/dashboard
```

---

## Alert Configuration

### Slack Alerts

Configure Slack webhook in `.env`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Alert Conditions

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Low Ingestion Rate | <50 signals/run | Warning |
| High Error Rate | >5% | Critical |
| Low Qualification Rate | <30% | Info |
| Database Down | Connection failed | Critical |

---

## Operational Procedures

### Daily Tasks

1. **Morning Check (9:00 AM)**
   ```bash
   docker exec csi-ingestion npm run csi:health
   docker exec csi-ingestion npm run csi:stats
   ```

2. **Review Alerts**
   - Check Slack channel for overnight alerts
   - Investigate any critical issues

3. **Verify Data Quality**
   - Sample 10 random qualified signals
   - Verify country attribution accuracy
   - Check vector classification

### Weekly Tasks

1. **Performance Review**
   ```bash
   docker exec csi-ingestion npm run csi:monitor
   ```
   - Review ingestion rates
   - Check qualification rates
   - Analyze geographic coverage

2. **Database Maintenance**
   ```bash
   # Check database size
   docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT pg_size_pretty(pg_database_size('csi_enhancement'))"
   
   # Vacuum analyze
   docker exec csi-postgres psql -U postgres -d csi_enhancement -c "VACUUM ANALYZE"
   ```

3. **Backup Database**
   ```bash
   docker exec csi-postgres pg_dump -U postgres csi_enhancement > backup_$(date +%Y%m%d).sql
   ```

### Monthly Tasks

1. **Review Metrics**
   - Total signals ingested
   - Qualification rate trends
   - Geographic coverage expansion
   - System uptime

2. **Optimize Performance**
   - Review slow queries
   - Update indexes if needed
   - Adjust corroboration thresholds

3. **Stakeholder Report**
   - Generate monthly summary
   - Highlight key metrics
   - Identify improvement areas

---

## Troubleshooting

### Issue: Low Ingestion Rate

**Symptoms:**
- <50 signals per run
- Alert: "Low Ingestion Rate"

**Diagnosis:**
```bash
# Check GDELT API status
curl "https://api.gdeltproject.org/api/v2/doc/doc?query=sanctions&mode=artlist&maxrecords=1&format=json"

# Check logs
docker-compose logs csi-ingestion | grep ERROR
```

**Resolution:**
1. Verify GDELT API is accessible
2. Check network connectivity
3. Review query parameters
4. Restart ingestion service if needed

---

### Issue: High Error Rate

**Symptoms:**
- >5% error rate
- Alert: "High Error Rate"

**Diagnosis:**
```bash
# Check error logs
docker-compose logs csi-ingestion | grep -A 5 "Error processing signal"

# Check database connection
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT 1"
```

**Resolution:**
1. Review error messages
2. Check database connectivity
3. Verify data format
4. Update parser logic if needed

---

### Issue: Database Performance

**Symptoms:**
- Slow queries
- High CPU usage
- Timeouts

**Diagnosis:**
```bash
# Check slow queries
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Check table sizes
docker exec csi-postgres psql -U postgres -d csi_enhancement -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text)) FROM pg_tables WHERE schemaname = 'public'"
```

**Resolution:**
1. Add missing indexes
2. Vacuum and analyze tables
3. Archive old data
4. Increase database resources

---

## Rollback Procedure

If critical issues arise:

```bash
# Stop ingestion service
docker-compose stop csi-ingestion

# Restore database from backup
docker exec -i csi-postgres psql -U postgres -d csi_enhancement < backup_YYYYMMDD.sql

# Restart services
docker-compose up -d
```

---

## Success Metrics (First 30 Days)

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Signal Volume | 1,000+ | Count in signals table |
| Qualification Rate | 30-50% | Qualified / Total |
| Geographic Coverage | 50+ countries | Distinct countries |
| System Uptime | >99.5% | Monitoring logs |
| Error Rate | <5% | Errors / Total |
| Avg Ingestion Latency | <5 min | Timestamp diff |

### Weekly Review

Track progress in spreadsheet:
- Week 1: Baseline metrics
- Week 2: Identify issues
- Week 3: Optimize thresholds
- Week 4: Validate stability

---

## Phase 2 Preparation

### Data Collection Goals

By end of Week 4:
- **30,000+ signals** in database
- **50+ countries** covered
- **All 7 vectors** (SC1-SC7) represented
- **Validated corroboration** rules
- **Stable qualification** rate

### Phase 2 Kickoff Criteria

✅ Phase 1 running stable for 30 days
✅ No critical issues in last 2 weeks
✅ Sufficient historical data collected
✅ Team trained on operations
✅ Stakeholder approval obtained

---

## Support Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Engineering Lead | engineering@company.com | 24/7 |
| Database Admin | dba@company.com | Business hours |
| DevOps | devops@company.com | 24/7 |
| Product Owner | product@company.com | Business hours |

---

## Deployment Sign-Off

- [ ] Infrastructure provisioned
- [ ] Code deployed
- [ ] Database migrated
- [ ] Initial ingestion successful
- [ ] Monitoring configured
- [ ] Alerts tested
- [ ] Documentation complete
- [ ] Team trained

**Deployed By:** _________________
**Date:** 2026-01-26
**Time:** _________________

---

## Next Steps

1. **Day 1-7:** Monitor closely, fix issues
2. **Day 8-14:** Optimize thresholds
3. **Day 15-21:** Validate data quality
4. **Day 22-30:** Prepare Phase 2 requirements
5. **Day 31+:** Begin Phase 2 development

**Phase 1 is now LIVE in production! 🚀**