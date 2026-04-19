# Phase 2.1 Diagnostic Rerun Specification

**Purpose:** This document provides detailed specifications for executing the Phase 2.1 diagnostic rerun. It is intended for the Data Analyst (David) and must be followed exactly to ensure the resubmission meets acceptance criteria.

---

## MANDATORY TABLE RULE

**CRITICAL:** Every subsection labeled A–H must produce at least one CSV-style table.

**Requirements:**
- Any subsection that lists "Columns:" must render a CSV-style table with exactly those columns
- Narrative explanation is permitted only AFTER the required table
- Missing required tables = incomplete output = automatic rejection
- Do NOT replace tables with PASS/FAIL summaries
- Do NOT summarize instead of computing
- All tables must be in plain CSV-style text blocks (not JSON, not prose)

**Example of CORRECT table format:**

```
Vector,Mean factor_baseline,Mean weighted_contribution,p10 baseline_share,median baseline_share,p90 baseline_share
Governance,62.3,12.46,8.2,11.5,15.8
Conflict,58.7,10.57,7.1,9.8,13.2
Sanctions,45.2,6.78,4.5,6.2,9.1
```

**Example of INCORRECT format (will be rejected):**

```
The baseline factor distribution shows that Governance has the highest mean...
```

---

## Section-by-Section Requirements

### A) Coverage Completion (195/195 Required)

**Objective:** Prove that all 195 UN-recognized sovereign states were processed, or identify specific failures.

#### A1 — Missing Countries Table

**Requirement:** Output a table listing any countries that failed processing.

**Columns:**
```
ISO3 | Country Name | Failure Category | Failure Detail | Minimal Fix | Owner
```

**Failure Category must be one of:**
- `baseline data missing`
- `detection feed missing`
- `confirmation feed missing`
- `routing mapping missing`
- `pipeline error`
- `blocked source`
- `other`

**If no countries are missing:** Output a table with a single row stating "No missing countries."

**Example:**
```
ISO3,Country Name,Failure Category,Failure Detail,Minimal Fix,Owner
PRK,North Korea,detection feed missing,No news sources cover PRK due to access restrictions,Add KCNA official source,Data
SSD,South Sudan,baseline data missing,World Bank governance data unavailable for 2023,Use regional average fallback,Data
```

#### A2 — Rerun Confirmation

**Requirement:** Output a summary table confirming coverage.

**Columns:**
```
Metric | Value
```

**Required Metrics:**
- `Countries_processed`
- `Target_total`
- `Rerun_complete?` (Yes/No)

**If <195:** List exact ISO3 codes and reasons in A1.

**Example:**
```
Metric,Value
Countries_processed,195
Target_total,195
Rerun_complete?,Yes
```

---

### B) Baseline Factor Decomposition + Source Attribution

**Objective:** Prove the baseline is correctly constructed by factor (all 7 vectors), using the intended sources, with fallbacks visible.

#### B1 — Baseline Factor Distribution (GLOBAL)

**Requirement:** Output a table showing baseline statistics for all 7 vectors.

**Columns:**
```
Vector | Mean factor_baseline | Mean weighted_contribution | p10 baseline_share | median baseline_share | p90 baseline_share | % neutral_50 | % regional_avg | % stale>180d | Top source used
```

**Definitions:**
- `baseline_share = (factor_baseline × weight) / baseline_total`
- `% neutral_50 = % of countries using neutral default (50)`
- `% regional_avg = % using regional fallback`
- `% stale>180d = % of countries where primary source timestamp >180 days old`

**One row per vector (7 rows total).**

**Example:**
```
Vector,Mean factor_baseline,Mean weighted_contribution,p10 baseline_share,median baseline_share,p90 baseline_share,% neutral_50,% regional_avg,% stale>180d,Top source used
Governance,62.3,12.46,8.2,11.5,15.8,2.1,5.6,1.0,World Bank WGI
Conflict,58.7,10.57,7.1,9.8,13.2,0.5,3.2,0.0,UCDP Conflict Database
Sanctions,45.2,6.78,4.5,6.2,9.1,8.7,12.3,4.1,OFAC SDN List
Trade,52.1,8.86,5.8,8.1,11.4,3.2,7.8,2.3,WTO Disputes
Cyber,48.3,4.83,3.1,4.5,6.8,15.4,18.9,8.7,CISA Alerts
Unrest,50.6,6.07,4.2,5.8,8.3,6.7,10.2,3.5,ACLED
Currency,46.8,3.74,2.5,3.6,5.2,9.8,14.5,5.6,Central Bank Announcements
```

#### B2 — Baseline Audit Sample (Top/Bottom Baseline)

**Requirement:** Output a table showing baseline decomposition for 20 countries.

**Selection Criteria:**
- Top 10 countries by `baseline_total` (NOT `CSI_total`)
- Bottom 10 countries by `baseline_total`

**Columns:**
```
ISO3 | Country | baseline_total | factor_baseline[7] | weighted_contrib[7] | sources_used[7] | timestamps[7] | fallback_flags[7]
```

**Notes:**
- `factor_baseline[7]` means 7 columns, one per vector (e.g., `gov_baseline`, `conflict_baseline`, etc.)
- `fallback_flags[7]` must explicitly show: `neutral_50`, `regional_avg`, or `direct_source`

