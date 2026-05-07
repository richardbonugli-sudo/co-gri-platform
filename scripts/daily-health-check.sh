#!/bin/bash
# Daily Health Check Script
# Run: ./scripts/daily-health-check.sh

echo "========================================="
echo "CSI Enhancement Daily Health Check"
echo "Date: $(date)"
echo "========================================="
echo ""

# Phase 1 - Signal Ingestion
echo "📊 Phase 1 - Signal Ingestion"
echo "-----------------------------------"

# Check if services are running
if docker ps | grep -q csi-enhancement; then
    echo "✅ CSI Enhancement service: RUNNING"
else
    echo "❌ CSI Enhancement service: NOT RUNNING"
fi

if docker ps | grep -q csi-postgres; then
    echo "✅ PostgreSQL database: RUNNING"
else
    echo "❌ PostgreSQL database: NOT RUNNING"
fi

echo ""

# Signal statistics (last 24 hours)
echo "Signal Statistics (Last 24 hours):"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  'Total Signals: ' || COUNT(*) || E'\n' ||
  'Qualified Signals: ' || COUNT(*) FILTER (WHERE is_qualified = true) || E'\n' ||
  'Qualification Rate: ' || ROUND(100.0 * COUNT(*) FILTER (WHERE is_qualified = true) / NULLIF(COUNT(*), 0), 2) || '%' || E'\n' ||
  'Unique Countries: ' || COUNT(DISTINCT unnest(countries)) || E'\n' ||
  'Unique Vectors: ' || COUNT(DISTINCT primary_vector)
FROM signals
WHERE detected_at >= NOW() - INTERVAL '24 hours';
" 2>/dev/null || echo "⚠️  Database query failed"

echo ""

# Phase 2 - Enhanced CSI
echo "📈 Phase 2 - Enhanced CSI"
echo "-----------------------------------"

# CSI statistics
echo "Enhanced CSI Statistics:"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  'Total Scores: ' || COUNT(*) || E'\n' ||
  'Countries: ' || COUNT(DISTINCT country) || E'\n' ||
  'Vectors: ' || COUNT(DISTINCT vector) || E'\n' ||
  'Avg Drift: ' || ROUND(AVG(baseline_drift), 2) || ' points' || E'\n' ||
  'Max Drift: ' || ROUND(MAX(baseline_drift), 2) || ' points' || E'\n' ||
  'Min Drift: ' || ROUND(MIN(baseline_drift), 2) || ' points'
FROM latest_enhanced_csi;
" 2>/dev/null || echo "⚠️  Database query failed"

echo ""

# Recent calculations
echo "Recent Calculations:"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  'Last Calculation: ' || MAX(started_at) || E'\n' ||
  'Status: ' || status || E'\n' ||
  'Duration: ' || duration_ms || 'ms' || E'\n' ||
  'Calculations: ' || total_calculations
FROM csi_calculation_log
WHERE started_at >= NOW() - INTERVAL '24 hours'
GROUP BY status, duration_ms, total_calculations
ORDER BY MAX(started_at) DESC
LIMIT 1;
" 2>/dev/null || echo "⚠️  No recent calculations found"

echo ""

# System Health
echo "🏥 System Health"
echo "-----------------------------------"

# Database size
echo "Database Size:"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT pg_size_pretty(pg_database_size('csi_enhancement'));
" 2>/dev/null || echo "⚠️  Database query failed"

# Table sizes
echo ""
echo "Table Sizes:"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  'signals: ' || pg_size_pretty(pg_total_relation_size('signals')) || E'\n' ||
  'enhanced_csi: ' || pg_size_pretty(pg_total_relation_size('enhanced_csi')) || E'\n' ||
  'signal_contributions: ' || pg_size_pretty(pg_total_relation_size('signal_contributions'))
FROM (SELECT 1) t;
" 2>/dev/null || echo "⚠️  Database query failed"

echo ""

# Error check (last 24 hours)
echo "Error Summary (Last 24 hours):"
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  COALESCE('Failed Calculations: ' || COUNT(*), 'No errors found')
FROM csi_calculation_log
WHERE status = 'failed' 
  AND started_at >= NOW() - INTERVAL '24 hours';
" 2>/dev/null || echo "⚠️  Database query failed"

echo ""

# API Health (if running)
echo "API Health:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/csi-enhancement/health 2>/dev/null | grep -q "200"; then
    echo "✅ API: HEALTHY"
else
    echo "⚠️  API: NOT RESPONDING (or not exposed)"
fi

echo ""
echo "========================================="
echo "Health Check Complete"
echo "========================================="
echo ""

# Summary
echo "📋 Summary:"
echo "- Check logs if any ❌ or ⚠️  appear above"
echo "- Run 'docker-compose -f docker-compose-phase2.yml logs -f' for details"
echo "- Run 'npm run csi:stats' for more statistics"
echo ""