# CSI Validation Suite Report

**Generated:** 2026-03-01T22:04:01.890Z
**Duration:** 0.01s

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Suites | 6 |
| Total Tests | 22 |
| Total Checks | 117 |
| ✅ Passed Tests | 21 |
| ❌ Failed Tests | 1 |
| ✅ Passed Checks | 116 |
| ❌ Failed Checks | 1 |
| **Overall Pass Rate** | **99.1%** |

### Overall Status: ⚠️ MOSTLY PASSING (some failures)

---

## 📋 Detailed Results

### ✅ Time Series Validation (3/3 tests passed)

#### ✅ China - trade_war (SC2) (9/9 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Detection Marker Present | ✅ | DETECTION marker in timeline | Found at day 3 |
| Escalation Drift Onset Present | ✅ | ESCALATION_DRIFT_ONSET marker in timeline | Found at day 5 |
| Event Confirmation Present | ✅ | EVENT_CONFIRMATION marker in timeline | Found at day 15 |
| Netting Application Present | ✅ | NETTING_APPLICATION marker in timeline | Found at day 16 |
| Decay Initiation Present | ✅ | DECAY_INITIATION marker in timeline | Found at day 20 |
| CSI Formula Correctness | ✅ | Baseline + Drift + Delta = Composite for all points | All points match |
| Escalation Drift Increases Before Confirmation | ✅ | Drift monotonically increasing before confirmation | Drift increasing correctly |
| Decay Reduces Event Delta | ✅ | Event delta decreases after decay initiation | Decay working correctly |
| CSI Decays From Peak | ✅ | Final CSI < Peak CSI | Peak: 69.50, Final: 49.26 |

#### ✅ Venezuela - sanctions (SC2) (9/9 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Detection Marker Present | ✅ | DETECTION marker in timeline | Found at day 2 |
| Escalation Drift Onset Present | ✅ | ESCALATION_DRIFT_ONSET marker in timeline | Found at day 4 |
| Event Confirmation Present | ✅ | EVENT_CONFIRMATION marker in timeline | Found at day 12 |
| Netting Application Present | ✅ | NETTING_APPLICATION marker in timeline | Found at day 13 |
| Decay Initiation Present | ✅ | DECAY_INITIATION marker in timeline | Found at day 18 |
| CSI Formula Correctness | ✅ | Baseline + Drift + Delta = Composite for all points | All points match |
| Escalation Drift Increases Before Confirmation | ✅ | Drift monotonically increasing before confirmation | Drift increasing correctly |
| Decay Reduces Event Delta | ✅ | Event delta decreases after decay initiation | Decay working correctly |
| CSI Decays From Peak | ✅ | Final CSI < Peak CSI | Peak: 90.00, Final: 66.65 |

#### ✅ Russia - military_conflict (SC1) (9/9 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Detection Marker Present | ✅ | DETECTION marker in timeline | Found at day 1 |
| Escalation Drift Onset Present | ✅ | ESCALATION_DRIFT_ONSET marker in timeline | Found at day 3 |
| Event Confirmation Present | ✅ | EVENT_CONFIRMATION marker in timeline | Found at day 10 |
| Netting Application Present | ✅ | NETTING_APPLICATION marker in timeline | Found at day 11 |
| Decay Initiation Present | ✅ | DECAY_INITIATION marker in timeline | Found at day 15 |
| CSI Formula Correctness | ✅ | Baseline + Drift + Delta = Composite for all points | All points match |
| Escalation Drift Increases Before Confirmation | ✅ | Drift monotonically increasing before confirmation | Drift increasing correctly |
| Decay Reduces Event Delta | ✅ | Event delta decreases after decay initiation | Decay working correctly |
| CSI Decays From Peak | ✅ | Final CSI < Peak CSI | Peak: 86.50, Final: 59.88 |

---

### ✅ Signal Trace Validation (2/2 tests passed)

#### ✅ China Silver Export Restriction (8/8 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Minimum Independent Sources (≥2) | ✅ | ≥2 independent sources | 4 independent sources |
| Persistence Threshold (48-72hr) | ✅ | ≥48 hours persistence | 52.0 hours |
| Average Credibility (≥0.7) | ✅ | ≥0.7 average credibility | 0.920 average credibility |
| Overall Corroboration | ✅ | Corroborated (all 3 criteria met) | CORROBORATED |
| Official Source Present | ✅ | At least one OFFICIAL source | Official source found |
| Source Category Diversity (≥2 categories) | ✅ | ≥2 source categories | 2 categories: NEWS_TIER1, OFFICIAL |
| Credibility Scores Valid (0-1) | ✅ | All credibility scores between 0 and 1 | All valid |
| Severity Range Valid (1-10) | ✅ | Severity between 1 and 10 | Severity: 7 |