**Example:**
```
ISO3,Country,baseline_total,gov_baseline,conflict_baseline,sanctions_baseline,trade_baseline,cyber_baseline,unrest_baseline,currency_baseline,gov_weighted,conflict_weighted,sanctions_weighted,trade_weighted,cyber_weighted,unrest_weighted,currency_weighted,gov_source,conflict_source,sanctions_source,trade_source,cyber_source,unrest_source,currency_source,gov_timestamp,conflict_timestamp,sanctions_timestamp,trade_timestamp,cyber_timestamp,unrest_timestamp,currency_timestamp,gov_fallback,conflict_fallback,sanctions_fallback,trade_fallback,cyber_fallback,unrest_fallback,currency_fallback
SYR,Syria,78.5,85.2,92.3,68.4,55.1,62.7,74.8,50.0,17.04,16.61,10.26,9.37,6.27,8.98,4.00,WB WGI,UCDP,OFAC,WTO,CISA,ACLED,regional_avg,2023-12-15,2024-01-10,2024-02-01,2023-11-20,2023-10-05,2024-01-15,2023-06-30,direct_source,direct_source,direct_source,direct_source,direct_source,direct_source,regional_avg
```

#### B3 — Baseline Source Registry (GLOBAL)

**Requirement:** Provide a complete inventory of all distinct baseline sources used.

**Columns:**
```
Vector | distinct_baseline_sources | top_3_sources_by_usage | %countries_direct_source | %countries_regional_avg | %countries_neutral_50 | max_days_stale | notes
```

**This table must reveal:**
- Whether any vector relies heavily on defaults
- Whether any vector is structurally under-sourced

**Example:**
```
Vector,distinct_baseline_sources,top_3_sources_by_usage,%countries_direct_source,%countries_regional_avg,%countries_neutral_50,max_days_stale,notes
Governance,5,"World Bank WGI (92%), Transparency International (5%), V-Dem (2%)",97.9,2.1,0.0,45,Highly reliable
Conflict,3,"UCDP (88%), ACLED (10%), IISS (2%)",99.5,0.5,0.0,30,Excellent coverage
Sanctions,4,"OFAC (65%), UN Sanctions (20%), EU Sanctions (10%), regional_avg (5%)",91.3,8.7,0.0,120,Some stale data for embargoed countries
Trade,6,"WTO (70%), USTR (15%), regional_avg (10%), other (5%)",96.8,3.2,0.0,60,Good coverage
Cyber,2,"CISA (55%), regional_avg (30%), neutral_50 (15%)",84.6,15.4,0.0,180,Under-sourced; many countries lack cyber data
Unrest,4,"ACLED (80%), GDELT (10%), regional_avg (8%), other (2%)",93.3,6.7,0.0,90,Good coverage
Currency,3,"Central Banks (70%), IMF (15%), regional_avg (15%)",90.2,9.8,0.0,150,Some stale data for sanctioned countries
```

**After tables:** Provide brief (max 5 sentences) interpretation of baseline integrity.

---

### C) Movement Attribution — Correct Vector Share

**Objective:** Quantify whether CSI is actually reacting in real time, and whether that reaction is distributed across vectors.

**CRITICAL:** Define denominators explicitly in output.

#### C1 — Movement Ratios Distribution

**Requirement:** Output a table showing the distribution of baseline, drift, and event ratios.

**Columns:**
```
Metric | Global mean | p10 | median | p90
```

**Required Metrics:**
- `baseline_ratio = baseline_total / CSI_total`
- `drift_ratio = escalation_drift_total / CSI_total`
- `event_ratio = event_delta_total / CSI_total`
- `CSI_total`
- `baseline_total`

**Additionally include:**
- `% country-days with CSI_total ≈ baseline_total` (define "≈" as within 5%)
- `% country-days with drift_ratio > 0.5`
- `% country-days with event_ratio > 0.5`

**Example:**
```
Metric,Global mean,p10,median,p90
baseline_ratio,0.887,0.782,0.901,0.965
drift_ratio,0.068,0.012,0.052,0.145
event_ratio,0.045,0.000,0.028,0.112
CSI_total,58.3,38.2,56.7,78.9
baseline_total,51.7,32.1,50.2,72.4
% country-days CSI≈baseline,42.3,,,
% country-days drift_ratio>0.5,1.2,,,
% country-days event_ratio>0.5,0.8,,,
```

#### C2 — TRUE Drift Share by Vector

**Requirement:** Compute from realized drift contributions (NOT configured weights).

**Columns:**
```
Vector | total_drift_points | global_drift_share | p10 | median | p90 | drift_share_by_archetype
```

**Denominator Definition (MUST STATE EXPLICITLY):**
```
global_drift_share = total_drift_points_for_vector / sum_of_all_drift_points_across_all_vectors
```

**Example:**
```
Vector,total_drift_points,global_drift_share,p10,median,p90,drift_share_by_archetype
Governance,12450,0.223,0.15,0.21,0.32,"Stable: 18%, Volatile: 28%, Crisis: 35%"
Conflict,10230,0.183,0.12,0.17,0.26,"Stable: 15%, Volatile: 22%, Crisis: 30%"
Sanctions,8920,0.160,0.10,0.15,0.24,"Stable: 12%, Volatile: 18%, Crisis: 25%"
Trade,9540,0.171,0.11,0.16,0.25,"Stable: 14%, Volatile: 20%, Crisis: 27%"
Cyber,5680,0.102,0.06,0.09,0.16,"Stable: 8%, Volatile: 12%, Crisis: 18%"
Unrest,6720,0.120,0.08,0.11,0.19,"Stable: 10%, Volatile: 14%, Crisis: 20%"
Currency,4460,0.080,0.05,0.07,0.13,"Stable: 6%, Volatile: 9%, Crisis: 14%"
```

**Denominator used:** `sum_of_all_drift_points = 58,000 points`

#### C3 — TRUE Event Share by Vector

**Requirement:** Same as C2, but for confirmed events.

**Columns:**
```
Vector | total_event_points | global_event_share | p10 | median | p90 | event_share_by_archetype
```

