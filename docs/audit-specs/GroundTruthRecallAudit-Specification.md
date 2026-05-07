# CSI Ground-Truth Recall Audit - Technical Specification

## Document Control

**Version:** 1.0  
**Date:** 2024-02-17  
**Status:** Draft - Specification Phase  
**Author:** Product Management  
**Purpose:** Technical specification for CSI system recall validation audit

---

## Executive Summary

### Purpose
The CSI Ground-Truth Recall Audit validates whether the Country Shock Index system successfully detects, routes, and scores real-world geopolitical events. This audit measures the system's **recall rate** (sensitivity) by comparing system outputs against a curated set of 70+ verified ground-truth events spanning all 7 CSI risk vectors.

### Key Objectives
1. **Detection Validation**: Verify the system detects known geopolitical events
2. **Routing Accuracy**: Confirm events are classified to correct risk vectors
3. **Recall Rate Measurement**: Calculate detection success rates per vector
4. **False Negative Analysis**: Identify and categorize missed events
5. **Expectation Weighting Validation**: Verify anticipatory drift behavior
6. **Root Cause Diagnosis**: Determine why events are missed (coverage, routing, scoring)

### Scope
- **Time Period**: Last 12 months (rolling window)
- **Event Coverage**: 70+ ground-truth events (10+ per vector)
- **Execution**: On-demand diagnostic audit
- **Output**: Detailed recall metrics, false negative taxonomy, remediation recommendations

### Success Criteria
- Overall recall rate ≥85% across all vectors
- Per-vector recall rate ≥75% for each of 7 vectors
- False negative root causes identified for 100% of missed events
- Expectation weighting validated for 90%+ of anticipated events
- Clear remediation roadmap for recall gaps

---

## 1. Audit Objectives

### 1.1 Primary Goals

**Detection Validation**
- Verify system detects documented geopolitical events
- Measure detection latency (event date → system detection)
- Identify detection blind spots by vector and geography

**Routing Accuracy**
- Confirm correct vector classification for detected events
- Measure routing precision and recall per vector
- Identify systematic misrouting patterns

**Recall Rate Measurement**
- Calculate true positive rate (detected / total ground-truth events)
- Measure recall by vector, severity, geography, event type
- Compare recall rates across different event characteristics

**False Negative Analysis**
- Identify all missed ground-truth events
- Classify root causes: coverage gap, routing failure, scoring suppression
- Prioritize remediation by impact and feasibility

**Expectation Weighting Validation**
- Verify drift-before-confirmation for anticipated events
- Measure anticipatory signal strength and timing
- Validate netting behavior on event confirmation

### 1.2 Out of Scope
- Precision measurement (false positives) - covered by Vector Movement Audit
- Baseline factor validation - covered by Phase 2 Addendum
- Real-time monitoring - this is a retrospective diagnostic
- Automated remediation - audit produces recommendations only

---

## 2. Technical Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Ground-Truth Recall Audit                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 1: Ground-Truth Event Registry             │  │
│  │   - 70+ verified events (10+ per vector)             │  │
│  │   - Event metadata: date, location, severity         │  │
│  │   - Expected CSI behavior: vectors, drift, delta     │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 2: Detection Matching Engine                │  │
│  │   - Temporal window matching (±7 days)                │  │
│  │   - Keyword/entity matching                           │  │
│  │   - Geographic matching                               │  │
│  │   - Confidence scoring                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 3: Routing Validation                       │  │
│  │   - Expected vs actual vector assignment              │  │
│  │   - Multi-vector event handling                       │  │
│  │   - Routing accuracy metrics                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 4: Recall Rate Calculation                  │  │
│  │   - Overall recall: TP / (TP + FN)                    │  │
│  │   - Per-vector recall rates                           │  │
│  │   - Stratified analysis (severity, geography)         │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 5: False Negative Taxonomy                  │  │
│  │   - Coverage gap: source missing                      │  │
│  │   - Routing failure: misclassified                    │  │
│  │   - Scoring suppression: detected but filtered        │  │
│  │   - Root cause decision tree                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Section 6: Expectation Weighting Validation         │  │
│  │   - Drift-before-confirmation check                   │  │
│  │   - Anticipatory signal timing                        │  │
│  │   - Netting behavior on confirmation                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Output: Diagnostic Report                           │  │
│  │   - Recall metrics dashboard                          │  │
│  │   - False negative catalog                            │  │
│  │   - Remediation recommendations                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Input Sources:**
1. Ground-truth event registry (manually curated)
2. CSI detection feed logs (raw ingestion data)
3. Routing classification logs (vector assignments)
4. Scoring pipeline logs (drift, event delta calculations)
5. Country daily CSI records (final outputs)

**Processing Pipeline:**
1. Load ground-truth events
2. For each event, search detection logs within temporal window
3. Match detections using keyword/entity/geography filters
4. Validate routing to expected vectors
5. Check for CSI impact (drift or event delta)
6. Classify detection status: detected, misrouted, suppressed, or missed
7. Calculate recall metrics
8. Generate diagnostic report

**Output Artifacts:**
1. Recall metrics by vector, severity, geography
2. False negative catalog with root causes
3. Detection latency distribution
4. Routing confusion matrix
5. Expectation weighting validation results
6. Remediation priority matrix

---

## 3. Data Requirements

### 3.1 Ground-Truth Event Registry Schema

```typescript
interface GroundTruthEvent {
  // Identification
  event_id: string;                    // Unique identifier (e.g., "GT_SAN_001")
  event_name: string;                  // Human-readable name
  event_type: EventType;               // DISCRETE | ESCALATION | SUSTAINED
  
  // Temporal
  event_date: Date;                    // Official event date
  detection_window_start: Date;        // event_date - 7 days
  detection_window_end: Date;          // event_date + 7 days
  anticipation_window_start: Date;     // For expected drift (event_date - 30 days)
  
  // Geographic
  primary_country: string;             // ISO3 code
  affected_countries: string[];        // Additional ISO3 codes
  region: string;                      // Geographic region
  
  // Classification
  primary_vector: CSIRiskVector;       // Expected primary vector
  secondary_vectors: CSIRiskVector[];  // Expected secondary vectors (if multi-vector)
  severity: 'MAJOR' | 'MODERATE' | 'MINOR';
  
  // Expected CSI Behavior
  expected_drift: boolean;             // Should produce drift signals?
  expected_confirmation: boolean;      // Should produce event delta?
  expected_drift_magnitude: number;    // Expected drift points (if applicable)
  expected_delta_magnitude: number;    // Expected event delta points (if applicable)
  
  // Validation Metadata
  source_url: string;                  // Official source documenting event
  source_type: 'GOVERNMENT' | 'INTERNATIONAL_ORG' | 'MEDIA' | 'REGISTRY';
  verification_confidence: number;     // 0.0-1.0 (curator confidence)
  
  // Selection Criteria Flags
  is_anticipated: boolean;             // Was event anticipated/announced?
  is_surprise: boolean;                // Was event unexpected?
  has_lead_indicators: boolean;        // Were there precursor signals?
  
  // Curator Notes
  selection_rationale: string;         // Why this event was selected
  expected_keywords: string[];         // Keywords likely in detection feeds
  notes: string;                       // Additional context
}

enum EventType {
  DISCRETE = 'DISCRETE',               // Single-day event (e.g., sanction announcement)
  ESCALATION = 'ESCALATION',           // Multi-day escalation (e.g., military buildup)
  SUSTAINED = 'SUSTAINED'              // Ongoing situation (e.g., protest movement)
}
```

### 3.2 Detection Matching Schema