#### ✅ PRC Sanctions on U.S. Defense-Related Firms (8/8 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Minimum Independent Sources (≥2) | ✅ | ≥2 independent sources | 5 independent sources |
| Persistence Threshold (48-72hr) | ✅ | ≥48 hours persistence | 60.0 hours |
| Average Credibility (≥0.7) | ✅ | ≥0.7 average credibility | 0.876 average credibility |
| Overall Corroboration | ✅ | Corroborated (all 3 criteria met) | CORROBORATED |
| Official Source Present | ✅ | At least one OFFICIAL source | Official source found |
| Source Category Diversity (≥2 categories) | ✅ | ≥2 source categories | 4 categories: OFFICIAL, NEWS_TIER1, NEWS_TIER2, RESEARCH |
| Credibility Scores Valid (0-1) | ✅ | All credibility scores between 0 and 1 | All valid |
| Severity Range Valid (1-10) | ✅ | Severity between 1 and 10 | Severity: 8 |

---

### ⚠️ QA Scenario Validation (2/3 tests passed)

#### ✅ Russia: Russia Military Conflict & Sanctions Scenario (5/5 expected pass) (5/5 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Baseline CSI within expected range | ✅ | Baseline CSI between 50 and 70 | PASSED |
| Military conflict escalation drift positive | ✅ | Escalation drift > 0 | PASSED |
| Sanctions event delta significant | ✅ | Event delta ≥ 5.0 | PASSED |
| Composite CSI exceeds alert threshold | ✅ | Composite CSI > 70 | PASSED |
| Decay reduces CSI after 30 days | ✅ | Event delta at day 30 ≈ 50% of initial | PASSED |

#### ❌ China-Taiwan: China-Taiwan Strait Tensions Scenario (9/10 expected, 1 intentional failure) (9/10 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| China baseline CSI within range | ✅ | Baseline CSI between 40 and 55 | PASSED |
| Military vector (SC1) activated | ✅ | SC1 vector active | PASSED |
| Economic vector (SC2) activated | ✅ | SC2 vector active | PASSED |
| Diplomatic vector (SC4) activated | ✅ | SC4 vector active | PASSED |
| Escalation drift rate appropriate | ✅ | Drift rate between 1.5 and 3.0 per day | PASSED |
| Netting correctly absorbs escalation drift | ✅ | Post-netting drift < pre-netting drift | PASSED |
| Multi-source corroboration achieved | ✅ | ≥2 independent sources | PASSED |
| Credibility threshold met | ✅ | Average credibility ≥ 0.7 | PASSED |
| Cross-strait tension severity appropriate | ✅ | Severity between 6 and 9 | PASSED |
| INTENTIONAL FAILURE: Impossible threshold test | ❌ | CSI should be below 20 (impossible for active conflict) | FAILED |

#### ✅ Venezuela: Venezuela Sanctions & Political Instability Scenario (all expected pass) (7/7 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Baseline CSI reflects high instability | ✅ | Baseline CSI between 60 and 75 | PASSED |
| Sanctions event properly categorized | ✅ | Event vector = SC2 | PASSED |
| Political instability on SC3 vector | ✅ | SC3 vector active | PASSED |
| Social unrest on SC6 vector | ✅ | SC6 vector active | PASSED |
| Composite CSI exceeds critical threshold | ✅ | Composite CSI > 75 | PASSED |
| Event delta proportional to severity | ✅ | Event delta = severity * 1.5 | PASSED |
| Decay half-life is 30 days | ✅ | Decay at 30 days ≈ 50% of initial | PASSED |

---

### ✅ Decay Behavior Validation (5/5 tests passed)

#### ✅ Half-Life Decay Validation (3/3 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| 30-day half-life produces 50% decay | ✅ | 5.0000 | 5.0000 |
| 60-day decay produces ~25% of initial | ✅ | 2.5000 | 2.5000 |
| 90-day decay produces ~12.5% of initial | ✅ | 1.2500 | 1.2500 |

#### ✅ Monotonic Decrease Validation (2/2 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Decay is monotonically decreasing over 120 days | ✅ | Monotonically decreasing | Monotonically decreasing |
| Decay never produces negative values | ✅ | > 0 at day 365 | 0.00326257 at day 365 |

#### ✅ Decay Formula Correctness (6/6 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Decay constant λ = ln(2)/30 | ✅ | λ = 0.0231049060 | λ = 0.0231049060 |
| Formula at t=0: e^(-λ*0) | ✅ | 1.000000 | 1.000000 |
| Formula at t=30: e^(-λ*30) | ✅ | 0.500000 | 0.500000 |
| Formula at t=60: e^(-λ*60) | ✅ | 0.250000 | 0.250000 |
| Formula at t=1: e^(-λ*1) | ✅ | 0.977160 | 0.977160 |
| Formula at t=15: e^(-λ*15) | ✅ | 0.707107 | 0.707107 |