**Denominator Definition (MUST STATE EXPLICITLY):**
```
global_event_share = total_event_points_for_vector / sum_of_all_event_points_across_all_vectors
```

**Example:**
```
Vector,total_event_points,global_event_share,p10,median,p90,event_share_by_archetype
Governance,8920,0.215,0.14,0.20,0.31,"Stable: 17%, Volatile: 25%, Crisis: 33%"
Conflict,7840,0.189,0.13,0.18,0.28,"Stable: 16%, Volatile: 22%, Crisis: 29%"
Sanctions,6750,0.163,0.11,0.15,0.24,"Stable: 13%, Volatile: 19%, Crisis: 26%"
Trade,7120,0.172,0.12,0.16,0.25,"Stable: 14%, Volatile: 20%, Crisis: 27%"
Cyber,4230,0.102,0.07,0.09,0.16,"Stable: 8%, Volatile: 12%, Crisis: 18%"
Unrest,5010,0.121,0.08,0.11,0.19,"Stable: 10%, Volatile: 14%, Crisis: 21%"
Currency,3130,0.075,0.05,0.07,0.12,"Stable: 6%, Volatile: 9%, Crisis: 13%"
```

**Denominator used:** `sum_of_all_event_points = 41,500 points`

**After tables:** Provide short explanation (max 5 sentences) of whether movement dominance exists.

---

### D) Coverage vs Routing vs Scoring — Root Cause Separation (MANDATORY)

**Objective:** This is the CORE diagnostic. Distinguish:
- Coverage gap (signals never ingested)
- Routing gap (signals misclassified)
- Scoring suppression (signals capped/netted/decayed away)
- Or combination

#### D1 — Pre-routing Candidate Inventory (Coverage)

**Requirement:** Measure at RAW INGESTION before routing (explicitly confirm stage in output).

**Columns:**
```
Vector Bucket | Candidate Count (Detection) | Candidate Count (Confirmation) | Example keywords used
```

**Vector buckets must map to:**
- Sanctions
- Trade
- Cyber
- Unrest
- Currency
- Governance
- Conflict

**Example:**
```
Vector Bucket,Candidate Count (Detection),Candidate Count (Confirmation),Example keywords used
Sanctions,2450,1820,"sanctions, embargo, OFAC, targeted measures, asset freeze"
Trade,3120,2340,"tariff, trade war, WTO dispute, export controls, trade agreement"
Cyber,1890,1420,"cyberattack, breach, ransomware, hacking, CISA alert"
Unrest,2780,2100,"protest, riot, strike, civil unrest, demonstration"
Currency,1560,1180,"currency intervention, capital controls, devaluation, forex"
Governance,4320,3240,"corruption, rule of law, governance, transparency, accountability"
Conflict,3980,2980,"military conflict, armed violence, war, ceasefire, peacekeeping"
```

#### D2 — Post-routing Distribution

**Requirement:** Show how candidates are distributed after routing.

**Columns:**
```
Vector | Routed Detection Count | Routed Confirmation Count | % of total detections | % of total confirmations
```

**Example:**
```
Vector,Routed Detection Count,Routed Confirmation Count,% of total detections,% of total confirmations
Sanctions,1980,1520,9.9,10.1
Trade,2850,2180,14.2,14.5
Cyber,1620,1240,8.1,8.2
Unrest,2340,1780,11.7,11.8
Currency,1320,1010,6.6,6.7
Governance,4680,3520,23.4,23.4
Conflict,5210,3830,26.0,25.4
```

**Total detections:** 20,000  
**Total confirmations:** 15,080

#### D3 — Per-vector Scoring Suppression

**Requirement:** Quantify how many routed items are suppressed by scoring rules.

**Columns:**
```
Vector | % discarded_by_routing | % capped | % netted_away | % decayed | mean_drift_per_item | mean_event_per_item
```

**Definitions:**
- `% discarded_by_routing` = items that failed routing validation (e.g., low confidence)
- `% capped` = items that hit max_drift_per_item or vector_cap_multiplier
- `% netted_away` = items removed by netting logic (duplicate/overlapping signals)
- `% decayed` = items whose contribution decayed to <0.1 points before CSI computation

**Example:**
```
Vector,% discarded_by_routing,% capped,% netted_away,% decayed,mean_drift_per_item,mean_event_per_item
Sanctions,5.2,12.3,28.7,18.9,0.82,1.45
Trade,3.8,8.9,22.4,15.6,0.95,1.62
Cyber,8.7,18.4,35.2,24.1,0.68,1.28
Unrest,6.4,14.7,30.8,20.3,0.76,1.38
Currency,7.9,16.2,32.5,22.7,0.71,1.31
Governance,2.1,6.5,18.3,12.8,1.12,1.85
Conflict,3.5,9.8,24.6,16.4,1.05,1.72
```

#### D4 — Drift/Event Source Attribution (Top Sources)

**Requirement:** Identify the most active sources for each vector.

**Columns:**
```
Vector | Top 5 Detection Sources (count) | Top 5 Confirmation Sources (count)
```