```typescript
interface DetectionMatch {
  // Ground-Truth Reference
  ground_truth_event_id: string;
  
  // Detection Reference
  detection_id: string | null;         // Null if not detected
  detection_date: Date | null;
  detection_source: string | null;     // Which feed detected it
  detection_text: string | null;       // Raw detection text
  
  // Matching Metadata
  match_type: MatchType;
  match_confidence: number;            // 0.0-1.0
  match_method: string;                // "keyword" | "entity" | "manual"
  temporal_offset_days: number;        // Days between event and detection
  
  // Routing Validation
  routed_vector: CSIRiskVector | null;
  routing_correct: boolean;
  routing_confidence: number;          // System's routing confidence
  
  // Scoring Validation
  produced_drift: boolean;
  produced_event_delta: boolean;
  drift_magnitude: number;
  event_delta_magnitude: number;
  
  // Classification
  detection_status: DetectionStatus;
  false_negative_reason: FalseNegativeReason | null;
}

enum MatchType {
  EXACT_MATCH = 'EXACT_MATCH',         // High confidence match
  PROBABLE_MATCH = 'PROBABLE_MATCH',   // Medium confidence match
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',   // Low confidence match
  NO_MATCH = 'NO_MATCH'                // Not detected
}

enum DetectionStatus {
  DETECTED_CORRECT = 'DETECTED_CORRECT',           // Detected and routed correctly
  DETECTED_MISROUTED = 'DETECTED_MISROUTED',       // Detected but wrong vector
  DETECTED_SUPPRESSED = 'DETECTED_SUPPRESSED',     // Detected but filtered out
  NOT_DETECTED = 'NOT_DETECTED'                    // Completely missed
}

enum FalseNegativeReason {
  COVERAGE_GAP = 'COVERAGE_GAP',                   // Source feed missing
  ROUTING_FAILURE = 'ROUTING_FAILURE',             // Misclassified to wrong vector
  SCORING_SUPPRESSION = 'SCORING_SUPPRESSION',     // Detected but capped/netted/decayed
  KEYWORD_MISMATCH = 'KEYWORD_MISMATCH',           // Detection keywords insufficient
  TEMPORAL_MISMATCH = 'TEMPORAL_MISMATCH',         // Outside detection window
  GEOGRAPHIC_FILTER = 'GEOGRAPHIC_FILTER',         // Country not in scope
  DUPLICATE_SUPPRESSION = 'DUPLICATE_SUPPRESSION', // Merged with another event
  CONFIRMATION_ONLY = 'CONFIRMATION_ONLY'          // Only confirmation source, no detection
}
```

### 3.3 Recall Metrics Schema

```typescript
interface RecallMetrics {
  // Overall Metrics
  total_ground_truth_events: number;
  total_detected: number;
  total_missed: number;
  overall_recall_rate: number;         // detected / total
  
  // Per-Vector Metrics
  by_vector: Record<CSIRiskVector, VectorRecallMetrics>;
  
  // Stratified Metrics
  by_severity: Record<'MAJOR' | 'MODERATE' | 'MINOR', StratifiedRecallMetrics>;
  by_region: Record<string, StratifiedRecallMetrics>;
  by_event_type: Record<EventType, StratifiedRecallMetrics>;
  
  // Detection Latency
  mean_detection_latency_days: number;
  median_detection_latency_days: number;
  p90_detection_latency_days: number;
  
  // Routing Accuracy
  routing_accuracy: number;            // correct_routes / total_detected
  routing_confusion_matrix: ConfusionMatrix;
  
  // False Negative Breakdown
  false_negatives_by_reason: Record<FalseNegativeReason, number>;
  
  // Expectation Weighting
  anticipated_events_with_drift: number;
  anticipated_events_total: number;
  expectation_weighting_success_rate: number;
}

interface VectorRecallMetrics {
  vector: CSIRiskVector;
  total_events: number;
  detected: number;
  missed: number;
  recall_rate: number;
  mean_detection_latency_days: number;
  routing_accuracy: number;            // For this vector as primary
  common_misrouting_targets: Array<{vector: CSIRiskVector, count: number}>;
}

interface StratifiedRecallMetrics {
  category: string;
  total_events: number;
  detected: number;
  recall_rate: number;
}

interface ConfusionMatrix {
  // Rows = expected vector, Columns = actual vector
  matrix: Record<CSIRiskVector, Record<CSIRiskVector, number>>;
  row_totals: Record<CSIRiskVector, number>;
  column_totals: Record<CSIRiskVector, number>;
}
```

---

## 4. Ground-Truth Event Selection Criteria

### 4.1 Selection Methodology

**Objective**: Curate 70+ verifiable geopolitical events (10+ per vector) from the last 12 months that represent realistic CSI system inputs.

**Primary Sources by Vector:**

