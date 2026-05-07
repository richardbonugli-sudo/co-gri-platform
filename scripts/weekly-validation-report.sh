#!/bin/bash
# Weekly Validation Report Script
# Run: ./scripts/weekly-validation-report.sh

REPORT_FILE="validation_report_$(date +%Y%m%d).md"

cat > "$REPORT_FILE" << 'EOF'
# Weekly Validation Report

**Report Date:** $(date)  
**Week:** Week X of 8  
**Status:** 🟡 IN PROGRESS  

---

## Executive Summary

[Brief summary of the week's findings]

---

## Phase 1 - Signal Ingestion

### Signal Volume

EOF

# Signal statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Date | Total | Qualified | Rate |' || E'\n' ||
  '|------|-------|-----------|------|' || E'\n' ||
  string_agg(
    '| ' || DATE(detected_at) || 
    ' | ' || COUNT(*) || 
    ' | ' || COUNT(*) FILTER (WHERE is_qualified = true) || 
    ' | ' || ROUND(100.0 * COUNT(*) FILTER (WHERE is_qualified = true) / COUNT(*), 1) || '% |',
    E'\n' ORDER BY DATE(detected_at) DESC
  )
FROM signals
WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(detected_at);
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

### Country Coverage

EOF

# Country statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  'Total Countries: ' || COUNT(DISTINCT country) || E'\n' ||
  'Top 10 Countries by Signal Count:' || E'\n\n' ||
  '| Country | Signals | Qualified |' || E'\n' ||
  '|---------|---------|-----------|' || E'\n' ||
  string_agg(
    '| ' || country || 
    ' | ' || signal_count || 
    ' | ' || qualified_count || ' |',
    E'\n' ORDER BY signal_count DESC
  )
FROM (
  SELECT 
    unnest(countries) as country,
    COUNT(*) as signal_count,
    COUNT(*) FILTER (WHERE is_qualified = true) as qualified_count
  FROM signals
  WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY unnest(countries)
  ORDER BY COUNT(*) DESC
  LIMIT 10
) t;
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

### Vector Distribution

EOF

# Vector statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Vector | Signals | Percentage |' || E'\n' ||
  '|--------|---------|------------|' || E'\n' ||
  string_agg(
    '| ' || primary_vector || 
    ' | ' || COUNT(*) || 
    ' | ' || ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) || '% |',
    E'\n' ORDER BY primary_vector
  )
FROM signals
WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY primary_vector;
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

---

## Phase 2 - Enhanced CSI

### Drift Distribution

EOF

# Drift statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Vector | Count | Avg Drift | Max Drift | Min Drift |' || E'\n' ||
  '|--------|-------|-----------|-----------|-----------|' || E'\n' ||
  string_agg(
    '| ' || vector || 
    ' | ' || COUNT(*) || 
    ' | ' || ROUND(AVG(baseline_drift), 2) || 
    ' | ' || ROUND(MAX(baseline_drift), 2) || 
    ' | ' || ROUND(MIN(baseline_drift), 2) || ' |',
    E'\n' ORDER BY vector
  )
FROM latest_enhanced_csi
GROUP BY vector;
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

### Top 10 Drifts

EOF

# Top drifts
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Country | Vector | Legacy | Enhanced | Drift |' || E'\n' ||
  '|---------|--------|--------|----------|-------|' || E'\n' ||
  string_agg(
    '| ' || country || 
    ' | ' || vector || 
    ' | ' || ROUND(legacy_csi, 1) || 
    ' | ' || ROUND(enhanced_csi, 1) || 
    ' | ' || ROUND(baseline_drift, 1) || ' |',
    E'\n' ORDER BY ABS(baseline_drift) DESC
  )
FROM latest_enhanced_csi
ORDER BY ABS(baseline_drift) DESC
LIMIT 10;
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

### Calculation Performance

EOF

# Performance statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Metric | Value |' || E'\n' ||
  '|--------|-------|' || E'\n' ||
  '| Total Runs | ' || COUNT(*) || ' |' || E'\n' ||
  '| Successful | ' || COUNT(*) FILTER (WHERE status = 'completed') || ' |' || E'\n' ||
  '| Failed | ' || COUNT(*) FILTER (WHERE status = 'failed') || ' |' || E'\n' ||
  '| Avg Duration | ' || ROUND(AVG(duration_ms)) || ' ms |' || E'\n' ||
  '| Avg Calculations | ' || ROUND(AVG(total_calculations)) || ' |'
FROM csi_calculation_log
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days';
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

---

## System Performance

### Database Statistics

EOF

# Database statistics
docker exec csi-postgres psql -U postgres -d csi_enhancement -t -c "
SELECT 
  '| Metric | Value |' || E'\n' ||
  '|--------|-------|' || E'\n' ||
  '| Database Size | ' || pg_size_pretty(pg_database_size('csi_enhancement')) || ' |' || E'\n' ||
  '| Total Signals | ' || (SELECT COUNT(*) FROM signals) || ' |' || E'\n' ||
  '| Total CSI Scores | ' || (SELECT COUNT(*) FROM enhanced_csi) || ' |' || E'\n' ||
  '| Signals Table | ' || pg_size_pretty(pg_total_relation_size('signals')) || ' |' || E'\n' ||
  '| Enhanced CSI Table | ' || pg_size_pretty(pg_total_relation_size('enhanced_csi')) || ' |'
FROM (SELECT 1) t;
" >> "$REPORT_FILE" 2>/dev/null

cat >> "$REPORT_FILE" << 'EOF'

---

## Issues & Observations

### Issues Encountered

- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Key Observations

1. Observation 1
2. Observation 2
3. Observation 3

---

## Recommendations

1. Recommendation 1
2. Recommendation 2
3. Recommendation 3

---

## Next Week Plan

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

---

**Report Generated:** $(date)  
**Generated By:** Validation Script  
**Next Report:** $(date -d '+7 days')  

EOF

echo "✅ Weekly validation report generated: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"