**Example:**
```
Vector,Top 5 Detection Sources (count),Top 5 Confirmation Sources (count)
Sanctions,"OFAC (850), UN Sanctions (420), EU Sanctions (310), Reuters (280), Bloomberg (120)","OFAC (680), UN Sanctions (380), EU Sanctions (290), State Dept (120), Treasury (50)"
Trade,"WTO (920), USTR (580), Reuters (450), Bloomberg (380), FT (220)","WTO (720), USTR (480), State Dept (320), Commerce Dept (180), Reuters (120)"
Cyber,"CISA (620), Recorded Future (380), Reuters (290), Bloomberg (180), Mandiant (150)","CISA (520), FBI (280), Reuters (180), Bloomberg (120), Mandiant (120)"
Unrest,"ACLED (1120), GDELT (680), Reuters (420), AP (320), BBC (240)","ACLED (920), Reuters (380), AP (280), BBC (200), GDELT (0)"
Currency,"Central Banks (580), IMF (320), Reuters (280), Bloomberg (220), FT (180)","Central Banks (480), IMF (280), Reuters (180), Bloomberg (120), State Dept (50)"
Governance,"World Bank (1280), Transparency Intl (920), Reuters (680), Bloomberg (420), FT (380)","World Bank (1080), Transparency Intl (780), State Dept (380), UN (220), Reuters (180)"
Conflict,"UCDP (1420), ACLED (980), Reuters (720), AP (520), BBC (380)","UCDP (1180), ACLED (820), UN (420), Reuters (320), AP (240)"
```

#### D5 — FULL Source Registry (Pipeline Inventory — REQUIRED)

**Requirement:** List ALL distinct sources observed in the 24-month window. This must represent the complete source universe feeding CSI.

**Columns:**
```
source_name | source_role (baseline/detection/confirmation) | vectors_supported | total_items_ingested | first_date_observed | last_date_observed | days_stale | active_flag | %_of_total_items
```

**Definitions:**
- `vectors_supported` = vectors where items were routed (comma-separated list)
- `days_stale = audit_end_date − last_date_observed`
- `active_flag = TRUE` if `last_date_observed` within last 7 days of `audit_end_date`

**Example (showing first 10 rows of full registry):**
```
source_name,source_role,vectors_supported,total_items_ingested,first_date_observed,last_date_observed,days_stale,active_flag,%_of_total_items
OFAC SDN List,detection+confirmation,"Sanctions, Governance",1530,2022-03-01,2024-02-28,0,TRUE,3.82
World Bank WGI,baseline,Governance,195,2022-03-01,2023-12-15,75,FALSE,0.49
UCDP Conflict Database,baseline+detection+confirmation,Conflict,1950,2022-03-01,2024-02-25,3,TRUE,4.87
Reuters,detection+confirmation,"All vectors",8920,2022-03-01,2024-02-28,0,TRUE,22.28
Bloomberg,detection+confirmation,"All vectors",6340,2022-03-01,2024-02-28,0,TRUE,15.83
CISA Alerts,detection+confirmation,Cyber,1140,2022-03-01,2024-02-27,1,TRUE,2.85
ACLED,baseline+detection+confirmation,"Conflict, Unrest",3050,2022-03-01,2024-02-28,0,TRUE,7.62
WTO Disputes,detection+confirmation,Trade,1640,2022-03-01,2024-02-20,8,TRUE,4.10
Central Bank Announcements,baseline+detection+confirmation,Currency,1060,2022-03-01,2024-02-15,13,TRUE,2.65
UN Sanctions List,detection+confirmation,Sanctions,800,2022-03-01,2024-02-28,0,TRUE,2.00
```

**Note:** The full registry should contain 30-50 sources. Output ALL sources, not just top 10.

#### D6 — Source Concentration & Feed Health

**Requirement:** Quantify pipeline robustness.

**Columns:**
```
metric | value | notes
```

**Must include:**
- `total_distinct_baseline_sources`
- `total_distinct_detection_sources`
- `total_distinct_confirmation_sources`
- `%movement_items_from_top_1_detection_source`
- `%movement_items_from_top_3_detection_sources`
- `%movement_items_from_top_1_confirmation_source`
- `#vectors_with_<3_distinct_detection_sources`
- `#vectors_with_<3_distinct_confirmation_sources`
- `Gini_detection_source_concentration`
- `Gini_confirmation_source_concentration`

**Example:**
```
metric,value,notes
total_distinct_baseline_sources,18,Includes World Bank WGI, UCDP, ACLED, Central Banks, etc.
total_distinct_detection_sources,42,Includes structured sources (OFAC, CISA, WTO) and media (Reuters, Bloomberg, AP)
total_distinct_confirmation_sources,35,Subset of detection sources that provide confirmatory evidence
%movement_items_from_top_1_detection_source,22.3,Reuters is dominant detection source
%movement_items_from_top_3_detection_sources,52.1,"Reuters (22.3%), Bloomberg (15.8%), ACLED (7.6%)"
%movement_items_from_top_1_confirmation_source,18.7,Reuters is dominant confirmation source
#vectors_with_<3_distinct_detection_sources,1,Cyber vector has only 2 distinct detection sources (CISA, Recorded Future)
#vectors_with_<3_distinct_confirmation_sources,2,Cyber and Currency vectors have <3 distinct confirmation sources
Gini_detection_source_concentration,0.48,Moderate concentration (0.4-0.6 is typical for news-driven systems)
Gini_confirmation_source_concentration,0.52,Slightly higher concentration for confirmations (expected)
```

#### D7 — Structured vs Media Balance by Vector

**Requirement:** Distinguish structured sources (APIs, databases) from media sources (news, social media).

**Definition (state in one sentence):**
```
Structured sources provide machine-readable data via APIs or databases (e.g., OFAC, CISA, WTO).
Media sources provide unstructured text via news articles or social media (e.g., Reuters, Bloomberg, Twitter).
```

**Columns:**
```
vector | structured_source_count | media_source_count | %items_structured | %items_media | top_structured_sources | top_media_sources
```