1. **Sanctions & Regulatory (10+ events)**
   - OFAC SDN List updates (https://sanctionssearch.ofac.treas.gov/)
   - EU Consolidated Sanctions List (https://www.sanctionsmap.eu/)
   - UN Security Council Sanctions (https://www.un.org/securitycouncil/sanctions)
   - UK OFSI Sanctions (https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation)

2. **Trade & Logistics (10+ events)**
   - USTR tariff announcements (https://ustr.gov/)
   - WTO dispute settlements (https://www.wto.org/english/tratop_e/dispu_e/dispu_e.htm)
   - Major trade agreement changes (FTAs, customs unions)
   - Port closures, shipping disruptions

3. **Currency & Capital Controls (10+ events)**
   - Central bank announcements (Fed, ECB, BoJ, PBoC, etc.)
   - IMF Article IV consultations (https://www.imf.org/en/Publications/CR)
   - Capital control implementations (AREAER database)
   - Currency crises, devaluations

4. **Cyber & Data (10+ events)**
   - CISA advisories (https://www.cisa.gov/news-events/cybersecurity-advisories)
   - Major breach disclosures (Fortune 500 companies)
   - State-sponsored attack attributions
   - Data localization law implementations

5. **Civil Unrest & Domestic Stability (10+ events)**
   - ACLED protest data (https://acleddata.com/)
   - Mass Mobilization Project (https://massmobilization.github.io/)
   - Major strike actions
   - Civil disorder events with ≥1000 participants

6. **Conflict & Security (10+ events)**
   - ACLED armed conflict data
   - IISS Armed Conflict Database (https://www.iiss.org/publications/armed-conflict-database)
   - Major military operations
   - Border conflicts, territorial disputes

7. **Governance & Rule of Law (10+ events)**
   - Freedom House reports (https://freedomhouse.org/)
   - V-Dem Democracy Reports (https://www.v-dem.net/)
   - Major constitutional changes
   - Regime transitions, coups

### 4.2 Event Selection Criteria

**Inclusion Criteria (ALL must be met):**
1. **Verifiable**: Official source documentation with clear date
2. **Significant**: International or national-level impact
3. **Recent**: Occurred within last 12 months
4. **Clear Vector**: Unambiguous primary vector assignment
5. **CSI-Relevant**: Should affect country risk perception
6. **Documentable**: Sufficient public information for validation

**Severity Distribution (Target Mix):**
- **40% Major Events**: International headlines, multi-country impact, lasting consequences
  - Examples: Russia sanctions packages, major military escalations, constitutional crises
- **40% Moderate Events**: Regional significance, single-country focus, medium-term impact
  - Examples: Bilateral trade disputes, localized conflicts, significant protests
- **20% Minor Events**: Local significance, short-term impact, limited scope
  - Examples: Minor regulatory changes, small-scale unrest, technical cyber incidents

**Geographic Distribution (Target Mix):**
- 30% Europe & North America
- 25% Asia-Pacific
- 20% Middle East & North Africa
- 15% Sub-Saharan Africa
- 10% Latin America

**Event Type Distribution (Target Mix):**
- 50% Discrete events (single-day announcements, decisions)
- 30% Escalation narratives (multi-day buildups, deteriorating situations)
- 20% Sustained situations (ongoing protests, prolonged conflicts)

**Anticipation Mix (Target Mix):**
- 60% Anticipated events (announced, scheduled, expected)
- 40% Surprise events (unexpected, sudden, shocking)

### 4.3 Severity Definitions

**MAJOR Events:**
- **Impact**: Multi-country, international headlines, lasting consequences (≥6 months)
- **Examples**:
  - Russia: New EU/US sanctions package (Sanctions)
  - China: Major tariff implementation (Trade)
  - Iran: Currency crisis, capital controls (Currency)
  - Ukraine: Military escalation (Conflict)
  - Brazil: Constitutional crisis (Governance)
  - Global: Major ransomware attack on critical infrastructure (Cyber)
  - France: Nationwide general strike (Unrest)
- **Expected CSI Impact**: ≥5 points on CSI scale
- **Detection Expectation**: Should be detected by multiple sources

**MODERATE Events:**
- **Impact**: Single-country or bilateral, regional headlines, medium-term consequences (1-6 months)
- **Examples**:
  - Belarus: Targeted sanctions on officials (Sanctions)
  - India-Pakistan: Border trade restrictions (Trade)
  - Turkey: Interest rate changes, FX controls (Currency)
  - Myanmar: Localized armed conflict (Conflict)
  - Poland: Judicial independence dispute (Governance)
  - Estonia: Government website DDoS attack (Cyber)
  - Chile: Large-scale protests (Unrest)
- **Expected CSI Impact**: 2-5 points on CSI scale
- **Detection Expectation**: Should be detected by primary sources

**MINOR Events:**
- **Impact**: Local significance, limited headlines, short-term consequences (<1 month)
- **Examples**:
  - Small country: Individual added to sanctions list (Sanctions)
  - Bilateral: Minor customs dispute (Trade)
  - Emerging market: Minor currency adjustment (Currency)
  - Regional: Small-scale border incident (Conflict)
  - Local: Municipal election irregularities (Governance)
  - Corporate: Data breach at mid-size company (Cyber)
  - City-level: Localized labor strike (Unrest)
- **Expected CSI Impact**: 0.5-2 points on CSI scale
- **Detection Expectation**: May be detected only by specialized sources

### 4.4 Event Documentation Template

For each ground-truth event, curators must document:

```markdown
## Event ID: GT_[VECTOR]_[NUMBER]

**Event Name**: [Concise description]
**Event Date**: [YYYY-MM-DD]
**Primary Country**: [ISO3]
**Affected Countries**: [ISO3, ISO3, ...]
**Region**: [Geographic region]

**Primary Vector**: [Vector name]
**Secondary Vectors**: [Vector names, if applicable]
**Severity**: [MAJOR | MODERATE | MINOR]
**Event Type**: [DISCRETE | ESCALATION | SUSTAINED]

**Official Source**: [URL to official documentation]
**Source Type**: [GOVERNMENT | INTERNATIONAL_ORG | MEDIA | REGISTRY]
**Verification Confidence**: [0.0-1.0]

**Expected CSI Behavior**:
- Expected Drift: [Yes/No]
- Expected Confirmation: [Yes/No]
- Expected Drift Magnitude: [Points]
- Expected Event Delta Magnitude: [Points]

**Anticipation Characteristics**:
- Is Anticipated: [Yes/No]
- Is Surprise: [Yes/No]
- Has Lead Indicators: [Yes/No]
- Anticipation Window: [If applicable, start date]

**Expected Keywords**: [keyword1, keyword2, keyword3, ...]

**Selection Rationale**: [Why this event was selected for ground-truth validation]

**Additional Notes**: [Any relevant context]
```

### 4.5 Example Ground-Truth Events

**Example 1: Major Sanctions Event**
```
Event ID: GT_SAN_001
Event Name: EU 12th Sanctions Package on Russia
Event Date: 2024-02-23
Primary Country: RUS
Affected Countries: RUS, BLR
Region: Europe

Primary Vector: Sanctions & Regulatory
Secondary Vectors: Trade & Logistics, Currency & Capital
Severity: MAJOR
Event Type: DISCRETE

Official Source: https://www.consilium.europa.eu/en/press/press-releases/2024/02/23/
Source Type: INTERNATIONAL_ORG
Verification Confidence: 1.0

Expected CSI Behavior:
- Expected Drift: Yes (announcement was anticipated)
- Expected Confirmation: Yes
- Expected Drift Magnitude: 2-3 points
- Expected Event Delta Magnitude: 5-7 points

Anticipation Characteristics:
- Is Anticipated: Yes (announced 2 weeks prior)
- Is Surprise: No
- Has Lead Indicators: Yes (EU statements, diplomatic meetings)
- Anticipation Window: 2024-02-09 (announcement date)

Expected Keywords: EU sanctions, Russia, 12th package, restrictive measures, OFAC

Selection Rationale: Major anticipated sanctions event with clear drift-before-confirmation expectation. Tests expectation weighting mechanism.
```

**Example 2: Surprise Conflict Event**
```
Event ID: GT_CON_001
Event Name: Sudan Armed Forces vs RSF Clashes in Khartoum
Event Date: 2023-04-15
Primary Country: SDN
Affected Countries: SDN
Region: Africa

Primary Vector: Conflict & Security
Secondary Vectors: Governance & Rule of Law
Severity: MAJOR
Event Type: ESCALATION

Official Source: https://www.acleddata.com/2023/04/15/sudan-violence-erupts/
Source Type: INTERNATIONAL_ORG
Verification Confidence: 0.95

Expected CSI Behavior:
- Expected Drift: No (surprise escalation)
- Expected Confirmation: Yes
- Expected Drift Magnitude: 0 points
- Expected Event Delta Magnitude: 8-10 points

Anticipation Characteristics:
- Is Anticipated: No
- Is Surprise: Yes
- Has Lead Indicators: No
- Anticipation Window: N/A

Expected Keywords: Sudan, Khartoum, armed forces, RSF, clashes, fighting

Selection Rationale: Major surprise conflict event with no anticipation. Tests system's ability to detect and respond to unexpected escalations without prior drift.
```

**Example 3: Moderate Cyber Event**
```
Event ID: GT_CYB_001
Event Name: MOVEit Transfer Zero-Day Exploitation
Event Date: 2023-05-31
Primary Country: USA
Affected Countries: USA, GBR, CAN, AUS (multiple)
Region: Global

Primary Vector: Cyber & Data
Secondary Vectors: None
Severity: MODERATE
Event Type: DISCRETE

Official Source: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a
Source Type: GOVERNMENT
Verification Confidence: 1.0

Expected CSI Behavior:
- Expected Drift: No (zero-day, no anticipation)
- Expected Confirmation: Yes
- Expected Drift Magnitude: 0 points
- Expected Event Delta Magnitude: 3-4 points

Anticipation Characteristics:
- Is Anticipated: No
- Is Surprise: Yes
- Has Lead Indicators: No
- Anticipation Window: N/A

Expected Keywords: MOVEit, zero-day, vulnerability, CVE-2023-34362, file transfer

Selection Rationale: Moderate cyber event affecting multiple countries. Tests system's ability to detect technical security incidents from government advisories.
```

---

## 5. Section-by-Section Specifications

### Section 1: Ground-Truth Event Registry

**Objective**: Curate and maintain a validated set of 70+ geopolitical events for recall testing.

**Data Structure**: See Section 3.1 (GroundTruthEvent schema)

**Curation Process**:
1. **Source Identification**: Identify events from primary sources (see Section 4.1)
2. **Event Verification**: Verify event occurred with official documentation
3. **Metadata Extraction**: Extract date, location, severity, vector classification
4. **Expected Behavior Definition**: Define expected CSI system response
5. **Keyword Generation**: Identify likely detection keywords
6. **Quality Review**: Peer review by second curator
7. **Registry Entry**: Add to ground-truth registry database

**Quality Criteria**:
- All events must have verification_confidence ≥ 0.8
- All events must have official source URL
- All events must have clear primary vector assignment
- Distribution targets must be met (see Section 4.2)

**Output Format**:
```json
{
  "registry_version": "1.0",
  "total_events": 72,
  "by_vector": {
    "SANCTIONS_REGULATORY": 11,
    "TRADE_LOGISTICS": 10,
    "CURRENCY_CAPITAL": 10,
    "CYBER_DATA": 10,
    "PUBLIC_UNREST": 10,
    "CONFLICT_SECURITY": 11,
    "GOVERNANCE_RULE_OF_LAW": 10
  },
  "by_severity": {
    "MAJOR": 29,
    "MODERATE": 29,
    "MINOR": 14
  },
  "events": [/* Array of GroundTruthEvent objects */]
}
```

---

### Section 2: Detection Matching Engine

**Objective**: Match ground-truth events to system detections using temporal, keyword, and geographic filters.

**Matching Algorithm**:

**Step 1: Temporal Window Search**
```typescript
function findDetectionsInWindow(
  groundTruthEvent: GroundTruthEvent,
  detectionLogs: DetectionLog[]
): DetectionLog[] {
  const windowStart = groundTruthEvent.detection_window_start;
  const windowEnd = groundTruthEvent.detection_window_end;
  
  return detectionLogs.filter(detection => 
    detection.timestamp >= windowStart &&
    detection.timestamp <= windowEnd &&
    detection.country === groundTruthEvent.primary_country
  );
}
```

**Step 2: Keyword Matching**
```typescript
function scoreKeywordMatch(
  detection: DetectionLog,
  expectedKeywords: string[]
): number {
  const detectionText = detection.title + ' ' + detection.description;
  const detectionTextLower = detectionText.toLowerCase();
  
  let matchCount = 0;
  for (const keyword of expectedKeywords) {
    if (detectionTextLower.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }
  
  // Keyword match score: matched / total expected
  return matchCount / expectedKeywords.length;
}
```

**Step 3: Entity Matching (if available)**
```typescript
function scoreEntityMatch(
  detection: DetectionLog,
  groundTruthEvent: GroundTruthEvent
): number {
  // Extract entities from detection (countries, organizations, people)
  const detectionEntities = extractEntities(detection);
  
  // Check for country match
  const countryMatch = detectionEntities.countries.includes(
    groundTruthEvent.primary_country
  );
  
  // Check for related entities (if documented in ground-truth)
  const entityOverlap = calculateEntityOverlap(
    detectionEntities,
    groundTruthEvent.expected_entities
  );
  
  return countryMatch ? 0.5 + (entityOverlap * 0.5) : entityOverlap;
}
```

**Step 4: Combined Matching Score**
```typescript
function calculateMatchConfidence(
  detection: DetectionLog,
  groundTruthEvent: GroundTruthEvent
): { matchType: MatchType, confidence: number } {
  const keywordScore = scoreKeywordMatch(detection, groundTruthEvent.expected_keywords);
  const entityScore = scoreEntityMatch(detection, groundTruthEvent);
  const temporalScore = calculateTemporalProximity(detection, groundTruthEvent);
  
  // Weighted combination
  const combinedScore = (keywordScore * 0.5) + (entityScore * 0.3) + (temporalScore * 0.2);
  
  // Classify match type based on score
  if (combinedScore >= 0.8) {
    return { matchType: MatchType.EXACT_MATCH, confidence: combinedScore };
  } else if (combinedScore >= 0.6) {
    return { matchType: MatchType.PROBABLE_MATCH, confidence: combinedScore };
  } else if (combinedScore >= 0.4) {
    return { matchType: MatchType.POSSIBLE_MATCH, confidence: combinedScore };
  } else {
    return { matchType: MatchType.NO_MATCH, confidence: combinedScore };
  }
}
```

**Manual Review Triggers**:
- No detections found in temporal window
- Multiple possible matches with similar scores
- Match confidence < 0.8 for MAJOR severity events
- Misrouting detected (detection exists but wrong vector)

**Output Format**:
```typescript
interface MatchingResult {
  ground_truth_event_id: string;
  detection_status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS';
  best_match: DetectionMatch | null;
  alternative_matches: DetectionMatch[];
  requires_manual_review: boolean;
  review_reason: string | null;
}
```

---

### Section 3: Routing Validation

**Objective**: Verify detected events are routed to correct CSI risk vectors.

**Routing Validation Logic**:

**Step 1: Primary Vector Check**
```typescript
function validatePrimaryRouting(
  detection: DetectionMatch,
  groundTruthEvent: GroundTruthEvent
): boolean {
  return detection.routed_vector === groundTruthEvent.primary_vector;
}
```

**Step 2: Multi-Vector Event Handling**
```typescript
function validateMultiVectorRouting(
  detection: DetectionMatch,
  groundTruthEvent: GroundTruthEvent
): { correct: boolean, explanation: string } {
  const expectedVectors = [
    groundTruthEvent.primary_vector,
    ...groundTruthEvent.secondary_vectors
  ];
  
  if (expectedVectors.includes(detection.routed_vector)) {
    return {
      correct: true,
      explanation: `Routed to ${detection.routed_vector}, which is an expected vector`
    };
  } else {
    return {
      correct: false,
      explanation: `Routed to ${detection.routed_vector}, expected one of: ${expectedVectors.join(', ')}`
    };
  }
}
```

**Step 3: Routing Confidence Analysis**
```typescript
function analyzeRoutingConfidence(
  detection: DetectionMatch
): { confidence: number, threshold_met: boolean } {
  // System's routing confidence (from classifier)
  const systemConfidence = detection.routing_confidence;
  
  // Threshold for confident routing
  const CONFIDENCE_THRESHOLD = 0.7;
  
  return {
    confidence: systemConfidence,
    threshold_met: systemConfidence >= CONFIDENCE_THRESHOLD
  };
}
```

**Routing Confusion Matrix**:
```typescript
interface ConfusionMatrix {
  // Rows = expected (ground-truth) vector
  // Columns = actual (system-routed) vector
  matrix: Record<CSIRiskVector, Record<CSIRiskVector, number>>;
  
  // Derived metrics
  row_totals: Record<CSIRiskVector, number>;      // Total events per expected vector
  column_totals: Record<CSIRiskVector, number>;   // Total detections per routed vector
  diagonal: Record<CSIRiskVector, number>;        // Correct routings per vector
  precision: Record<CSIRiskVector, number>;       // TP / (TP + FP) per vector
  recall: Record<CSIRiskVector, number>;          // TP / (TP + FN) per vector
  f1_score: Record<CSIRiskVector, number>;        // Harmonic mean of precision and recall
}

function buildConfusionMatrix(
  detectionMatches: DetectionMatch[],
  groundTruthEvents: GroundTruthEvent[]
): ConfusionMatrix {
  // Initialize matrix
  const matrix: Record<CSIRiskVector, Record<CSIRiskVector, number>> = {};
  for (const vector of Object.values(CSIRiskVector)) {
    matrix[vector] = {};
    for (const innerVector of Object.values(CSIRiskVector)) {
      matrix[vector][innerVector] = 0;
    }
  }
  
  // Populate matrix
  for (const match of detectionMatches) {
    if (match.detection_status === DetectionStatus.DETECTED_CORRECT ||
        match.detection_status === DetectionStatus.DETECTED_MISROUTED) {
      const groundTruth = groundTruthEvents.find(e => e.event_id === match.ground_truth_event_id);
      if (groundTruth && match.routed_vector) {
        matrix[groundTruth.primary_vector][match.routed_vector]++;
      }
    }
  }
  
  // Calculate derived metrics
  const row_totals: Record<CSIRiskVector, number> = {};
  const column_totals: Record<CSIRiskVector, number> = {};
  const diagonal: Record<CSIRiskVector, number> = {};
  
  for (const expected of Object.values(CSIRiskVector)) {
    row_totals[expected] = Object.values(matrix[expected]).reduce((a, b) => a + b, 0);
    diagonal[expected] = matrix[expected][expected];
  }
  
  for (const actual of Object.values(CSIRiskVector)) {
    column_totals[actual] = Object.values(CSIRiskVector)
      .reduce((sum, expected) => sum + matrix[expected][actual], 0);
  }
  
  // Calculate precision, recall, F1
  const precision: Record<CSIRiskVector, number> = {};
  const recall: Record<CSIRiskVector, number> = {};
  const f1_score: Record<CSIRiskVector, number> = {};
  
  for (const vector of Object.values(CSIRiskVector)) {
    precision[vector] = column_totals[vector] > 0 
      ? diagonal[vector] / column_totals[vector] 
      : 0;
    recall[vector] = row_totals[vector] > 0 
      ? diagonal[vector] / row_totals[vector] 
      : 0;
    f1_score[vector] = (precision[vector] + recall[vector]) > 0
      ? 2 * (precision[vector] * recall[vector]) / (precision[vector] + recall[vector])
      : 0;
  }
  
  return {
    matrix,
    row_totals,
    column_totals,
    diagonal,
    precision,
    recall,
    f1_score
  };
}
```

**Common Misrouting Patterns**:
```typescript
interface MisroutingPattern {
  from_vector: CSIRiskVector;
  to_vector: CSIRiskVector;
  count: number;
  percentage: number;
  example_events: string[];
  suspected_cause: string;
}

function identifyMisroutingPatterns(
  confusionMatrix: ConfusionMatrix,
  detectionMatches: DetectionMatch[]
): MisroutingPattern[] {
  const patterns: MisroutingPattern[] = [];
  
  // Find off-diagonal cells with count ≥ 3
  for (const expected of Object.values(CSIRiskVector)) {
    for (const actual of Object.values(CSIRiskVector)) {
      if (expected !== actual && confusionMatrix.matrix[expected][actual] >= 3) {
        const count = confusionMatrix.matrix[expected][actual];
        const percentage = (count / confusionMatrix.row_totals[expected]) * 100;
        
        // Find example events
        const examples = detectionMatches
          .filter(m => {
            const gt = groundTruthEvents.find(e => e.event_id === m.ground_truth_event_id);
            return gt?.primary_vector === expected && m.routed_vector === actual;
          })
          .slice(0, 3)
          .map(m => m.ground_truth_event_id);
        
        patterns.push({
          from_vector: expected,
          to_vector: actual,
          count,
          percentage,
          example_events: examples,
          suspected_cause: inferMisroutingCause(expected, actual, examples)
        });
      }
    }
  }
  
  return patterns.sort((a, b) => b.count - a.count);
}

function inferMisroutingCause(
  expected: CSIRiskVector,
  actual: CSIRiskVector,
  examples: string[]
): string {
  // Pattern-based inference
  const patterns: Record<string, string> = {
    'SANCTIONS_REGULATORY->TRADE_LOGISTICS': 'Trade-related sanctions misclassified due to keyword overlap',
    'CONFLICT_SECURITY->GOVERNANCE_RULE_OF_LAW': 'Military coups misclassified as governance events',
    'CYBER_DATA->CONFLICT_SECURITY': 'State-sponsored cyberattacks misclassified as kinetic conflict',
    'PUBLIC_UNREST->GOVERNANCE_RULE_OF_LAW': 'Protests against government misclassified as governance changes',
    'CURRENCY_CAPITAL->TRADE_LOGISTICS': 'Currency controls affecting trade misclassified',
  };
  
  const key = `${expected}->${actual}`;
  return patterns[key] || 'Keyword overlap or classifier ambiguity';
}
```

**Output Format**:
```json
{
  "routing_validation": {
    "total_detected": 65,
    "correctly_routed": 58,
    "misrouted": 7,
    "routing_accuracy": 0.892,
    "confusion_matrix": {/* ConfusionMatrix object */},
    "misrouting_patterns": [/* Array of MisroutingPattern objects */]
  }
}
```

---

### Section 4: Recall Rate Calculation

**Objective**: Calculate detection success rates across all dimensions.

**Overall Recall Rate**:
```typescript
function calculateOverallRecall(
  detectionMatches: DetectionMatch[]
): number {
  const total = detectionMatches.length;
  const detected = detectionMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_CORRECT ||
    m.detection_status === DetectionStatus.DETECTED_MISROUTED
  ).length;
  
  return detected / total;
}
```

**Per-Vector Recall**:
```typescript
function calculateVectorRecall(
  detectionMatches: DetectionMatch[],
  groundTruthEvents: GroundTruthEvent[],
  vector: CSIRiskVector
): VectorRecallMetrics {
  // Filter events for this vector
  const vectorEvents = groundTruthEvents.filter(e => e.primary_vector === vector);
  const vectorMatches = detectionMatches.filter(m => {
    const event = groundTruthEvents.find(e => e.event_id === m.ground_truth_event_id);
    return event?.primary_vector === vector;
  });
  
  const total = vectorEvents.length;
  const detected = vectorMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_CORRECT ||
    m.detection_status === DetectionStatus.DETECTED_MISROUTED
  ).length;
  const missed = total - detected;
  
  // Calculate detection latency for detected events
  const detectedMatches = vectorMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_CORRECT ||
    m.detection_status === DetectionStatus.DETECTED_MISROUTED
  );
  const latencies = detectedMatches.map(m => m.temporal_offset_days);
  const meanLatency = latencies.length > 0 
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
    : 0;
  
  // Calculate routing accuracy for this vector
  const correctlyRouted = vectorMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_CORRECT
  ).length;
  const routingAccuracy = detected > 0 ? correctlyRouted / detected : 0;
  
  // Identify common misrouting targets
  const misrouted = vectorMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_MISROUTED
  );
  const misroutingTargets: Record<CSIRiskVector, number> = {};
  for (const match of misrouted) {
    if (match.routed_vector) {
      misroutingTargets[match.routed_vector] = (misroutingTargets[match.routed_vector] || 0) + 1;
    }
  }
  const commonMisroutingTargets = Object.entries(misroutingTargets)
    .map(([vector, count]) => ({ vector: vector as CSIRiskVector, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    vector,
    total_events: total,
    detected,
    missed,
    recall_rate: detected / total,
    mean_detection_latency_days: meanLatency,
    routing_accuracy: routingAccuracy,
    common_misrouting_targets: commonMisroutingTargets
  };
}
```

**Stratified Recall (by Severity, Region, Event Type)**:
```typescript
function calculateStratifiedRecall(
  detectionMatches: DetectionMatch[],
  groundTruthEvents: GroundTruthEvent[],
  stratifyBy: 'severity' | 'region' | 'event_type'
): Record<string, StratifiedRecallMetrics> {
  const results: Record<string, StratifiedRecallMetrics> = {};
  
  // Get unique categories
  const categories = new Set(groundTruthEvents.map(e => {
    switch (stratifyBy) {
      case 'severity': return e.severity;
      case 'region': return e.region;
      case 'event_type': return e.event_type;
    }
  }));
  
  // Calculate recall for each category
  for (const category of categories) {
    const categoryEvents = groundTruthEvents.filter(e => {
      switch (stratifyBy) {
        case 'severity': return e.severity === category;
        case 'region': return e.region === category;
        case 'event_type': return e.event_type === category;
      }
    });
    
    const categoryMatches = detectionMatches.filter(m => {
      const event = groundTruthEvents.find(e => e.event_id === m.ground_truth_event_id);
      if (!event) return false;
      switch (stratifyBy) {
        case 'severity': return event.severity === category;
        case 'region': return event.region === category;
        case 'event_type': return event.event_type === category;
      }
    });
    
    const total = categoryEvents.length;
    const detected = categoryMatches.filter(m => 
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    ).length;
    
    results[category] = {
      category,
      total_events: total,
      detected,
      recall_rate: detected / total
    };
  }
  
  return results;
}
```

**Detection Latency Distribution**:
```typescript
function calculateLatencyDistribution(
  detectionMatches: DetectionMatch[]
): {
  mean: number;
  median: number;
  p90: number;
  p95: number;
  distribution: Array<{ days: number, count: number }>;
} {
  const detectedMatches = detectionMatches.filter(m => 
    m.detection_status === DetectionStatus.DETECTED_CORRECT ||
    m.detection_status === DetectionStatus.DETECTED_MISROUTED
  );
  
  const latencies = detectedMatches
    .map(m => Math.abs(m.temporal_offset_days))
    .sort((a, b) => a - b);
  
  if (latencies.length === 0) {
    return { mean: 0, median: 0, p90: 0, p95: 0, distribution: [] };
  }
  
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const median = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  
  // Create distribution histogram (0-7 days)
  const distribution: Array<{ days: number, count: number }> = [];
  for (let day = 0; day <= 7; day++) {
    const count = latencies.filter(l => l === day).length;
    distribution.push({ days: day, count });
  }
  
  return { mean, median, p90, p95, distribution };
}
```

**Success Criteria**:
- Overall recall rate ≥ 85%
- Per-vector recall rate ≥ 75% for all 7 vectors
- MAJOR event recall rate ≥ 95%
- MODERATE event recall rate ≥ 85%
- MINOR event recall rate ≥ 70%
- Mean detection latency ≤ 2 days
- Routing accuracy ≥ 90%

**Output Format**:
```json
{
  "recall_metrics": {
    "overall_recall_rate": 0.875,
    "total_ground_truth_events": 72,
    "total_detected": 63,
    "total_missed": 9,
    "by_vector": {/* VectorRecallMetrics per vector */},
    "by_severity": {/* StratifiedRecallMetrics per severity */},
    "by_region": {/* StratifiedRecallMetrics per region */},
    "by_event_type": {/* StratifiedRecallMetrics per event type */},
    "detection_latency": {/* Latency distribution */},
    "routing_accuracy": 0.905
  }
}
```

---

### Section 5: False Negative Taxonomy

**Objective**: Classify all missed events by root cause to guide remediation.

**False Negative Classification Decision Tree**:

```
Was the event detected in ANY form?
├─ NO → Coverage Gap
│  ├─ Check: Is source feed active?
│  │  ├─ NO → Coverage Gap: Source Missing
│  │  └─ YES → Coverage Gap: Keyword Mismatch
│  └─ Check: Is country in scope?
│     ├─ NO → Coverage Gap: Geographic Filter
│     └─ YES → Coverage Gap: Temporal Mismatch
│
└─ YES → Detection exists, but...
   ├─ Was it routed to correct vector?
   │  ├─ NO → Routing Failure
   │  │  └─ Identify: Misrouted to which vector?
   │  └─ YES → Scoring Suppression
   │     ├─ Check: Did it produce drift/event delta?
   │     │  ├─ NO → Scoring Suppression: Filtered
   │     │  └─ YES → Check magnitude
   │     │     ├─ Below threshold → Scoring Suppression: Capped
   │     │     └─ Netted away → Scoring Suppression: Netted
   │     └─ Check: Was it decayed?
   │        └─ YES → Scoring Suppression: Decayed
   └─ Was it merged with another event?
      └─ YES → Duplicate Suppression
```

**Classification Algorithm**:
```typescript
function classifyFalseNegative(
  groundTruthEvent: GroundTruthEvent,
  detectionMatch: DetectionMatch,
  detectionLogs: DetectionLog[],
  routingLogs: RoutingLog[],
  scoringLogs: ScoringLog[]
): FalseNegativeClassification {
  
  // Step 1: Check if detected at all
  const detections = findDetectionsInWindow(groundTruthEvent, detectionLogs);
  
  if (detections.length === 0) {
    // Coverage gap - no detection found
    return classifyCoverageGap(groundTruthEvent, detectionLogs);
  }
  
  // Step 2: Check routing
  const bestDetection = detections[0]; // Assume first is best match
  const routing = routingLogs.find(r => r.detection_id === bestDetection.id);
  
  if (!routing || routing.assigned_vector !== groundTruthEvent.primary_vector) {
    // Routing failure
    return {
      reason: FalseNegativeReason.ROUTING_FAILURE,
      details: `Detected but routed to ${routing?.assigned_vector || 'unknown'} instead of ${groundTruthEvent.primary_vector}`,
      detection_id: bestDetection.id,
      remediation: 'Retrain routing classifier with this example'
    };
  }
  
  // Step 3: Check scoring
  const scoring = scoringLogs.find(s => s.detection_id === bestDetection.id);
  
  if (!scoring) {
    return {
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      details: 'Detected and routed correctly but no scoring record found',
      detection_id: bestDetection.id,
      remediation: 'Investigate scoring pipeline for this detection'
    };
  }
  
  if (scoring.drift_points === 0 && scoring.event_delta_points === 0) {
    return {
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      details: 'Detected and routed correctly but produced zero CSI impact',
      detection_id: bestDetection.id,
      remediation: 'Review scoring thresholds and caps'
    };
  }
  
  if (scoring.was_capped) {
    return {
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      details: `Impact capped at ${scoring.cap_threshold}`,
      detection_id: bestDetection.id,
      remediation: 'Review cap thresholds for this vector'
    };
  }
  
  if (scoring.was_netted) {
    return {
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      details: 'Drift netted away on confirmation',
      detection_id: bestDetection.id,
      remediation: 'Expected behavior for anticipated events'
    };
  }
  
  if (scoring.was_decayed) {
    return {
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      details: `Decayed after ${scoring.decay_days} days`,
      detection_id: bestDetection.id,
      remediation: 'Review decay parameters'
    };
  }
  
  // If we reach here, event was detected, routed, and scored correctly
  // This shouldn't happen for a "false negative"
  return {
    reason: FalseNegativeReason.SCORING_SUPPRESSION,
    details: 'Event processed correctly but may have been below display threshold',
    detection_id: bestDetection.id,
    remediation: 'Review display thresholds'
  };
}

function classifyCoverageGap(
  groundTruthEvent: GroundTruthEvent,
  detectionLogs: DetectionLog[]
): FalseNegativeClassification {
  
  // Check if source feed was active during event window
  const sourceFeedActive = checkSourceFeedStatus(
    groundTruthEvent.detection_window_start,
    groundTruthEvent.detection_window_end
  );
  
  if (!sourceFeedActive) {
    return {
      reason: FalseNegativeReason.COVERAGE_GAP,
      details: 'Primary detection source was inactive during event window',
      detection_id: null,
      remediation: 'Add redundant sources for this vector'
    };
  }
  
  // Check if country is in scope
  const countryInScope = COUNTRY_DATABASE.some(c => c.country_id === groundTruthEvent.primary_country);
  
  if (!countryInScope) {
    return {
      reason: FalseNegativeReason.GEOGRAPHIC_FILTER,
      details: `Country ${groundTruthEvent.primary_country} not in CSI scope`,
      detection_id: null,
      remediation: 'Expand geographic coverage or document exclusion'
    };
  }
  
  // Check for near-miss detections (outside window but close)
  const nearMisses = detectionLogs.filter(d => 
    d.country === groundTruthEvent.primary_country &&
    Math.abs(d.timestamp.getTime() - groundTruthEvent.event_date.getTime()) <= 14 * 24 * 60 * 60 * 1000 // 14 days
  );
  
  if (nearMisses.length > 0) {
    return {
      reason: FalseNegativeReason.TEMPORAL_MISMATCH,
      details: `Detection found ${Math.abs(nearMisses[0].timestamp.getTime() - groundTruthEvent.event_date.getTime()) / (24 * 60 * 60 * 1000)} days from event`,
      detection_id: nearMisses[0].id,
      remediation: 'Review temporal matching window or event date accuracy'
    };
  }
  
  // Default: keyword mismatch
  return {
    reason: FalseNegativeReason.KEYWORD_MISMATCH,
    details: 'No detection found matching expected keywords',
    detection_id: null,
    remediation: `Expand keyword coverage for: ${groundTruthEvent.expected_keywords.join(', ')}`
  };
}

interface FalseNegativeClassification {
  reason: FalseNegativeReason;
  details: string;
  detection_id: string | null;
  remediation: string;
}
```

**False Negative Catalog**:
```typescript
interface FalseNegativeCatalog {
  total_false_negatives: number;
  by_reason: Record<FalseNegativeReason, number>;
  by_vector: Record<CSIRiskVector, Array<{
    event_id: string;
    event_name: string;
    reason: FalseNegativeReason;
    details: string;
    remediation: string;
  }>>;
  priority_remediations: Array<{
    reason: FalseNegativeReason;
    affected_events: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    recommended_action: string;
  }>;
}

function buildFalseNegativeCatalog(
  detectionMatches: DetectionMatch[],
  groundTruthEvents: GroundTruthEvent[],
  classifications: FalseNegativeClassification[]
): FalseNegativeCatalog {
  const falseNegatives = detectionMatches.filter(m => 
    m.detection_status === DetectionStatus.NOT_DETECTED ||
    m.detection_status === DetectionStatus.DETECTED_SUPPRESSED
  );
  
  // Count by reason
  const by_reason: Record<FalseNegativeReason, number> = {} as any;
  for (const reason of Object.values(FalseNegativeReason)) {
    by_reason[reason] = classifications.filter(c => c.reason === reason).length;
  }
  
  // Group by vector
  const by_vector: Record<CSIRiskVector, any[]> = {} as any;
  for (const vector of Object.values(CSIRiskVector)) {
    by_vector[vector] = [];
  }
  
  for (const match of falseNegatives) {
    const event = groundTruthEvents.find(e => e.event_id === match.ground_truth_event_id);
    const classification = classifications.find(c => 
      c.detection_id === match.detection_id || 
      (c.detection_id === null && match.detection_id === null)
    );
    
    if (event && classification) {
      by_vector[event.primary_vector].push({
        event_id: event.event_id,
        event_name: event.event_name,
        reason: classification.reason,
        details: classification.details,
        remediation: classification.remediation
      });
    }
  }
  
  // Prioritize remediations
  const priority_remediations = prioritizeRemediations(by_reason, classifications);
  
  return {
    total_false_negatives: falseNegatives.length,
    by_reason,
    by_vector,
    priority_remediations
  };
}

function prioritizeRemediations(
  by_reason: Record<FalseNegativeReason, number>,
  classifications: FalseNegativeClassification[]
): Array<{
  reason: FalseNegativeReason;
  affected_events: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommended_action: string;
}> {
  const remediations = [];
  
  // Coverage gaps are highest priority
  if (by_reason[FalseNegativeReason.COVERAGE_GAP] > 0) {
    remediations.push({
      reason: FalseNegativeReason.COVERAGE_GAP,
      affected_events: by_reason[FalseNegativeReason.COVERAGE_GAP],
      priority: 'HIGH' as const,
      recommended_action: 'Add redundant detection sources for affected vectors'
    });
  }
  
  // Routing failures are high priority
  if (by_reason[FalseNegativeReason.ROUTING_FAILURE] > 0) {
    remediations.push({
      reason: FalseNegativeReason.ROUTING_FAILURE,
      affected_events: by_reason[FalseNegativeReason.ROUTING_FAILURE],
      priority: 'HIGH' as const,
      recommended_action: 'Retrain routing classifier with false negative examples'
    });
  }
  
  // Scoring suppression is medium priority
  if (by_reason[FalseNegativeReason.SCORING_SUPPRESSION] > 0) {
    remediations.push({
      reason: FalseNegativeReason.SCORING_SUPPRESSION,
      affected_events: by_reason[FalseNegativeReason.SCORING_SUPPRESSION],
      priority: 'MEDIUM' as const,
      recommended_action: 'Review cap, netting, and decay parameters'
    });
  }
  
  // Keyword mismatch is medium priority
  if (by_reason[FalseNegativeReason.KEYWORD_MISMATCH] > 0) {
    remediations.push({
      reason: FalseNegativeReason.KEYWORD_MISMATCH,
      affected_events: by_reason[FalseNegativeReason.KEYWORD_MISMATCH],
      priority: 'MEDIUM' as const,
      recommended_action: 'Expand keyword dictionaries for affected vectors'
    });
  }
  
  // Other reasons are lower priority
  for (const reason of Object.values(FalseNegativeReason)) {
    if (by_reason[reason] > 0 && !remediations.some(r => r.reason === reason)) {
      remediations.push({
        reason,
        affected_events: by_reason[reason],
        priority: 'LOW' as const,
        recommended_action: 'Review and address on case-by-case basis'
      });
    }
  }
  
  return remediations.sort((a, b) => b.affected_events - a.affected_events);
}
```

**Output Format**:
```json
{
  "false_negative_catalog": {
    "total_false_negatives": 9,
    "by_reason": {
      "COVERAGE_GAP": 3,
      "ROUTING_FAILURE": 2,
      "SCORING_SUPPRESSION": 3,
      "KEYWORD_MISMATCH": 1
    },
    "by_vector": {/* Detailed breakdown per vector */},
    "priority_remediations": [/* Prioritized action items */]
  }
}
```

---

### Section 6: Expectation Weighting Validation

**Objective**: Verify the system correctly implements anticipatory drift and netting for expected events.

**Anticipated Event Identification**:
```typescript
function identifyAnticipatedEvents(
  groundTruthEvents: GroundTruthEvent[]
): GroundTruthEvent[] {
  return groundTruthEvents.filter(e => 
    e.is_anticipated === true &&
    e.expected_drift === true
  );
}
```

**Drift-Before-Confirmation Check**:
```typescript
interface ExpectationWeightingValidation {
  event_id: string;
  event_name: string;
  anticipation_window_start: Date;
  event_date: Date;
  
  drift_detected: boolean;
  drift_start_date: Date | null;
  drift_magnitude: number;
  drift_within_window: boolean;
  
  confirmation_detected: boolean;
  confirmation_date: Date | null;
  event_delta_magnitude: number;
  
  netting_occurred: boolean;
  netting_amount: number;
  
  validation_passed: boolean;
  failure_reason: string | null;
}

function validateExpectationWeighting(
  groundTruthEvent: GroundTruthEvent,
  detectionMatch: DetectionMatch,
  driftLogs: DriftLog[],
  eventLogs: EventLog[]
): ExpectationWeightingValidation {
  
  // Find drift signals in anticipation window
  const driftSignals = driftLogs.filter(d => 
    d.country === groundTruthEvent.primary_country &&
    d.vector === groundTruthEvent.primary_vector &&
    d.timestamp >= groundTruthEvent.anticipation_window_start &&
    d.timestamp < groundTruthEvent.event_date
  );
  
  const drift_detected = driftSignals.length > 0;
  const drift_start_date = drift_detected ? driftSignals[0].timestamp : null;
  const drift_magnitude = driftSignals.reduce((sum, d) => sum + d.drift_points, 0);
  const drift_within_window = drift_detected && 
    drift_start_date! >= groundTruthEvent.anticipation_window_start;
  
  // Find confirmation event
  const confirmationEvents = eventLogs.filter(e => 
    e.country === groundTruthEvent.primary_country &&
    e.vector === groundTruthEvent.primary_vector &&
    Math.abs(e.timestamp.getTime() - groundTruthEvent.event_date.getTime()) <= 7 * 24 * 60 * 60 * 1000
  );
  
  const confirmation_detected = confirmationEvents.length > 0;
  const confirmation_date = confirmation_detected ? confirmationEvents[0].timestamp : null;
  const event_delta_magnitude = confirmationEvents.reduce((sum, e) => sum + e.event_delta_points, 0);
  
  // Check for netting
  let netting_occurred = false;
  let netting_amount = 0;
  
  if (drift_detected && confirmation_detected) {
    // Look for netting record
    const nettingRecord = eventLogs.find(e => 
      e.country === groundTruthEvent.primary_country &&
      e.vector === groundTruthEvent.primary_vector &&
      e.netted_drift_amount !== undefined &&
      e.netted_drift_amount > 0
    );
    
    if (nettingRecord) {
      netting_occurred = true;
      netting_amount = nettingRecord.netted_drift_amount;
    }
  }
  
  // Validation logic
  let validation_passed = true;
  let failure_reason: string | null = null;
  
  if (!drift_detected) {
    validation_passed = false;
    failure_reason = 'No drift detected in anticipation window';
  } else if (!drift_within_window) {
    validation_passed = false;
    failure_reason = 'Drift detected outside anticipation window';
  } else if (!confirmation_detected) {
    validation_passed = false;
    failure_reason = 'Confirmation event not detected';
  } else if (!netting_occurred && drift_magnitude > 1.0) {
    // Netting should occur for significant drift
    validation_passed = false;
    failure_reason = 'Drift not netted on confirmation';
  }
  
  return {
    event_id: groundTruthEvent.event_id,
    event_name: groundTruthEvent.event_name,
    anticipation_window_start: groundTruthEvent.anticipation_window_start,
    event_date: groundTruthEvent.event_date,
    drift_detected,
    drift_start_date,
    drift_magnitude,
    drift_within_window,
    confirmation_detected,
    confirmation_date,
    event_delta_magnitude,
    netting_occurred,
    netting_amount,
    validation_passed,
    failure_reason
  };
}
```

**Anticipatory Signal Timing Analysis**:
```typescript
interface AnticipationTimingAnalysis {
  total_anticipated_events: number;
  events_with_drift: number;
  events_without_drift: number;
  
  drift_timing_distribution: Array<{
    days_before_event: number;
    count: number;
  }>;
  
  mean_anticipation_lead_time: number;
  median_anticipation_lead_time: number;
  
  netting_success_rate: number;
  mean_netting_amount: number;
}

function analyzeAnticipationTiming(
  validations: ExpectationWeightingValidation[]
): AnticipationTimingAnalysis {
  const total = validations.length;
  const with_drift = validations.filter(v => v.drift_detected).length;
  const without_drift = total - with_drift;
  
  // Calculate lead times
  const lead_times = validations
    .filter(v => v.drift_detected && v.drift_start_date)
    .map(v => {
      const days = (v.event_date.getTime() - v.drift_start_date!.getTime()) / (24 * 60 * 60 * 1000);
      return Math.floor(days);
    })
    .sort((a, b) => a - b);
  
  const mean_lead_time = lead_times.length > 0
    ? lead_times.reduce((a, b) => a + b, 0) / lead_times.length
    : 0;
  const median_lead_time = lead_times.length > 0
    ? lead_times[Math.floor(lead_times.length * 0.5)]
    : 0;
  
  // Create distribution histogram
  const distribution: Array<{ days_before_event: number, count: number }> = [];
  for (let days = 0; days <= 30; days += 5) {
    const count = lead_times.filter(l => l >= days && l < days + 5).length;
    distribution.push({ days_before_event: days, count });
  }
  
  // Netting analysis
  const netting_events = validations.filter(v => v.netting_occurred);
  const netting_success_rate = with_drift > 0 ? netting_events.length / with_drift : 0;
  const mean_netting_amount = netting_events.length > 0
    ? netting_events.reduce((sum, v) => sum + v.netting_amount, 0) / netting_events.length
    : 0;
  
  return {
    total_anticipated_events: total,
    events_with_drift: with_drift,
    events_without_drift: without_drift,
    drift_timing_distribution: distribution,
    mean_anticipation_lead_time: mean_lead_time,
    median_anticipation_lead_time: median_lead_time,
    netting_success_rate,
    mean_netting_amount
  };
}
```

**Success Criteria**:
- Drift-before-confirmation rate ≥ 90% for anticipated events
- Mean anticipation lead time: 7-14 days
- Netting success rate ≥ 95% for events with drift
- No false anticipation (drift without subsequent confirmation) > 10%

**Output Format**:
```json
{
  "expectation_weighting_validation": {
    "total_anticipated_events": 25,
    "validations": [/* Array of ExpectationWeightingValidation objects */],
    "timing_analysis": {/* AnticipationTimingAnalysis object */},
    "success_rate": 0.92,
    "failures": [/* Events that failed validation */]
  }
}
```

---

## 6. Success Criteria

### 6.1 Quantitative Thresholds

**Overall Recall**:
- ✅ Overall recall rate ≥ 85%
- ✅ Total detected events ≥ 61 out of 72

**Per-Vector Recall**:
- ✅ Each vector recall rate ≥ 75%
- ✅ No vector with recall < 70%

**Severity-Stratified Recall**:
- ✅ MAJOR events: recall ≥ 95%
- ✅ MODERATE events: recall ≥ 85%
- ✅ MINOR events: recall ≥ 70%

**Detection Latency**:
- ✅ Mean latency ≤ 2 days
- ✅ Median latency ≤ 1 day
- ✅ P90 latency ≤ 4 days

**Routing Accuracy**:
- ✅ Overall routing accuracy ≥ 90%
- ✅ Per-vector routing accuracy ≥ 85%

**Expectation Weighting**:
- ✅ Drift-before-confirmation rate ≥ 90% for anticipated events
- ✅ Netting success rate ≥ 95%
- ✅ Mean anticipation lead time: 7-14 days

### 6.2 Qualitative Criteria

**False Negative Understanding**:
- ✅ 100% of false negatives classified by root cause
- ✅ Clear remediation path identified for each root cause
- ✅ Priority remediations ranked by impact

**Geographic Coverage**:
- ✅ No systematic geographic blind spots
- ✅ Recall rates consistent across regions (±10%)

**Event Type Coverage**:
- ✅ Recall rates consistent across event types (±10%)
- ✅ Both anticipated and surprise events detected

**Diagnostic Clarity**:
- ✅ Clear distinction between coverage, routing, and scoring issues
- ✅ Actionable recommendations for each failure mode
- ✅ Examples provided for each false negative category

---

## 7. Implementation Roadmap

### Phase 1: Ground-Truth Curation (Weeks 1-2)

**Week 1: Source Identification & Event Selection**
- Identify official sources for each vector
- Select 10+ events per vector (70+ total)
- Document event metadata
- Define expected CSI behavior

**Week 2: Validation & Quality Review**
- Peer review all selected events
- Verify official source documentation
- Confirm vector classifications
- Finalize ground-truth registry

**Deliverables**:
- Ground-truth event registry (JSON)
- Event documentation (markdown)
- Source mapping (CSV)

### Phase 2: Detection Matching (Week 3)

**Tasks**:
- Implement temporal window search
- Implement keyword matching algorithm
- Implement entity matching (if available)
- Build combined matching score calculator
- Create manual review workflow

**Deliverables**:
- Detection matching engine (TypeScript)
- Matching results database
- Manual review queue

### Phase 3: Routing Validation (Week 4)

**Tasks**:
- Implement routing validation logic
- Build confusion matrix calculator
- Identify misrouting patterns
- Generate routing accuracy metrics

**Deliverables**:
- Routing validation module (TypeScript)
- Confusion matrix visualization
- Misrouting pattern report

### Phase 4: Recall Calculation (Week 5)

**Tasks**:
- Implement overall recall calculator
- Implement per-vector recall calculator
- Implement stratified recall calculators
- Calculate detection latency distribution

**Deliverables**:
- Recall metrics calculator (TypeScript)
- Recall dashboard (React components)
- Latency distribution charts

### Phase 5: False Negative Analysis (Week 6)

**Tasks**:
- Implement false negative classification decision tree
- Build false negative catalog
- Prioritize remediations
- Generate remediation roadmap

**Deliverables**:
- False negative classifier (TypeScript)
- False negative catalog (JSON)
- Remediation priority matrix

### Phase 6: Expectation Weighting Validation (Week 7)

**Tasks**:
- Implement drift-before-confirmation checker
- Analyze anticipation timing
- Validate netting behavior
- Generate expectation weighting report

**Deliverables**:
- Expectation weighting validator (TypeScript)
- Timing analysis charts
- Netting behavior report

### Phase 7: Integration & Testing (Week 8)

**Tasks**:
- Integrate all modules
- Build audit orchestrator
- Create diagnostic report generator
- Conduct end-to-end testing

**Deliverables**:
- Complete audit system
- Diagnostic report template
- User documentation

---

## 8. Integration Points with Existing System

### 8.1 Data Dependencies

**Input Data Sources**:
1. **Detection Feed Logs** (`detection_logs` table)
   - Fields: `detection_id`, `timestamp`, `country`, `title`, `description`, `source`
   - Used for: Detection matching

2. **Routing Classification Logs** (`routing_logs` table)
   - Fields: `detection_id`, `assigned_vector`, `confidence`, `timestamp`
   - Used for: Routing validation

3. **Scoring Pipeline Logs** (`scoring_logs` table)
   - Fields: `detection_id`, `drift_points`, `event_delta_points`, `was_capped`, `was_netted`, `was_decayed`
   - Used for: Scoring validation, false negative classification

4. **Country Daily CSI Records** (`country_daily_csi` table)
   - Fields: `country_id`, `date`, `csi_total`, `baseline_total`, `drift_total`, `event_delta_total`, `by_vector`
   - Used for: Final CSI impact verification

5. **Drift Logs** (`drift_logs` table)
   - Fields: `country`, `vector`, `timestamp`, `drift_points`, `signal_id`
   - Used for: Expectation weighting validation

6. **Event Logs** (`event_logs` table)
   - Fields: `country`, `vector`, `timestamp`, `event_delta_points`, `netted_drift_amount`
   - Used for: Expectation weighting validation

### 8.2 Service Dependencies

**Existing Services**:
1. **GlobalAuditService** (`GlobalAuditService.ts`)
   - Used for: Country metadata, daily CSI records
   - Integration: Import and use existing methods

2. **CSI Calculation Service** (`csiCalculationService.ts`)
   - Used for: Understanding CSI calculation logic
   - Integration: Reference for expected behavior

3. **Event Store** (`eventStore.ts`)
   - Used for: Confirmed event records
   - Integration: Cross-reference with ground-truth events

### 8.3 Output Integration

**Diagnostic Report**:
- Format: JSON + Markdown
- Storage: `/workspace/shadcn-ui/docs/audit-reports/ground-truth-recall-{date}.json`
- Dashboard: React component in `/workspace/shadcn-ui/src/components/audit/`

**Remediation Tracking**:
- Store remediation recommendations in database
- Track remediation progress over time
- Re-run audit after remediations to measure improvement

---

## 9. Appendices

### Appendix A: Example Ground-Truth Event Registry

See Section 4.5 for detailed examples.

### Appendix B: Detection Matching Examples

**Example 1: Exact Match**
```json
{
  "ground_truth_event_id": "GT_SAN_001",
  "detection_id": "DET_20240223_001",
  "match_type": "EXACT_MATCH",
  "match_confidence": 0.95,
  "keyword_matches": ["EU sanctions", "Russia", "12th package"],
  "temporal_offset_days": 0,
  "detection_status": "DETECTED_CORRECT"
}
```

**Example 2: Probable Match**
```json
{
  "ground_truth_event_id": "GT_CYB_001",
  "detection_id": "DET_20230531_045",
  "match_type": "PROBABLE_MATCH",
  "match_confidence": 0.72,
  "keyword_matches": ["MOVEit", "vulnerability"],
  "temporal_offset_days": 1,
  "detection_status": "DETECTED_CORRECT"
}
```

**Example 3: No Match (False Negative)**
```json
{
  "ground_truth_event_id": "GT_CON_005",
  "detection_id": null,
  "match_type": "NO_MATCH",
  "match_confidence": 0.0,
  "keyword_matches": [],
  "temporal_offset_days": null,
  "detection_status": "NOT_DETECTED",
  "false_negative_reason": "COVERAGE_GAP"
}
```

### Appendix C: Routing Confusion Matrix Example

```
Expected →   SAN  TRA  CUR  CYB  UNR  CON  GOV
Actual ↓
SAN          10   1    0    0    0    0    0
TRA          1    9    0    0    0    0    0
CUR          0    0    10   0    0    0    0
CYB          0    0    0    9    0    1    0
UNR          0    0    0    0    10   0    0
CON          0    0    0    0    0    10   1
GOV          0    0    0    0    0    1    9

Routing Accuracy: 67/72 = 93.1%
```

### Appendix D: False Negative Classification Examples

**Example 1: Coverage Gap**
```json
{
  "event_id": "GT_CYB_003",
  "event_name": "Ransomware attack on healthcare provider",
  "reason": "COVERAGE_GAP",
  "details": "Healthcare sector not covered by primary cyber threat feeds",
  "remediation": "Add healthcare-specific threat intelligence sources"
}
```

**Example 2: Routing Failure**
```json
{
  "event_id": "GT_SAN_007",
  "event_name": "Trade-related sanctions on dual-use goods",
  "reason": "ROUTING_FAILURE",
  "details": "Routed to Trade & Logistics instead of Sanctions & Regulatory",
  "remediation": "Retrain classifier with 'dual-use' and 'export control' keywords"
}
```

**Example 3: Scoring Suppression**
```json
{
  "event_id": "GT_UNR_004",
  "event_name": "Small-scale labor strike",
  "reason": "SCORING_SUPPRESSION",
  "details": "Detected and routed correctly but capped at 0.5 points (below 1.0 threshold)",
  "remediation": "Review cap threshold for MINOR severity events"
}
```

### Appendix E: Expectation Weighting Validation Example

```json
{
  "event_id": "GT_SAN_001",
  "event_name": "EU 12th Sanctions Package on Russia",
  "anticipation_window_start": "2024-02-09",
  "event_date": "2024-02-23",
  "drift_detected": true,
  "drift_start_date": "2024-02-10",
  "drift_magnitude": 2.3,
  "drift_within_window": true,
  "confirmation_detected": true,
  "confirmation_date": "2024-02-23",
  "event_delta_magnitude": 6.2,
  "netting_occurred": true,
  "netting_amount": 2.1,
  "validation_passed": true,
  "failure_reason": null
}
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-02-17 | Product Management | Initial specification |

---

**End of Document**