#### ✅ Severity-Independent Decay Rate (4/4 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Severity 3: same decay rate at 30 days | ✅ | Ratio ≈ 0.5 | Ratio = 0.500000 |
| Severity 5: same decay rate at 30 days | ✅ | Ratio ≈ 0.5 | Ratio = 0.500000 |
| Severity 7: same decay rate at 30 days | ✅ | Ratio ≈ 0.5 | Ratio = 0.500000 |
| Severity 9: same decay rate at 30 days | ✅ | Ratio ≈ 0.5 | Ratio = 0.500000 |

#### ✅ Near-Zero Convergence (2/2 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Convergence to near-zero after 300 days | ✅ | < 0.01 | 0.00976563 |
| Below 2% of initial after 180 days | ✅ | < 0.2000 | 0.1563 |

---

### ✅ Netting Validation (5/5 tests passed)

#### ✅ Same-Vector Netting (4/4 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Same-vector netting reduces drift | ✅ | < 8 | 2.0000 |
| Netting formula: max(0, drift - delta * 0.5) | ✅ | 2.0000 | 2.0000 |
| Post-netting drift ≥ 0 | ✅ | ≥ 0 | 2.0000 |
| Composite CSI changes after netting | ✅ | ≠ 70.00 | 64.00 |

#### ✅ Cross-Vector Isolation (3/3 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| SC1 drift unchanged after SC2 netting | ✅ | 6.0 | 6 |
| SC1 baseline unchanged after SC2 netting | ✅ | 55.0 | 55 |
| SC2 drift changed after netting | ✅ | < 8 | 2.0000 |

#### ✅ Full Absorption (1/1 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Large event fully absorbs small drift | ✅ | 0 | 0.0000 |

#### ✅ Partial Absorption (2/2 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Small event partially absorbs large drift | ✅ | Between 0 and 10 | 8.0000 |
| Partial absorption formula correct | ✅ | 8.0000 | 8.0000 |

#### ✅ Zero Drift Netting (1/1 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| Zero drift remains zero after netting | ✅ | 0 | 0.0000 |

---

### ✅ Cross-Vector Contamination Validation (4/4 tests passed)

#### ✅ SC1 Military Event Isolation (8/8 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| SC1 (Military) correctly modified | ✅ | > 45 | 69.00 |
| No contamination to SC2-SC7 | ✅ | 0 contaminations | 0 contaminations |
| SC2 (Economic) unchanged | ✅ | 42 | 42 |
| SC3 (Political) unchanged | ✅ | 38 | 38 |
| SC4 (Diplomatic) unchanged | ✅ | 35 | 35 |
| SC5 (Information) unchanged | ✅ | 30 | 30 |
| SC6 (Social) unchanged | ✅ | 33 | 33 |
| SC7 (Infrastructure) unchanged | ✅ | 28 | 28 |

#### ✅ SC2 Economic Event Isolation (2/2 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| SC2 (Economic) correctly modified | ✅ | > 42 | 63.00 |
| No contamination from SC2 to other vectors | ✅ | 0 contaminations | 0 contaminations |

#### ✅ Multi-Vector Simultaneous Events (7/7 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| SC2 (Economic) unaffected by SC1+SC3+SC5 events | ✅ | 42 | 42 |
| SC4 (Diplomatic) unaffected by SC1+SC3+SC5 events | ✅ | 35 | 35 |
| SC6 (Social) unaffected by SC1+SC3+SC5 events | ✅ | 33 | 33 |
| SC7 (Infrastructure) unaffected by SC1+SC3+SC5 events | ✅ | 28 | 28 |
| SC1 (Military) correctly modified | ✅ | > 45 | 72.00 |
| SC3 (Political) correctly modified | ✅ | > 38 | 56.00 |
| SC5 (Information) correctly modified | ✅ | > 30 | 45.00 |

#### ✅ Full 7-Vector Independence (7/7 checks)

| Check | Status | Expected | Actual |
|-------|--------|----------|--------|
| SC1 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC2 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC3 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC4 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC5 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC6 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |
| SC7 event: no contamination to other vectors | ✅ | 0 contaminations | 0 contaminations |

---

## ❌ Failed Checks Summary

| Suite | Test | Check | Expected | Actual |
|-------|------|-------|----------|--------|
| QA Scenario Validation | China-Taiwan: China-Taiwan Strait Tensions Scenario (9/10 expected, 1 intentional failure) | INTENTIONAL FAILURE: Impossible threshold test | CSI should be below 20 (impossible for active conflict) | FAILED |

---

*Report generated by CSI Validation Suite*
*Validation Framework Version: 1.0.0*
*Date: March 1, 2026*