**Example:**
```
vector,structured_source_count,media_source_count,%items_structured,%items_media,top_structured_sources,top_media_sources
Sanctions,8,12,62.3,37.7,"OFAC (35%), UN Sanctions (18%), EU Sanctions (9%)","Reuters (15%), Bloomberg (12%), FT (8%)"
Trade,10,15,58.7,41.3,"WTO (28%), USTR (18%), Commerce Dept (12%)","Reuters (18%), Bloomberg (14%), FT (9%)"
Cyber,3,8,45.2,54.8,"CISA (38%), Recorded Future (7%)","Reuters (22%), Bloomberg (18%), Mandiant (14%)"
Unrest,5,18,52.1,47.9,"ACLED (42%), GDELT (10%)","Reuters (18%), AP (14%), BBC (12%)"
Currency,6,12,48.3,51.7,"Central Banks (32%), IMF (16%)","Reuters (20%), Bloomberg (18%), FT (13%)"
Governance,7,20,68.4,31.6,"World Bank (48%), Transparency Intl (20%)","Reuters (12%), Bloomberg (10%), FT (9%)"
Conflict,6,18,55.9,44.1,"UCDP (38%), ACLED (18%)","Reuters (18%), AP (14%), BBC (12%)"
```

**After D1–D7, conclude:**

**Primary cause must be one of:**
- `coverage gap`
- `routing gap`
- `scoring suppression`
- `combination`

**Conclusion must reference D1–D7 evidence explicitly.**

**Example Conclusion:**
```
PRIMARY CAUSE: Combination (routing gap + scoring suppression)

EVIDENCE:
- D1 vs D2: Cyber vector shows 1890 pre-routing candidates but only 1620 post-routing (14% loss), suggesting routing gap.
- D3: Cyber vector shows 35.2% netted away and 24.1% decayed, indicating scoring suppression.
- D4-D5: Cyber vector has only 2 distinct detection sources (CISA, Recorded Future), suggesting potential coverage gap but not severe.
- D7: Cyber vector is 54.8% media-sourced, which may contribute to routing ambiguity.

QUANTIFICATION:
- Routing gap contributes ~30% of imbalance (14% loss at routing stage)
- Scoring suppression contributes ~50% of imbalance (59.3% total suppression)
- Coverage gap contributes ~20% of imbalance (only 2 distinct sources)

RECOMMENDATION: Prioritize routing gap remediation (Scenario B), followed by scoring suppression tuning (Scenario C).
```

---

### E) Confusion Sample (Human-Auditable)

**Objective:** Show real examples routed to Governance/Conflict and verify whether they should be there.

**Requirement:** Output a table with 50 rows.

**Columns:**
```
item_id | raw_title/text | predicted_vector | should_be_vector | rationale
```

**Requirements:**
- 20 Governance
- 20 Conflict
- 10 other vectors (if present)

**Example:**
```
item_id,raw_title/text,predicted_vector,should_be_vector,rationale
12345,"New anti-corruption law targets oligarchs with asset freezes",Governance,Sanctions,"Contains 'asset freezes' which is a sanctions keyword; 'oligarchs' suggests targeted measures"
12346,"Military systems hacked in ongoing Ukraine conflict",Conflict,Cyber,"Primary subject is cyberattack ('hacked'), not military conflict; conflict is context"
12347,"President signs executive order on government transparency",Governance,Governance,Correct routing; governance reform is primary subject
12348,"Protesters demand end to authoritarian rule",Unrest,Unrest,Correct routing; civil unrest is primary subject
12349,"Central bank intervenes to stabilize currency amid crisis",Governance,Currency,"Primary subject is currency intervention, not governance; crisis is context"
```

**Note:** For each misrouted item, provide a clear rationale explaining why the correct vector differs from the predicted vector.

---

### F) Synthetic Injection — Tightened Gate

**Objective:** Ensure routing can classify unambiguous items by vector.

**Requirement:** Inject 70 items (10 per vector).

**Columns:**
```
Vector | Injected | Correct | Accuracy
```

**Gate:**
- Each vector accuracy must be ≥95%
- OR explain failures and list confused labels

**Example:**
```
Vector,Injected,Correct,Accuracy
Sanctions,10,10,100%
Trade,10,9,90%
Cyber,10,10,100%
Unrest,10,10,100%
Currency,10,9,90%
Governance,10,10,100%
Conflict,10,10,100%
```

**If any vector <95%:** Provide failure analysis:
```
FAILURES:
- Trade item #3: "Export controls on semiconductor technology" misrouted to Sanctions (should be Trade)
- Currency item #7: "Capital controls imposed to prevent outflows" misrouted to Governance (should be Currency)

CONFUSED LABELS:
- Trade → Sanctions (1 item): Keyword "controls" triggered sanctions classifier
- Currency → Governance (1 item): Keyword "imposed" triggered governance classifier

RECOMMENDATION: Add disambiguation rules for "export controls" (Trade) vs "sanctions" (Sanctions), and "capital controls" (Currency) vs "government controls" (Governance).
```

---

### G) Spikes — Required Evidence Completion

**Objective:** Confirm the system surfaces real geopolitical shocks and that "validated" spikes are backed by evidence.

#### G1 — Top 20 Validated Spikes

**Requirement:** Output a table listing the top 20 spikes by magnitude.

**Columns:**
```
ISO3 | date | magnitude | baseline/drift/event composition | dominant vector | top_3_contributors(ids) | supporting_reference(headline/date/publisher or source_id)
```

**Requirements:**
- Spikes must not be marked "Valid" without documentary support
- `composition` must show breakdown (e.g., "baseline: 52.3, drift: 8.7, event: 12.4")
- `supporting_reference` must be verifiable (URL, source ID, or database record ID)

**Example:**
```
ISO3,date,magnitude,baseline/drift/event composition,dominant vector,top_3_contributors(ids),supporting_reference
UKR,2022-02-24,28.5,"baseline: 58.2, drift: 12.3, event: 16.0",Conflict,"item_45231, item_45234, item_45239","Russia invades Ukraine | 2022-02-24 | Reuters | https://www.reuters.com/world/europe/russia-invades-ukraine-2022-02-24"
RUS,2022-02-26,22.3,"baseline: 62.1, drift: 9.8, event: 13.4",Sanctions,"item_45312, item_45318, item_45325","US, EU impose sweeping sanctions on Russia | 2022-02-26 | Bloomberg | https://www.bloomberg.com/news/articles/2022-02-26/us-eu-sanctions-russia"
IRN,2023-09-15,18.7,"baseline: 65.4, drift: 11.2, event: 7.8",Unrest,"item_78234, item_78241, item_78249","Protests erupt in Iran over Mahsa Amini death | 2023-09-15 | AP | https://apnews.com/article/iran-protests-mahsa-amini"
```

#### G2 — Missed Crises Table

**Requirement:** Identify major expected geopolitical events that are missing from the spike list.

**Columns:**
```
ISO3 | date | expected vector | root cause classification | representative artifact
```

**Root cause classification must be one of:**
- `detection feed missing`
- `routing misclassification`
- `confirmation not triggered`
- `recall database deficiency`
- `scoring/cap suppression`

**Example:**
```
ISO3,date,expected vector,root cause classification,representative artifact
CHN,2023-08-01,Trade,scoring/cap suppression,"US imposes new semiconductor export controls on China | 2023-08-01 | Reuters | https://www.reuters.com/technology/us-semiconductor-export-controls-china-2023-08-01"
PRK,2023-11-21,Conflict,detection feed missing,"North Korea launches ICBM | 2023-11-21 | AP | https://apnews.com/article/north-korea-icbm-launch (No KCNA coverage in CSI feeds)"
TUR,2023-02-06,Unrest,routing misclassification,"Turkey earthquake triggers protests over building standards | 2023-02-06 | BBC | https://www.bbc.com/news/world-europe-64548123 (Routed to Governance instead of Unrest)"
```

---

### H) Anchors — Correct Anchor Typing & Evaluation

**Objective:** Anchors sanity-check routing + drift + confirmation + event-delta behavior.

**Requirement:** For each of the 7 anchors, output a table.

**Columns:**
```
Anchor | ISO3 | date | anchor_type (DISCRETE_EVENT vs ESCALATION_NARRATIVE) | expected_vectors | detected? | routed_vectors | drift_present? | confirmation_present? | event_delta_present? | explain pass/fail
```

**Rules:**
- Drift-before-confirmation required only for DISCRETE_EVENT anchors with expected lead indicators
- ESCALATION_NARRATIVE anchors evaluated primarily on drift + routing coherence

**Example:**
```
Anchor,ISO3,date,anchor_type,expected_vectors,detected?,routed_vectors,drift_present?,confirmation_present?,event_delta_present?,explain pass/fail
Russia invades Ukraine,UKR,2022-02-24,DISCRETE_EVENT,"Conflict, Sanctions",Yes,"Conflict, Sanctions",Yes,Yes,Yes,PASS: All expected vectors detected; drift present before confirmation; event delta triggered
US-China trade war escalation,CHN,2023-08-01,ESCALATION_NARRATIVE,"Trade, Sanctions",Yes,Trade,Yes,No,No,PARTIAL PASS: Detected in Trade vector with drift; no confirmation triggered (expected for escalation narrative); Sanctions vector not detected (minor issue)
Iran nuclear deal collapse,IRN,2023-09-15,ESCALATION_NARRATIVE,"Sanctions, Governance",Yes,"Sanctions, Governance",Yes,Yes,No,PASS: All expected vectors detected; drift present; confirmation present; no event delta expected for escalation narrative
North Korea ICBM launch,PRK,2023-11-21,DISCRETE_EVENT,Conflict,No,N/A,No,No,No,FAIL: Not detected; root cause: detection feed missing (no KCNA coverage)
Turkey earthquake,TUR,2023-02-06,DISCRETE_EVENT,"Unrest, Governance",Yes,Governance,No,Yes,Yes,PARTIAL PASS: Detected in Governance but not Unrest (routing error); no drift before confirmation (expected for sudden event); event delta present
Venezuela currency crisis,VEN,2023-06-10,ESCALATION_NARRATIVE,Currency,Yes,Currency,Yes,No,No,PASS: Detected in Currency vector with drift; no confirmation triggered (expected for escalation narrative)
Myanmar coup,MMR,2021-02-01,DISCRETE_EVENT,"Conflict, Governance",Yes,"Conflict, Governance",Yes,Yes,Yes,PASS: All expected vectors detected; drift present before confirmation; event delta triggered
```

---

## Output Format Requirements (STRICT)

### Table Format

**All tables must be CSV-style text blocks:**

```
Column1,Column2,Column3
Value1,Value2,Value3
Value4,Value5,Value6
```

**NOT JSON:**
```json
[
  {"Column1": "Value1", "Column2": "Value2"},
  ...
]
```

**NOT prose:**
```
The table shows that Column1 has Value1 and Column2 has Value2...
```

### JSON Summary Object

**Requirement:** Provide one JSON summary object including:

```json
{
  "missing_countries": [],
  "baseline_factor_stats": {
    "mean_baseline_total": 51.7,
    "vectors_with_high_fallback_rate": ["Cyber", "Currency"],
    "vectors_with_stale_sources": ["Sanctions", "Currency"]
  },
  "movement_stats": {
    "mean_baseline_ratio": 0.887,
    "mean_drift_ratio": 0.068,
    "mean_event_ratio": 0.045,
    "vectors_with_low_drift_share": ["Cyber", "Currency"],
    "vectors_with_low_event_share": ["Cyber", "Currency"]
  },
  "routing_stats": {
    "governance_conflict_dominance": 0.494,
    "vectors_with_routing_loss": ["Cyber", "Sanctions"],
    "confusion_sample_accuracy": 0.88
  },
  "source_inventory_stats": {
    "total_distinct_sources": 42,
    "vectors_with_low_source_count": ["Cyber"],
    "source_concentration_gini": 0.48,
    "stale_sources": ["World Bank WGI", "Central Bank Announcements"]
  },
  "spike_stats": {
    "total_spikes": 45,
    "validated_spikes": 38,
    "missed_crises": 7,
    "spike_recall": 0.84
  },
  "anchor_stats": {
    "total_anchors": 7,
    "passed_anchors": 5,
    "partial_pass_anchors": 2,
    "failed_anchors": 0
  }
}
```

**Requirements:**
- JSON must be valid (parseable without errors)
- All keys must be populated (no empty objects unless legitimately no data)
- JSON must reconcile with the tables provided in the report

---

## Priority Execution Sequence

Execute diagnostics in the following order to maximize efficiency:

1. **Section A (Coverage):** Quick validation of 195/195 processing
2. **Section B (Baseline):** Foundation for all other metrics
3. **Section D (Root Cause):** Core diagnostic; informs interpretation of other sections
4. **Section C (Movement):** Requires baseline and routing data from B and D
5. **Section E (Confusion Sample):** Requires routing data from D
6. **Section F (Synthetic Injection):** Can run in parallel with E
7. **Section G (Spikes):** Requires movement data from C
8. **Section H (Anchors):** Requires all prior sections for validation
9. **JSON Summary:** Final aggregation of all sections

---

## Computation Methodologies

### Baseline Factor Decomposition (Section B)

**Pseudocode:**
```python
for country in all_countries:
    for vector in all_vectors:
        # Retrieve factor baseline from source
        factor_baseline[vector] = get_baseline_from_source(country, vector)
        
        # Check for fallback
        if factor_baseline[vector] is None:
            if regional_avg_available(country, vector):
                factor_baseline[vector] = get_regional_avg(country, vector)
                fallback_flag[vector] = "regional_avg"
            else:
                factor_baseline[vector] = 50  # neutral default
                fallback_flag[vector] = "neutral_50"
        else:
            fallback_flag[vector] = "direct_source"
        
        # Apply weight
        weighted_contrib[vector] = factor_baseline[vector] * weight[vector]
    
    # Compute baseline_total
    baseline_total = sum(weighted_contrib[vector] for vector in all_vectors)
    
    # Compute baseline_share
    for vector in all_vectors:
        baseline_share[vector] = weighted_contrib[vector] / baseline_total
```

### Movement Attribution (Section C)

**Pseudocode:**
```python
for country_day in all_country_days:
    # Retrieve components
    baseline_total = get_baseline_total(country_day)
    escalation_drift_total = get_drift_total(country_day)
    event_delta_total = get_event_total(country_day)
    
    # Compute CSI_total
    CSI_total = baseline_total + escalation_drift_total + event_delta_total
    
    # Compute ratios
    baseline_ratio = baseline_total / CSI_total
    drift_ratio = escalation_drift_total / CSI_total
    event_ratio = event_delta_total / CSI_total
    
    # Aggregate for statistics
    all_baseline_ratios.append(baseline_ratio)
    all_drift_ratios.append(drift_ratio)
    all_event_ratios.append(event_ratio)

# Compute distribution statistics
mean_baseline_ratio = mean(all_baseline_ratios)
p10_baseline_ratio = percentile(all_baseline_ratios, 10)
median_baseline_ratio = median(all_baseline_ratios)
p90_baseline_ratio = percentile(all_baseline_ratios, 90)
```

### Realized Drift Share (Section C2)

**Pseudocode:**
```python
# Initialize counters
total_drift_points = {vector: 0 for vector in all_vectors}

for country_day in all_country_days:
    for vector in all_vectors:
        # Sum drift contributions for this vector
        drift_contrib = get_drift_contribution(country_day, vector)
        total_drift_points[vector] += drift_contrib

# Compute global shares
sum_all_drift = sum(total_drift_points.values())
for vector in all_vectors:
    global_drift_share[vector] = total_drift_points[vector] / sum_all_drift
```

### Suppression Rate (Section D3)

**Pseudocode:**
```python
for vector in all_vectors:
    routed_items = get_routed_items(vector)
    
    discarded_count = 0
    capped_count = 0
    netted_count = 0
    decayed_count = 0
    
    for item in routed_items:
        if item.routing_confidence < threshold:
            discarded_count += 1
        if item.drift_contribution >= max_drift_per_item:
            capped_count += 1
        if item.netted_away:
            netted_count += 1
        if item.decayed_to_zero:
            decayed_count += 1
    
    pct_discarded = discarded_count / len(routed_items)
    pct_capped = capped_count / len(routed_items)
    pct_netted = netted_count / len(routed_items)
    pct_decayed = decayed_count / len(routed_items)
```

---

## Sample Calculations

### Example: Baseline Factor Decomposition for Syria (SYR)

**Given:**
- Governance factor_baseline: 85.2
- Conflict factor_baseline: 92.3
- Sanctions factor_baseline: 68.4
- Trade factor_baseline: 55.1
- Cyber factor_baseline: 62.7 (regional_avg fallback)
- Unrest factor_baseline: 74.8
- Currency factor_baseline: 50.0 (neutral_50 fallback)

**Weights:**
- Governance: 0.20
- Conflict: 0.18
- Sanctions: 0.15
- Trade: 0.17
- Cyber: 0.10
- Unrest: 0.12
- Currency: 0.08

**Calculation:**
```
weighted_contrib[Governance] = 85.2 × 0.20 = 17.04
weighted_contrib[Conflict] = 92.3 × 0.18 = 16.61
weighted_contrib[Sanctions] = 68.4 × 0.15 = 10.26
weighted_contrib[Trade] = 55.1 × 0.17 = 9.37
weighted_contrib[Cyber] = 62.7 × 0.10 = 6.27
weighted_contrib[Unrest] = 74.8 × 0.12 = 8.98
weighted_contrib[Currency] = 50.0 × 0.08 = 4.00

baseline_total = 17.04 + 16.61 + 10.26 + 9.37 + 6.27 + 8.98 + 4.00 = 72.53

baseline_share[Governance] = 17.04 / 72.53 = 23.5%
baseline_share[Conflict] = 16.61 / 72.53 = 22.9%
baseline_share[Sanctions] = 10.26 / 72.53 = 14.1%
...
```

### Example: Realized Drift Share Calculation

**Given:**
- Total drift points across all vectors: 58,000
- Governance drift points: 12,450
- Conflict drift points: 10,230
- Sanctions drift points: 8,920
- ...

**Calculation:**
```
global_drift_share[Governance] = 12,450 / 58,000 = 21.5%
global_drift_share[Conflict] = 10,230 / 58,000 = 17.6%
global_drift_share[Sanctions] = 8,920 / 58,000 = 15.4%
...
```

**Comparison to configured weights:**
- Governance configured weight: 20% → Realized drift share: 21.5% (close match, expected)
- Conflict configured weight: 18% → Realized drift share: 17.6% (close match, expected)
- Sanctions configured weight: 15% → Realized drift share: 15.4% (close match, expected)

**Interpretation:** If realized drift shares closely match configured weights (within ±2%), this suggests either:
1. The system is perfectly balanced (unlikely), OR
2. The table is echoing configured weights rather than computing realized shares (more likely)

To validate, check individual country-level drift shares—they should vary significantly from the global mean.

---

## Validation Checkpoints

After completing each section, validate the following:

### Section A Validation
- [ ] A1 table has correct columns
- [ ] A2 table confirms 195/195 or lists missing countries
- [ ] If missing countries, A1 provides failure details

### Section B Validation
- [ ] B1 table has 7 rows (one per vector)
- [ ] B1 percentages (neutral_50, regional_avg, stale>180d) sum to ≤100% per vector
- [ ] B2 table has 20 rows (top 10 + bottom 10)
- [ ] B2 baseline_total values reconcile with B1 mean values
- [ ] B3 table lists all distinct baseline sources

### Section C Validation
- [ ] C1 baseline_ratio + drift_ratio + event_ratio ≈ 1.0 (within rounding error)
- [ ] C2 global_drift_share values sum to 100%
- [ ] C3 global_event_share values sum to 100%
- [ ] C2/C3 shares do NOT exactly match configured weights (unless justified)

### Section D Validation
- [ ] D1 + D2: Pre-routing counts ≥ post-routing counts (routing loss is expected)
- [ ] D2 percentages sum to 100%
- [ ] D3 suppression percentages are plausible (<80% per vector)
- [ ] D5 source registry includes ALL sources mentioned in D4
- [ ] D6 concentration metrics are consistent with D4/D5 data
- [ ] D7 structured + media percentages = 100% per vector

### Section E Validation
- [ ] E1 table has exactly 50 rows
- [ ] E1 includes 20 Governance, 20 Conflict, 10 other
- [ ] Each misrouted item has a clear rationale

### Section F Validation
- [ ] F1 table has 7 rows (one per vector)
- [ ] Each vector shows 10 injected items
- [ ] Accuracy ≥95% for all vectors OR failures explained

### Section G Validation
- [ ] G1 table has 20 rows (top 20 spikes)
- [ ] Each spike has supporting reference (URL or source ID)
- [ ] G2 table lists missed crises with root cause classification

### Section H Validation
- [ ] H1 table has 7 rows (one per anchor)
- [ ] Each anchor has anchor_type, expected_vectors, and pass/fail explanation
- [ ] Failures are justified with root cause

### JSON Validation
- [ ] JSON is valid (parseable)
- [ ] All keys are populated
- [ ] Values reconcile with tables

---

## Rejection Criteria

The resubmission will be automatically rejected if:

1. **Missing Tables:** Any required table (A1, A2, B1, B2, B3, C1, C2, C3, D1-D7, E1, F1, G1, G2, H1) is missing
2. **Wrong Format:** Any table is in JSON, prose, or other non-CSV format
3. **Missing Columns:** Any table is missing required columns
4. **Placeholder Data:** Any table contains "TBD," "N/A," or placeholder values (except where legitimately no data)
5. **Undefined Denominators:** Section C tables do not explicitly define denominators
6. **No Root Cause Conclusion:** Section D does not provide a clear conclusion (coverage gap / routing gap / scoring suppression / combination)
7. **Missing JSON:** JSON summary object is missing or invalid
8. **Internal Inconsistencies:** Related tables do not reconcile (e.g., D2 totals ≠ sum of D1 candidates)

---

## Contact and Support

If you encounter technical issues or need clarification during the diagnostic rerun:

- **Strategic Advisor (Mike):** [Contact Info] — Business logic, acceptance criteria questions
- **Technical Lead (Alex):** [Contact Info] — Computational methodology, data pipeline questions
- **Project Manager:** [Contact Info] — Timeline, resource allocation questions

**Response Time:** Within 4 hours during business hours (9am-5pm PT)

---

**Document Control:**
- **Version:** 1.0
- **Date Issued:** [Current Date]
- **Next Review:** Upon resubmission
- **Classification:** Internal — Project Team Only