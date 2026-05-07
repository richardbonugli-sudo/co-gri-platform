# CSI Audit Systems Architecture
## Technical Architecture Document

**Document Version:** 1.0  
**Date:** February 24, 2026  
**Status:** Phase 2 - Architecture Design  
**Author:** Bob (Software Architect)  

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the complete technical architecture for two standalone CSI audit systems:

1. **Vector Movement Forensic Audit** - Validates internal structural integrity of the CSI system across all 7 risk vectors
2. **Ground-Truth Recall Audit** - Measures detection success rates against verified real-world geopolitical events

Both systems are designed as independent, on-demand diagnostic tools that provide deep insights into CSI system performance without modifying production data.

### 1.2 Key Architectural Principles

- **Separation of Concerns**: Clear boundaries between data access, business logic, and presentation layers
- **Independence**: No shared state between audit systems; each operates autonomously
- **Read-Only Operations**: Audits only read from production data; no modifications
- **On-Demand Execution**: User-triggered audits with progress tracking
- **Extensibility**: Modular design allows adding new audit sections without refactoring
- **Performance**: Caching strategies and lazy loading for large datasets
- **Testability**: Dependency injection and mockable interfaces

### 1.3 Technology Stack

- **Backend**: TypeScript, Node.js
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Charting**: Recharts
- **Data Export**: CSV (custom), PDF (jsPDF)
- **State Management**: React hooks (useState, useEffect, useContext)
- **API Communication**: Fetch API with async/await
- **Testing**: Vitest, React Testing Library

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                         │
│  ┌────────────────────────┐    ┌────────────────────────────────┐  │
│  │ VectorMovementForensic │    │ GroundTruthRecallAudit         │  │
│  │ AuditDashboard.tsx     │    │ Dashboard.tsx                  │  │
│  └────────────────────────┘    └────────────────────────────────┘  │
│              │                              │                        │
│              └──────────────┬───────────────┘                        │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       Shared Component Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ AuditProgress│  │ AuditDataTable│  │ AuditExport  │             │
│  │ Tracker      │  │              │  │ Menu         │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                │
│  ┌────────────────────────┐    ┌────────────────────────────────┐  │
│  │ VectorMovementForensic │    │ GroundTruthRecallAudit         │  │
│  │ AuditService.ts        │    │ Service.ts                     │  │
│  │                        │    │                                │  │
│  │ - 9 Section Analyzers  │    │ - 6 Section Analyzers          │  │
│  │ - Report Generator     │    │ - Detection Matcher            │  │
│  │ - Export Handler       │    │ - False Negative Classifier    │  │
│  └────────────────────────┘    └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ CSI Data     │  │ Ground Truth │  │ Audit Results│             │
│  │ Repository   │  │ Registry     │  │ Store        │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Storage                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ CSI Database │  │ Detection    │  │ Audit Cache  │             │
│  │ (Existing)   │  │ Logs         │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Layers

#### Layer 1: User Interface Layer
- **Responsibility**: User interaction, visualization, input validation
- **Components**: Dashboard pages, charts, tables, forms
- **Communication**: Calls service layer via async functions

#### Layer 2: Shared Component Layer
- **Responsibility**: Reusable UI components across both audits
- **Components**: Progress trackers, data tables, export menus
- **Benefits**: Code reuse, consistent UX, easier maintenance

#### Layer 3: Service Layer
- **Responsibility**: Business logic, audit execution, data transformation
- **Components**: Audit services, analyzers, report generators
- **Independence**: Each audit service is completely independent

#### Layer 4: Data Access Layer
- **Responsibility**: Data retrieval, caching, abstraction
- **Components**: Repositories, registries, stores
- **Benefits**: Testability, flexibility, performance optimization

#### Layer 5: Data Storage
- **Responsibility**: Persistent data storage
- **Components**: Existing CSI database, detection logs, audit cache
- **Access Pattern**: Read-only for audits (except audit results cache)

---

## 3. Service Layer Design

### 3.1 VectorMovementForensicAuditService

**File Location**: `/workspace/shadcn-ui/src/services/audits/VectorMovementForensicAuditService.ts`

#### 3.1.1 Service Architecture

```typescript
/**
 * Vector Movement Forensic Audit Service
 * 
 * Validates internal structural integrity of CSI system by examining:
 * - Raw movement totals across all 7 vectors
 * - Routing behavior and accuracy
 * - Suppression dynamics
 * - Baseline construction
 * - Expectation weighting
 * - Decay behavior
 */
export class VectorMovementForensicAuditService {
  private dataRepository: CSIDataRepository;
  private reportGenerator: AuditReportGenerator;
  private cacheManager: AuditCacheManager;
  
  constructor(
    dataRepository: CSIDataRepository,
    reportGenerator: AuditReportGenerator,
    cacheManager: AuditCacheManager
  ) {
    this.dataRepository = dataRepository;
    this.reportGenerator = reportGenerator;
    this.cacheManager = cacheManager;
  }
  
  /**
   * Execute complete audit
   * @param timeWindow - Time period for audit (90 days, 12 months, custom)
   * @param progressCallback - Optional callback for progress updates
   * @returns Complete audit results
   */
  async executeAudit(
    timeWindow: TimeWindow,
    progressCallback?: (progress: AuditProgress) => void
  ): Promise<VectorMovementAuditResult>;
  
  /**
   * Execute individual section (for partial re-runs)
   * @param sectionId - Section identifier (1-9)
   * @param timeWindow - Time period for audit
   * @returns Section-specific results
   */
  async executeSection(
    sectionId: number,
    timeWindow: TimeWindow
  ): Promise<SectionResult>;
  
  /**
   * Export audit results
   * @param auditId - Audit identifier
   * @param format - Export format (json, csv, pdf)
   * @returns Exported data or file path
   */
  async exportResults(
    auditId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<ExportResult>;
  
  /**
   * Get cached audit results
   * @param auditId - Audit identifier
   * @returns Cached results or null
   */
  async getCachedResults(
    auditId: string
  ): Promise<VectorMovementAuditResult | null>;
}
```

#### 3.1.2 Section Analyzers

Each of the 9 sections is implemented as a separate analyzer class:

```typescript
// Section 1: Absolute Movement Ledger
class AbsoluteMovementLedgerAnalyzer {
  async analyze(timeWindow: TimeWindow): Promise<Section1Result> {
    // Query raw movement data
    const movements = await this.dataRepository.getMovementData(timeWindow);
    
    // Calculate totals per vector
    const totals = this.calculateVectorTotals(movements);
    
    // Identify anomalies
    const anomalies = this.detectAnomalies(totals);
    
    return {
      section_id: 1,
      section_name: 'Absolute Movement Ledger',
      data: totals,
      anomalies,
      success_criteria_met: this.evaluateSuccessCriteria(totals)
    };
  }
  
  private calculateVectorTotals(movements: Movement[]): VectorTotals {
    // Implementation
  }
  
  private detectAnomalies(totals: VectorTotals): Anomaly[] {
    // Implementation
  }
  
  private evaluateSuccessCriteria(totals: VectorTotals): boolean {
    // Implementation
  }
}

// Similar structure for sections 2-9
class MovementDenominatorReconciliationAnalyzer { /* ... */ }
class RoutingConfirmationSampleAnalyzer { /* ... */ }
class RollingVectorActivityAnalyzer { /* ... */ }
class SuppressionScoringDynamicsAnalyzer { /* ... */ }
class BaselineFactorMatrixAnalyzer { /* ... */ }
class SourceVectorConcentrationAnalyzer { /* ... */ }
class ExpectationWeightingIntegrityAnalyzer { /* ... */ }
class DecayBehaviorAnalyzer { /* ... */ }
```

#### 3.1.3 Data Flow

```
User triggers audit
    ↓
VectorMovementForensicAuditService.executeAudit()
    ↓
For each section (1-9):
    ├─→ Check cache (skip if recent)
    ├─→ Section Analyzer.analyze()
    │   ├─→ CSIDataRepository.getData()
    │   ├─→ Statistical calculations
    │   ├─→ Anomaly detection
    │   └─→ Success criteria evaluation
    ├─→ Store section result
    └─→ Update progress (callback)
    ↓
Aggregate all section results
    ↓
AuditReportGenerator.generate()
    ├─→ Create summary
    ├─→ Identify key findings
    ├─→ Generate recommendations
    └─→ Format output (JSON/CSV/PDF)
    ↓
Cache results
    ↓
Return to dashboard
```

#### 3.1.4 Key Interfaces

```typescript
interface VectorMovementAuditResult {
  audit_id: string;
  generated_at: Date;
  time_window: TimeWindow;
  sections: {
    section_1: Section1Result;
    section_2: Section2Result;
    section_3: Section3Result;
    section_4: Section4Result;
    section_5: Section5Result;
    section_6: Section6Result;
    section_7: Section7Result;
    section_8: Section8Result;
    section_9: Section9Result;
  };
  summary: AuditSummary;
  recommendations: Recommendation[];
}

interface TimeWindow {
  type: 'last_90_days' | 'last_12_months' | 'custom';
  start_date?: Date;
  end_date?: Date;
}

interface AuditProgress {
  current_section: number;
  total_sections: number;
  section_name: string;
  percentage_complete: number;
  estimated_time_remaining_seconds: number;
}

interface AuditSummary {
  sections_meeting_criteria: number;
  total_sections: number;
  overall_assessment: 'structural_integrity_confirmed' | 'partial_functionality' | 'fundamental_issues';
  key_findings: string[];
  critical_issues: string[];
}

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  affected_vectors: CSIRiskVector[];
  remediation_steps: string[];
}
```

---

### 3.2 GroundTruthRecallAuditService

**File Location**: `/workspace/shadcn-ui/src/services/audits/GroundTruthRecallAuditService.ts`

#### 3.2.1 Service Architecture

```typescript
/**
 * Ground-Truth Recall Audit Service
 * 
 * Validates CSI system's ability to detect real-world geopolitical events by:
 * - Matching ground-truth events to system detections
 * - Calculating recall rates per vector
 * - Classifying false negatives by root cause
 * - Validating expectation weighting behavior
 */
export class GroundTruthRecallAuditService {
  private groundTruthRegistry: GroundTruthRegistry;
  private detectionMatcher: DetectionMatchingEngine;
  private falseNegativeClassifier: FalseNegativeClassifier;
  private reportGenerator: AuditReportGenerator;
  private cacheManager: AuditCacheManager;
  
  constructor(
    groundTruthRegistry: GroundTruthRegistry,
    detectionMatcher: DetectionMatchingEngine,
    falseNegativeClassifier: FalseNegativeClassifier,
    reportGenerator: AuditReportGenerator,
    cacheManager: AuditCacheManager
  ) {
    this.groundTruthRegistry = groundTruthRegistry;
    this.detectionMatcher = detectionMatcher;
    this.falseNegativeClassifier = falseNegativeClassifier;
    this.reportGenerator = reportGenerator;
    this.cacheManager = cacheManager;
  }
  
  /**
   * Execute complete recall audit
   * @param timeWindow - Time period for audit (12 months, 24 months)
   * @param progressCallback - Optional callback for progress updates
   * @returns Complete audit results
   */
  async executeAudit(
    timeWindow: TimeWindow,
    progressCallback?: (progress: AuditProgress) => void
  ): Promise<GroundTruthRecallAuditResult>;
  
  /**
   * Load ground-truth event registry
   * @param registryVersion - Version of registry to load
   * @returns Ground-truth events
   */
  async loadGroundTruthEvents(
    registryVersion?: string
  ): Promise<GroundTruthEvent[]>;
  
  /**
   * Match single ground-truth event to detections
   * @param event - Ground-truth event
   * @returns Detection match result
   */
  async matchEvent(
    event: GroundTruthEvent
  ): Promise<DetectionMatch>;
  
  /**
   * Export audit results
   * @param auditId - Audit identifier
   * @param format - Export format (json, csv, pdf)
   * @returns Exported data or file path
   */
  async exportResults(
    auditId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<ExportResult>;
  
  /**
   * Get cached audit results
   * @param auditId - Audit identifier
   * @returns Cached results or null
   */
  async getCachedResults(
    auditId: string
  ): Promise<GroundTruthRecallAuditResult | null>;
}
```

#### 3.2.2 Core Components

```typescript
// Ground-Truth Registry
class GroundTruthRegistry {
  /**
   * Load ground-truth events from registry
   * @param timeWindow - Filter events by time period
   * @returns Array of ground-truth events
   */
  async loadEvents(timeWindow: TimeWindow): Promise<GroundTruthEvent[]>;
  
  /**
   * Get events by vector
   * @param vector - CSI risk vector
   * @returns Events for specified vector
   */
  async getEventsByVector(vector: CSIRiskVector): Promise<GroundTruthEvent[]>;
  
  /**
   * Get events by severity
   * @param severity - Event severity level
   * @returns Events of specified severity
   */
  async getEventsBySeverity(severity: 'MAJOR' | 'MODERATE' | 'MINOR'): Promise<GroundTruthEvent[]>;
}

// Detection Matching Engine
class DetectionMatchingEngine {
  /**
   * Match ground-truth event to system detections
   * @param event - Ground-truth event
   * @param detectionLogs - System detection logs
   * @returns Match result with confidence score
   */
  async matchEvent(
    event: GroundTruthEvent,
    detectionLogs: DetectionLog[]
  ): Promise<DetectionMatch>;
  
  /**
   * Calculate keyword match score
   * @param detection - Detection log entry
   * @param keywords - Expected keywords
   * @returns Match score (0.0-1.0)
   */
  private scoreKeywordMatch(
    detection: DetectionLog,
    keywords: string[]
  ): number;
  
  /**
   * Calculate temporal proximity score
   * @param detection - Detection log entry
   * @param eventDate - Ground-truth event date
   * @returns Proximity score (0.0-1.0)
   */
  private calculateTemporalProximity(
    detection: DetectionLog,
    eventDate: Date
  ): number;
}

// False Negative Classifier
class FalseNegativeClassifier {
  /**
   * Classify false negative by root cause
   * @param event - Ground-truth event
   * @param match - Detection match result
   * @returns Classification with remediation
   */
  async classify(
    event: GroundTruthEvent,
    match: DetectionMatch
  ): Promise<FalseNegativeClassification>;
  
  /**
   * Build false negative catalog
   * @param classifications - All false negative classifications
   * @returns Catalog with prioritized remediations
   */
  buildCatalog(
    classifications: FalseNegativeClassification[]
  ): FalseNegativeCatalog;
}
```

#### 3.2.3 Data Flow

```
User triggers audit
    ↓
GroundTruthRecallAuditService.executeAudit()
    ↓
GroundTruthRegistry.loadEvents()
    ↓
For each ground-truth event:
    ├─→ DetectionMatchingEngine.matchEvent()
    │   ├─→ Temporal window search
    │   ├─→ Keyword matching
    │   ├─→ Entity matching (if available)
    │   └─→ Combined confidence score
    ├─→ Validate routing (if detected)
    ├─→ Check CSI impact (drift/event delta)
    ├─→ Classify detection status
    └─→ Update progress (callback)
    ↓
Calculate recall metrics
    ├─→ Overall recall rate
    ├─→ Per-vector recall rates
    ├─→ Stratified recall (severity, region)
    └─→ Detection latency distribution
    ↓
For each false negative:
    ├─→ FalseNegativeClassifier.classify()
    │   ├─→ Coverage gap check
    │   ├─→ Routing failure check
    │   ├─→ Scoring suppression check
    │   └─→ Assign root cause
    └─→ Store classification
    ↓
FalseNegativeClassifier.buildCatalog()
    ├─→ Group by reason
    ├─→ Prioritize remediations
    └─→ Generate recommendations
    ↓
Validate expectation weighting
    ├─→ Drift-before-confirmation check
    ├─→ Anticipation timing analysis
    └─→ Netting behavior validation
    ↓
AuditReportGenerator.generate()
    ├─→ Recall metrics summary
    ├─→ False negative catalog
    ├─→ Routing confusion matrix
    └─→ Remediation roadmap
    ↓
Cache results
    ↓
Return to dashboard
```

#### 3.2.4 Key Interfaces

```typescript
interface GroundTruthRecallAuditResult {
  audit_id: string;
  generated_at: Date;
  time_window: TimeWindow;
  ground_truth_registry_version: string;
  recall_metrics: RecallMetrics;
  routing_validation: RoutingValidation;
  false_negative_catalog: FalseNegativeCatalog;
  expectation_weighting_validation: ExpectationWeightingValidation;
  summary: AuditSummary;
  recommendations: Recommendation[];
}

interface RecallMetrics {
  total_ground_truth_events: number;
  total_detected: number;
  total_missed: number;
  overall_recall_rate: number;
  by_vector: Record<CSIRiskVector, VectorRecallMetrics>;
  by_severity: Record<'MAJOR' | 'MODERATE' | 'MINOR', StratifiedRecallMetrics>;
  by_region: Record<string, StratifiedRecallMetrics>;
  detection_latency: LatencyDistribution;
  routing_accuracy: number;
}

interface FalseNegativeCatalog {
  total_false_negatives: number;
  by_reason: Record<FalseNegativeReason, number>;
  by_vector: Record<CSIRiskVector, FalseNegativeDetail[]>;
  priority_remediations: PrioritizedRemediation[];
}

interface ExpectationWeightingValidation {
  total_anticipated_events: number;
  events_with_drift: number;
  drift_before_confirmation_rate: number;
  mean_anticipation_lead_time: number;
  netting_success_rate: number;
  validations: ExpectationWeightingDetail[];
}
```

---

## 4. Dashboard Layer Design

### 4.1 VectorMovementForensicAuditDashboard

**File Location**: `/workspace/shadcn-ui/src/pages/VectorMovementForensicAuditDashboard.tsx`

#### 4.1.1 Component Structure

```typescript
/**
 * Vector Movement Forensic Audit Dashboard
 * 
 * Main dashboard for executing and viewing Vector Movement Forensic Audit results
 */
export default function VectorMovementForensicAuditDashboard() {
  // State management
  const [auditResults, setAuditResults] = useState<VectorMovementAuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [activeSection, setActiveSection] = useState(1);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ type: 'last_90_days' });
  
  // Service instance
  const auditService = useMemo(() => new VectorMovementForensicAuditService(...), []);
  
  // Handlers
  const handleRunAudit = async () => { /* ... */ };
  const handleExport = async (format: 'csv' | 'pdf') => { /* ... */ };
  const handleSectionChange = (sectionId: number) => { /* ... */ };
  
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <AuditHeader
        title="CSI Vector Movement & Expectation-Weighted Forensic Audit"
        subtitle="Validate internal structural integrity across all 7 risk vectors"
      />
      
      {/* Controls */}
      <AuditControls
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        onRunAudit={handleRunAudit}
        onExport={handleExport}
        isRunning={isRunning}
      />
      
      {/* Progress Indicator */}
      {isRunning && progress && (
        <AuditProgressTracker progress={progress} />
      )}
      
      {/* Section Navigation */}
      {auditResults && (
        <SectionNavigation
          sections={SECTION_NAMES}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          sectionStatus={getSectionStatus(auditResults)}
        />
      )}
      
      {/* Active Section Content */}
      {auditResults && (
        <SectionContent
          sectionId={activeSection}
          data={auditResults.sections[`section_${activeSection}`]}
          onExportSection={handleExportSection}
        />
      )}
      
      {/* Summary Panel */}
      {auditResults && (
        <SummaryPanel
          summary={auditResults.summary}
          recommendations={auditResults.recommendations}
        />
      )}
    </div>
  );
}
```

#### 4.1.2 Section Components

Each section has a dedicated component for rendering:

```typescript
// Section 1: Absolute Movement Ledger
function Section1AbsoluteMovementLedger({ data }: { data: Section1Result }) {
  return (
    <AuditSectionCard title="Absolute Movement Ledger" sectionId={1}>
      <MovementLedgerTable data={data.data} />
      <AnomalyList anomalies={data.anomalies} />
      <SuccessCriteriaBadge met={data.success_criteria_met} />
    </AuditSectionCard>
  );
}

// Section 4: Rolling Vector Activity
function Section4RollingVectorActivity({ data }: { data: Section4Result }) {
  return (
    <AuditSectionCard title="Rolling Vector Activity" sectionId={4}>
      <VectorActivityChart data={data.time_series} />
      <BenchmarkEventMarkers events={data.benchmark_events} />
      <FlatlineDetection issues={data.flatline_issues} />
    </AuditSectionCard>
  );
}

// Similar components for sections 2, 3, 5, 6, 7, 8, 9
```

#### 4.1.3 UI/UX Specifications

**Layout Grid**:
```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ [Title] [Subtitle]                                       │
├─────────────────────────────────────────────────────────┤
│ Controls                                                 │
│ [Time Window Selector] [Run Audit] [Export CSV] [PDF]   │
├─────────────────────────────────────────────────────────┤
│ Progress (if running)                                    │
│ [████████░░░░░░░░░░] 45% - Section 4 of 9               │
├─────────────────────────────────────────────────────────┤
│ Section Navigation (tabs)                                │
│ [1] [2] [3] [4✓] [5] [6] [7] [8] [9]                    │
├─────────────────────────────────────────────────────────┤
│ Active Section Content                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ [Section Title]                    [Export]       │   │
│ │                                                    │   │
│ │ [Data Tables / Charts]                            │   │
│ │                                                    │   │
│ │ [Anomalies / Findings]                            │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Summary Panel                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Overall Assessment: [Badge]                       │   │
│ │ Sections Meeting Criteria: 7/9                    │   │
│ │ Key Findings: [List]                              │   │
│ │ Recommendations: [Prioritized List]               │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Color Scheme**:
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)
- Info: Blue (#3b82f6)
- Neutral: Gray (#6b7280)

**Responsive Breakpoints**:
- Desktop: ≥1280px (full layout)
- Tablet: 768px-1279px (stacked sections)
- Mobile: <768px (single column, collapsible sections)

---

### 4.2 GroundTruthRecallAuditDashboard

**File Location**: `/workspace/shadcn-ui/src/pages/GroundTruthRecallAuditDashboard.tsx`

#### 4.2.1 Component Structure

```typescript
/**
 * Ground-Truth Recall Audit Dashboard
 * 
 * Main dashboard for executing and viewing Ground-Truth Recall Audit results
 */
export default function GroundTruthRecallAuditDashboard() {
  // State management
  const [auditResults, setAuditResults] = useState<GroundTruthRecallAuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [activeSection, setActiveSection] = useState(1);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ type: 'last_12_months' });
  
  // Service instance
  const auditService = useMemo(() => new GroundTruthRecallAuditService(...), []);
  
  // Handlers
  const handleRunAudit = async () => { /* ... */ };
  const handleExport = async (format: 'csv' | 'pdf') => { /* ... */ };
  const handleSectionChange = (sectionId: number) => { /* ... */ };
  
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <AuditHeader
        title="CSI Ground-Truth Recall Audit"
        subtitle="12-Month Validation Against Verified Geopolitical Events"
      />
      
      {/* Controls */}
      <AuditControls
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        onRunAudit={handleRunAudit}
        onExport={handleExport}
        isRunning={isRunning}
      />
      
      {/* Progress Indicator */}
      {isRunning && progress && (
        <AuditProgressTracker progress={progress} />
      )}
      
      {/* Key Metrics Cards */}
      {auditResults && (
        <RecallMetricsCards metrics={auditResults.recall_metrics} />
      )}
      
      {/* Section Navigation */}
      {auditResults && (
        <SectionNavigation
          sections={RECALL_SECTION_NAMES}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}
      
      {/* Active Section Content */}
      {auditResults && (
        <RecallSectionContent
          sectionId={activeSection}
          auditResults={auditResults}
        />
      )}
      
      {/* Summary Panel */}
      {auditResults && (
        <RecallSummaryPanel
          summary={auditResults.summary}
          recommendations={auditResults.recommendations}
        />
      )}
    </div>
  );
}
```

#### 4.2.2 Section Components

```typescript
// Section 1: Ground-Truth Event Registry
function Section1GroundTruthEventSet({ events }: { events: GroundTruthEvent[] }) {
  return (
    <AuditSectionCard title="Ground-Truth Event Set" sectionId={1}>
      <GroundTruthEventList
        events={events}
        filters={['vector', 'severity', 'region']}
      />
      <EventDistributionCharts events={events} />
    </AuditSectionCard>
  );
}

// Section 2: Detection & Routing Recall
function Section2DetectionRoutingRecall({ matches }: { matches: DetectionMatch[] }) {
  return (
    <AuditSectionCard title="Detection & Routing Recall" sectionId={2}>
      <DetectionStatusOverview matches={matches} />
      <RoutingAccuracyMatrix matches={matches} />
      <MisroutingPatternTable patterns={identifyMisroutingPatterns(matches)} />
    </AuditSectionCard>
  );
}

// Section 3: Vector Recall Rate Summary
function Section3VectorRecallRates({ metrics }: { metrics: RecallMetrics }) {
  return (
    <AuditSectionCard title="Vector Recall Rate Summary" sectionId={3}>
      <RecallRateChart data={metrics.by_vector} />
      <VectorComparisonTable data={metrics.by_vector} />
      <LatencyDistributionChart data={metrics.detection_latency} />
    </AuditSectionCard>
  );
}

// Section 4: False Negative Analysis
function Section4FalseNegativeAnalysis({ catalog }: { catalog: FalseNegativeCatalog }) {
  return (
    <AuditSectionCard title="False Negative Analysis" sectionId={4}>
      <FalseNegativeBreakdown catalog={catalog} />
      <RootCausePieChart data={catalog.by_reason} />
      <RemediationPriorityMatrix remediations={catalog.priority_remediations} />
    </AuditSectionCard>
  );
}

// Sections 5 & 6 follow similar pattern
```

#### 4.2.3 UI/UX Specifications

**Layout Grid**:
```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ [Title] [Subtitle]                                       │
├─────────────────────────────────────────────────────────┤
│ Controls                                                 │
│ [Time Window] [Run Audit] [Export CSV] [Export PDF]     │
├─────────────────────────────────────────────────────────┤
│ Key Metrics Cards                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │Overall   │ │Detected  │ │Missed    │ │Routing   │   │
│ │Recall    │ │Events    │ │Events    │ │Accuracy  │   │
│ │  87.5%   │ │   63     │ │    9     │ │  90.5%   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ Section Navigation (tabs)                                │
│ [1✓] [2✓] [3✓] [4✓] [5✓] [6]                           │
├─────────────────────────────────────────────────────────┤
│ Active Section Content                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ [Section Title]                    [Export]       │   │
│ │                                                    │   │
│ │ [Event Lists / Charts / Matrices]                 │   │
│ │                                                    │   │
│ │ [Drill-down Details]                              │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Summary Panel                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Overall Recall: [Badge]                           │   │
│ │ Per-Vector Performance: [Chart]                   │   │
│ │ Critical Gaps: [List]                             │   │
│ │ Prioritized Remediations: [Action Items]          │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Component Library

### 5.1 Shared Audit Components

**File Location**: `/workspace/shadcn-ui/src/components/audit/`

#### 5.1.1 AuditProgressTracker

```typescript
/**
 * Progress tracker for long-running audits
 * 
 * Features:
 * - Progress bar with percentage
 * - Current section name
 * - Estimated time remaining
 * - Cancelable (optional)
 */
interface AuditProgressTrackerProps {
  progress: AuditProgress;
  onCancel?: () => void;
}

export function AuditProgressTracker({ progress, onCancel }: AuditProgressTrackerProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{progress.section_name}</span>
            <span className="text-muted-foreground">
              {progress.current_section} of {progress.total_sections}
            </span>
          </div>
          <Progress value={progress.percentage_complete} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.percentage_complete.toFixed(1)}% complete</span>
            <span>~{progress.estimated_time_remaining_seconds}s remaining</span>
          </div>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} className="w-full mt-2">
              Cancel Audit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 5.1.2 AuditDataTable

```typescript
/**
 * Enhanced data table with sorting, filtering, and export
 * 
 * Features:
 * - Column sorting (asc/desc)
 * - Column filtering
 * - Pagination
 * - Row selection
 * - Export to CSV
 */
interface AuditDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  exportable?: boolean;
  exportFilename?: string;
}

export function AuditDataTable<T>({
  data,
  columns,
  pageSize = 10,
  exportable = true,
  exportFilename = 'audit-data'
}: AuditDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  const handleExport = () => {
    const csv = generateCSV(table.getFilteredRowModel().rows);
    downloadCSV(csv, exportFilename);
  };
  
  return (
    <div className="space-y-4">
      {exportable && (
        <div className="flex justify-end">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {/* Column header with sorting */}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

#### 5.1.3 AuditSectionCard

```typescript
/**
 * Consistent container for audit sections
 * 
 * Features:
 * - Collapsible content
 * - Section status badge
 * - Export button
 */
interface AuditSectionCardProps {
  title: string;
  sectionId: number;
  status?: 'success' | 'warning' | 'error';
  children: React.ReactNode;
  onExport?: () => void;
}

export function AuditSectionCard({
  title,
  sectionId,
  status,
  children,
  onExport
}: AuditSectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">Section {sectionId}</Badge>
            <CardTitle>{title}</CardTitle>
            {status && <StatusBadge status={status} />}
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button onClick={onExport} variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
            >
              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
```

#### 5.1.4 Other Shared Components

```typescript
// AuditExportMenu - Dropdown menu for export options
export function AuditExportMenu({ onExport }: { onExport: (format: string) => void }) { /* ... */ }

// AuditTimeRangeSelector - Date range picker
export function AuditTimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) { /* ... */ }

// AuditMetricCard - KPI display card
export function AuditMetricCard({ title, value, change, icon }: MetricCardProps) { /* ... */ }

// AuditChartContainer - Wrapper for Recharts
export function AuditChartContainer({ title, children }: ChartContainerProps) { /* ... */ }
```

### 5.2 Vector Movement Specific Components

**File Location**: `/workspace/shadcn-ui/src/components/audit/vector-movement/`

```typescript
// MovementLedgerTable - Section 1 data display
export function MovementLedgerTable({ data }: { data: VectorTotals }) { /* ... */ }

// VectorActivityChart - Section 4 time series
export function VectorActivityChart({ data }: { data: TimeSeriesData }) { /* ... */ }

// SuppressionDynamicsChart - Section 5 visualizations
export function SuppressionDynamicsChart({ data }: { data: SuppressionData }) { /* ... */ }

// BaselineFactorMatrix - Section 6 matrix display
export function BaselineFactorMatrix({ data }: { data: BaselineData }) { /* ... */ }

// ExpectationWeightingScatter - Section 8 scatter plots
export function ExpectationWeightingScatter({ data }: { data: WeightingData }) { /* ... */ }
```

### 5.3 Ground Truth Specific Components

**File Location**: `/workspace/shadcn-ui/src/components/audit/ground-truth/`

```typescript
// GroundTruthEventList - Event catalog with filters
export function GroundTruthEventList({ events, filters }: EventListProps) { /* ... */ }

// RecallRateChart - Vector-wise recall visualization
export function RecallRateChart({ data }: { data: VectorRecallMetrics[] }) { /* ... */ }

// DetectionStatusBadge - Status indicators
export function DetectionStatusBadge({ status }: { status: DetectionStatus }) { /* ... */ }

// FalseNegativeBreakdown - Root cause pie charts
export function FalseNegativeBreakdown({ catalog }: { catalog: FalseNegativeCatalog }) { /* ... */ }

// RoutingAccuracyMatrix - Confusion matrix display
export function RoutingAccuracyMatrix({ matrix }: { matrix: ConfusionMatrix }) { /* ... */ }
```

---

## 6. Data Flow Architecture

### 6.1 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                                                                  │
│  User clicks "Run Audit" button                                 │
│  ↓                                                               │
│  Dashboard validates inputs (time window, etc.)                 │
│  ↓                                                               │
│  Dashboard calls AuditService.executeAudit()                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Service Layer                            │
│                                                                  │
│  AuditService receives request                                  │
│  ↓                                                               │
│  Check cache for recent results                                 │
│  ├─→ If found: return cached results                            │
│  └─→ If not found: proceed with audit                           │
│  ↓                                                               │
│  Initialize audit execution                                     │
│  ├─→ Generate audit_id                                          │
│  ├─→ Set up progress tracking                                   │
│  └─→ Create result container                                    │
│  ↓                                                               │
│  For each section/analysis:                                     │
│  ├─→ Update progress (callback to UI)                           │
│  ├─→ Call DataRepository to fetch data                          │
│  ├─→ Execute section-specific analysis                          │
│  ├─→ Detect anomalies/issues                                    │
│  ├─→ Evaluate success criteria                                  │
│  └─→ Store section result                                       │
│  ↓                                                               │
│  Aggregate all section results                                  │
│  ↓                                                               │
│  Generate summary and recommendations                           │
│  ↓                                                               │
│  Cache results for future retrieval                             │
│  ↓                                                               │
│  Return complete audit result                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                           │
│                                                                  │
│  DataRepository receives data request                           │
│  ↓                                                               │
│  Determine data source (CSI DB, logs, etc.)                     │
│  ↓                                                               │
│  Execute query with time window filter                          │
│  ↓                                                               │
│  Transform raw data to service-layer format                     │
│  ↓                                                               │
│  Return data to service                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Data Storage                             │
│                                                                  │
│  Query execution on database                                    │
│  ├─→ CSI Database (existing)                                    │
│  ├─→ Detection Logs                                             │
│  ├─→ Routing Logs                                               │
│  ├─→ Scoring Logs                                               │
│  └─→ Ground Truth Registry (for recall audit)                   │
│  ↓                                                               │
│  Return query results                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Flow returns to Service Layer)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                                                                  │
│  Dashboard receives audit results                               │
│  ↓                                                               │
│  Update UI state                                                │
│  ↓                                                               │
│  Render results:                                                │
│  ├─→ Summary metrics                                            │
│  ├─→ Section navigation                                         │
│  ├─→ Active section content                                     │
│  └─→ Recommendations                                            │
│  ↓                                                               │
│  User can:                                                      │
│  ├─→ Navigate between sections                                  │
│  ├─→ Export results (CSV/PDF)                                   │
│  └─→ Drill down into details                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Export Flow

```
User clicks "Export CSV" or "Export PDF"
    ↓
Dashboard calls AuditService.exportResults(auditId, format)
    ↓
Service retrieves cached audit results
    ↓
ReportGenerator.generate(results, format)
    ├─→ If CSV:
    │   ├─→ Flatten nested data structures
    │   ├─→ Generate CSV string
    │   └─→ Return CSV data
    │
    └─→ If PDF:
        ├─→ Create PDF document (jsPDF)
        ├─→ Add title page
        ├─→ Add summary section
        ├─→ For each section:
        │   ├─→ Add section header
        │   ├─→ Add tables/charts
        │   └─→ Add findings
        ├─→ Add recommendations
        └─→ Return PDF blob
    ↓
Dashboard triggers file download
    ├─→ Create download link
    ├─→ Set filename
    └─→ Trigger browser download
```

---

## 7. Integration Strategy

### 7.1 Integration with CSI Core

**Read-Only Access Pattern**:
```typescript
// Data Repository abstracts CSI database access
class CSIDataRepository {
  /**
   * Get movement data for time window
   * @param timeWindow - Time period
   * @returns Movement data
   */
  async getMovementData(timeWindow: TimeWindow): Promise<MovementData[]> {
    // Query existing CSI database tables
    // NO modifications to production data
    const query = `
      SELECT 
        vector,
        SUM(drift_points) as total_drift,
        SUM(event_delta) as total_event_delta,
        COUNT(*) as total_items
      FROM signals
      WHERE detection_date >= ? AND detection_date <= ?
      GROUP BY vector
    `;
    
    return await this.db.query(query, [timeWindow.start_date, timeWindow.end_date]);
  }
  
  /**
   * Get baseline factors for countries
   * @param countryIds - Array of country IDs
   * @returns Baseline factors
   */
  async getBaselineFactors(countryIds: string[]): Promise<BaselineFactor[]> {
    // Query existing baseline_factors table
    const query = `
      SELECT *
      FROM baseline_factors
      WHERE country_id IN (?)
    `;
    
    return await this.db.query(query, [countryIds]);
  }
}
```

**Service References**:
```typescript
// Reference existing services for metadata and utilities
import { GlobalAuditService } from '../csi/GlobalAuditService';

class VectorMovementForensicAuditService {
  private globalAuditService: GlobalAuditService;
  
  constructor(/* ... */) {
    // Use existing service for country metadata
    this.globalAuditService = new GlobalAuditService();
  }
  
  async getCountryMetadata(countryId: string) {
    // Leverage existing service
    return await this.globalAuditService.getCountryInfo(countryId);
  }
}
```

### 7.2 Integration with Home Page

**Navigation Update**:

File: `/workspace/shadcn-ui/src/pages/Index.tsx`

```typescript
// Add to Developer Tools section
<div className="space-y-2">
  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
    Developer Tools
  </h3>
  <ul className="space-y-1">
    {/* Existing links */}
    <li>
      <Link href="/csi-verification">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
          CSI Verification Dashboard
        </span>
      </Link>
    </li>
    <li>
      <Link href="/global-audit">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
          Global Audit Dashboard
        </span>
      </Link>
    </li>
    <li>
      <Link href="/phase2-addendum">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
          Phase 2 Addendum Dashboard
        </span>
      </Link>
    </li>
    <li>
      <Link href="/phase2-1-addendum">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
          Phase 2.1 Addendum Dashboard
        </span>
      </Link>
    </li>
    
    {/* NEW AUDIT LINKS */}
    <li>
      <Link href="/vector-movement-audit">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
          <BarChart3 className="h-3 w-3" />
          Vector Movement Forensic Audit
        </span>
      </Link>
    </li>
    <li>
      <Link href="/ground-truth-recall-audit">
        <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
          <Target className="h-3 w-3" />
          Ground-Truth Recall Audit
        </span>
      </Link>
    </li>
  </ul>
</div>
```

**Routing Configuration**:

File: `/workspace/shadcn-ui/src/App.tsx` (or routing config)

```typescript
import VectorMovementForensicAuditDashboard from './pages/VectorMovementForensicAuditDashboard';
import GroundTruthRecallAuditDashboard from './pages/GroundTruthRecallAuditDashboard';

// Add routes
<Routes>
  {/* Existing routes */}
  <Route path="/" element={<Index />} />
  <Route path="/csi-verification" element={<CSIVerificationDashboard />} />
  {/* ... */}
  
  {/* NEW AUDIT ROUTES */}
  <Route 
    path="/vector-movement-audit" 
    element={<VectorMovementForensicAuditDashboard />} 
  />
  <Route 
    path="/ground-truth-recall-audit" 
    element={<GroundTruthRecallAuditDashboard />} 
  />
</Routes>
```

### 7.3 Independence from Other Audits

**No Shared State**:
```typescript
// Each audit service is completely independent
// NO shared state between audits

// Vector Movement Audit
const vectorAuditService = new VectorMovementForensicAuditService(
  new CSIDataRepository(),
  new AuditReportGenerator(),
  new AuditCacheManager('vector-movement')
);

// Ground Truth Recall Audit
const recallAuditService = new GroundTruthRecallAuditService(
  new GroundTruthRegistry(),
  new DetectionMatchingEngine(),
  new FalseNegativeClassifier(),
  new AuditReportGenerator(),
  new AuditCacheManager('ground-truth-recall')
);

// Separate cache namespaces prevent conflicts
```

**Separate Data Stores**:
```
/workspace/shadcn-ui/data/audit-cache/
├── vector-movement/
│   ├── audit-2026-02-24-001.json
│   ├── audit-2026-02-24-002.json
│   └── ...
└── ground-truth-recall/
    ├── audit-2026-02-24-001.json
    ├── audit-2026-02-24-002.json
    └── ...
```

---

## 8. Technology Stack

### 8.1 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x | Type-safe service layer |
| Node.js | 20.x | Runtime environment |
| SQL | - | Database queries |

### 8.2 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type-safe components |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| Recharts | 2.x | Data visualization |
| React Router | 6.x | Navigation |
| TanStack Table | 8.x | Data tables |

### 8.3 Data & Export

| Technology | Version | Purpose |
|------------|---------|---------|
| jsPDF | 2.x | PDF generation |
| CSV (custom) | - | CSV export |
| JSON | - | Data interchange |

### 8.4 Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | Latest | Unit testing |
| React Testing Library | Latest | Component testing |
| MSW | Latest | API mocking |

---

## 9. Performance Considerations

### 9.1 Caching Strategy

**Multi-Level Caching**:
```typescript
class AuditCacheManager {
  private memoryCache: Map<string, any> = new Map();
  private diskCachePath: string;
  
  /**
   * Get cached audit results
   * @param auditId - Audit identifier
   * @returns Cached results or null
   */
  async get(auditId: string): Promise<any | null> {
    // Level 1: Memory cache (fastest)
    if (this.memoryCache.has(auditId)) {
      return this.memoryCache.get(auditId);
    }
    
    // Level 2: Disk cache
    const diskPath = path.join(this.diskCachePath, `${auditId}.json`);
    if (await fs.pathExists(diskPath)) {
      const data = await fs.readJSON(diskPath);
      this.memoryCache.set(auditId, data); // Promote to memory
      return data;
    }
    
    return null;
  }
  
  /**
   * Store audit results in cache
   * @param auditId - Audit identifier
   * @param data - Audit results
   * @param ttl - Time to live (seconds)
   */
  async set(auditId: string, data: any, ttl: number = 3600): Promise<void> {
    // Store in memory
    this.memoryCache.set(auditId, data);
    
    // Store on disk
    const diskPath = path.join(this.diskCachePath, `${auditId}.json`);
    await fs.writeJSON(diskPath, data);
    
    // Set expiration
    setTimeout(() => this.invalidate(auditId), ttl * 1000);
  }
  
  /**
   * Invalidate cached audit
   * @param auditId - Audit identifier
   */
  async invalidate(auditId: string): Promise<void> {
    this.memoryCache.delete(auditId);
    const diskPath = path.join(this.diskCachePath, `${auditId}.json`);
    await fs.remove(diskPath);
  }
}
```

**Cache Invalidation Rules**:
- Audit results cached for 1 hour
- Invalidate on new audit execution with same parameters
- Manual invalidation option in UI

### 9.2 Lazy Loading

**Component-Level Code Splitting**:
```typescript
// Lazy load section components
const Section1Component = lazy(() => import('./sections/Section1'));
const Section2Component = lazy(() => import('./sections/Section2'));
// ... etc

function SectionContent({ sectionId, data }: SectionContentProps) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      {sectionId === 1 && <Section1Component data={data} />}
      {sectionId === 2 && <Section2Component data={data} />}
      {/* ... */}
    </Suspense>
  );
}
```

**Data Pagination**:
```typescript
// Load large datasets in chunks
class CSIDataRepository {
  async getMovementDataPaginated(
    timeWindow: TimeWindow,
    page: number,
    pageSize: number = 1000
  ): Promise<{ data: MovementData[], total: number }> {
    const offset = page * pageSize;
    
    const query = `
      SELECT *
      FROM signals
      WHERE detection_date >= ? AND detection_date <= ?
      LIMIT ? OFFSET ?
    `;
    
    const data = await this.db.query(query, [
      timeWindow.start_date,
      timeWindow.end_date,
      pageSize,
      offset
    ]);
    
    const total = await this.db.count('signals', timeWindow);
    
    return { data, total };
  }
}
```

### 9.3 Progress Tracking

**Granular Progress Updates**:
```typescript
class VectorMovementForensicAuditService {
  async executeAudit(
    timeWindow: TimeWindow,
    progressCallback?: (progress: AuditProgress) => void
  ): Promise<VectorMovementAuditResult> {
    const totalSections = 9;
    
    for (let i = 1; i <= totalSections; i++) {
      // Update progress before section execution
      progressCallback?.({
        current_section: i,
        total_sections: totalSections,
        section_name: SECTION_NAMES[i - 1],
        percentage_complete: ((i - 1) / totalSections) * 100,
        estimated_time_remaining_seconds: this.estimateTimeRemaining(i, totalSections)
      });
      
      // Execute section
      const sectionResult = await this.executeSection(i, timeWindow);
      
      // Store result
      results[`section_${i}`] = sectionResult;
    }
    
    // Final progress update
    progressCallback?.({
      current_section: totalSections,
      total_sections: totalSections,
      section_name: 'Complete',
      percentage_complete: 100,
      estimated_time_remaining_seconds: 0
    });
    
    return results;
  }
}
```

### 9.4 Database Query Optimization

**Indexed Queries**:
```sql
-- Ensure indexes exist on frequently queried columns
CREATE INDEX idx_signals_detection_date ON signals(detection_date);
CREATE INDEX idx_signals_vector ON signals(predicted_vector);
CREATE INDEX idx_signals_country ON signals(country_id);
CREATE INDEX idx_signals_status ON signals(status);

-- Composite index for common query patterns
CREATE INDEX idx_signals_date_vector ON signals(detection_date, predicted_vector);
```

**Query Result Limits**:
```typescript
// Always apply reasonable limits to queries
const MAX_QUERY_RESULTS = 10000;

async getMovementData(timeWindow: TimeWindow): Promise<MovementData[]> {
  const query = `
    SELECT *
    FROM signals
    WHERE detection_date >= ? AND detection_date <= ?
    LIMIT ?
  `;
  
  return await this.db.query(query, [
    timeWindow.start_date,
    timeWindow.end_date,
    MAX_QUERY_RESULTS
  ]);
}
```

---

## 10. Security & Access Control

### 10.1 Authentication

**User Authentication Required**:
```typescript
// Audit dashboards require authentication
function VectorMovementForensicAuditDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Render dashboard
  return (/* ... */);
}
```

### 10.2 Authorization

**Role-Based Access Control**:
```typescript
// Only admin and developer roles can access audits
const ALLOWED_ROLES = ['admin', 'developer'];

function useAuditAccess() {
  const { user } = useAuth();
  
  const hasAccess = user?.roles.some(role => ALLOWED_ROLES.includes(role));
  
  return { hasAccess };
}

function VectorMovementForensicAuditDashboard() {
  const { hasAccess } = useAuditAccess();
  
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  // Render dashboard
  return (/* ... */);
}
```

### 10.3 Data Protection

**Read-Only Database Access**:
```typescript
// Audit services use read-only database connections
class CSIDataRepository {
  private readOnlyDb: Database;
  
  constructor() {
    this.readOnlyDb = createReadOnlyConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_READONLY_USER,
      password: process.env.DB_READONLY_PASSWORD
    });
  }
}
```

**Sensitive Data Masking**:
```typescript
// Mask sensitive data in exports
function maskSensitiveData(data: any): any {
  // Remove or mask sensitive fields
  const masked = { ...data };
  
  if (masked.user_email) {
    masked.user_email = maskEmail(masked.user_email);
  }
  
  if (masked.api_key) {
    delete masked.api_key;
  }
  
  return masked;
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Service Layer Tests**:
```typescript
// Test individual section analyzers
describe('AbsoluteMovementLedgerAnalyzer', () => {
  it('should calculate vector totals correctly', async () => {
    const analyzer = new AbsoluteMovementLedgerAnalyzer(mockRepository);
    const result = await analyzer.analyze(testTimeWindow);
    
    expect(result.data.conflict_security.total_movement_points).toBe(335.0);
    expect(result.data.sanctions_regulatory.total_movement_points).toBe(245.6);
  });
  
  it('should detect anomalies when vector has zero movement', async () => {
    const analyzer = new AbsoluteMovementLedgerAnalyzer(mockRepository);
    const result = await analyzer.analyze(testTimeWindow);
    
    const anomalies = result.anomalies.filter(a => a.type === 'zero_movement');
    expect(anomalies.length).toBeGreaterThan(0);
  });
});
```

**Component Tests**:
```typescript
// Test dashboard components
describe('VectorMovementForensicAuditDashboard', () => {
  it('should render header and controls', () => {
    render(<VectorMovementForensicAuditDashboard />);
    
    expect(screen.getByText(/Vector Movement Forensic Audit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Audit/i })).toBeInTheDocument();
  });
  
  it('should show progress tracker when audit is running', async () => {
    const { rerender } = render(<VectorMovementForensicAuditDashboard />);
    
    fireEvent.click(screen.getByRole('button', { name: /Run Audit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Section 1 of 9/i)).toBeInTheDocument();
    });
  });
});
```

### 11.2 Integration Tests

**End-to-End Audit Execution**:
```typescript
describe('Vector Movement Audit Integration', () => {
  it('should execute complete audit and return results', async () => {
    const service = new VectorMovementForensicAuditService(
      realRepository,
      realReportGenerator,
      realCacheManager
    );
    
    const result = await service.executeAudit({
      type: 'last_90_days'
    });
    
    expect(result.sections.section_1).toBeDefined();
    expect(result.sections.section_2).toBeDefined();
    // ... all 9 sections
    expect(result.summary.sections_meeting_criteria).toBeGreaterThanOrEqual(0);
  });
});
```

### 11.3 Performance Tests

**Audit Execution Time**:
```typescript
describe('Audit Performance', () => {
  it('should complete audit within 60 seconds', async () => {
    const service = new VectorMovementForensicAuditService(/* ... */);
    
    const startTime = Date.now();
    await service.executeAudit({ type: 'last_90_days' });
    const endTime = Date.now();
    
    const executionTime = (endTime - startTime) / 1000;
    expect(executionTime).toBeLessThan(60);
  });
});
```

---

## 12. Deployment Plan

### 12.1 Development Environment

**Setup Steps**:
1. Clone repository
2. Install dependencies: `pnpm install`
3. Set up environment variables
4. Run development server: `pnpm dev`
5. Access at `http://localhost:5173`

### 12.2 Staging Environment

**Deployment Process**:
1. Merge feature branch to `staging`
2. Automated build and test
3. Deploy to staging server
4. Run integration tests
5. Manual QA testing
6. Stakeholder review

### 12.3 Production Environment

**Deployment Checklist**:
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Stakeholder approval obtained
- [ ] Rollback plan prepared

**Deployment Steps**:
1. Create production build: `pnpm build`
2. Run production tests
3. Deploy to production server
4. Verify deployment
5. Monitor for errors
6. Announce availability to users

### 12.4 Rollback Plan

**If Issues Detected**:
1. Identify issue severity
2. If critical: immediate rollback to previous version
3. If non-critical: create hotfix branch
4. Test hotfix in staging
5. Deploy hotfix to production
6. Post-mortem analysis

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Service Layer - Vector Movement Audit**
- [ ] Create `VectorMovementForensicAuditService.ts`
- [ ] Implement `CSIDataRepository`
- [ ] Implement Section 1 analyzer (Absolute Movement Ledger)
- [ ] Implement Section 2 analyzer (Movement Denominator Reconciliation)
- [ ] Write unit tests for analyzers

**Week 2: Service Layer - Ground Truth Recall Audit**
- [ ] Create `GroundTruthRecallAuditService.ts`
- [ ] Implement `GroundTruthRegistry`
- [ ] Implement `DetectionMatchingEngine`
- [ ] Implement `FalseNegativeClassifier`
- [ ] Write unit tests for components

### Phase 2: Core Analysis (Weeks 3-4)

**Week 3: Vector Movement Sections 3-6**
- [ ] Implement Section 3 analyzer (Routing & Confirmation Sample)
- [ ] Implement Section 4 analyzer (Rolling Vector Activity)
- [ ] Implement Section 5 analyzer (Suppression & Scoring Dynamics)
- [ ] Implement Section 6 analyzer (Baseline Factor Matrix)
- [ ] Write unit tests

**Week 4: Vector Movement Sections 7-9**
- [ ] Implement Section 7 analyzer (Source-to-Vector Concentration)
- [ ] Implement Section 8 analyzer (Expectation Weighting Integrity)
- [ ] Implement Section 9 analyzer (Decay Behavior)
- [ ] Implement `AuditReportGenerator`
- [ ] Write unit tests

### Phase 3: UI Components (Weeks 5-6)

**Week 5: Shared Components**
- [ ] Create `AuditProgressTracker.tsx`
- [ ] Create `AuditDataTable.tsx`
- [ ] Create `AuditSectionCard.tsx`
- [ ] Create `AuditExportMenu.tsx`
- [ ] Create `AuditTimeRangeSelector.tsx`
- [ ] Write component tests

**Week 6: Specialized Components**
- [ ] Create Vector Movement specific components
- [ ] Create Ground Truth Recall specific components
- [ ] Create chart components (Recharts)
- [ ] Write component tests

### Phase 4: Dashboard Pages (Weeks 7-8)

**Week 7: Vector Movement Dashboard**
- [ ] Create `VectorMovementForensicAuditDashboard.tsx`
- [ ] Implement section navigation
- [ ] Implement progress tracking
- [ ] Implement export functionality
- [ ] Write integration tests

**Week 8: Ground Truth Recall Dashboard**
- [ ] Create `GroundTruthRecallAuditDashboard.tsx`
- [ ] Implement section navigation
- [ ] Implement progress tracking
- [ ] Implement export functionality
- [ ] Write integration tests

### Phase 5: Integration & Testing (Weeks 9-10)

**Week 9: System Integration**
- [ ] Integrate with existing CSI database
- [ ] Add navigation links to home page
- [ ] Configure routing
- [ ] Implement caching
- [ ] End-to-end testing

**Week 10: Performance & Security**
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation
- [ ] User acceptance testing

### Phase 6: Deployment (Week 11)

**Week 11: Production Deployment**
- [ ] Staging deployment
- [ ] Stakeholder review
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User training
- [ ] Documentation finalization

---

## 14. Maintenance & Support

### 14.1 Monitoring

**Key Metrics to Monitor**:
- Audit execution time
- Cache hit rate
- Error rate
- User adoption
- Export usage

**Monitoring Tools**:
- Application logs
- Performance metrics
- Error tracking (Sentry)
- User analytics

### 14.2 Support

**Support Channels**:
- Internal documentation
- Developer Slack channel
- Email support
- Issue tracker

**Common Issues & Solutions**:
| Issue | Solution |
|-------|----------|
| Audit timeout | Increase time window, optimize queries |
| Cache miss | Check cache expiration, verify cache path |
| Export failure | Check file permissions, verify data format |
| Missing data | Verify database connection, check time window |

### 14.3 Future Enhancements

**Potential Improvements**:
1. **Scheduled Audits**: Automatic daily/weekly audit execution
2. **Email Notifications**: Alert stakeholders of critical findings
3. **Historical Comparison**: Compare audit results over time
4. **Custom Sections**: Allow users to define custom audit sections
5. **API Access**: Programmatic access to audit results
6. **Multi-Language Support**: Internationalization
7. **Advanced Visualizations**: Interactive 3D charts, network graphs
8. **Machine Learning**: Anomaly detection using ML models

---

## 15. Appendices

### Appendix A: File Structure

```
/workspace/shadcn-ui/
├── src/
│   ├── services/
│   │   └── audits/
│   │       ├── VectorMovementForensicAuditService.ts
│   │       ├── GroundTruthRecallAuditService.ts
│   │       ├── CSIDataRepository.ts
│   │       ├── GroundTruthRegistry.ts
│   │       ├── DetectionMatchingEngine.ts
│   │       ├── FalseNegativeClassifier.ts
│   │       ├── AuditReportGenerator.ts
│   │       ├── AuditCacheManager.ts
│   │       └── analyzers/
│   │           ├── AbsoluteMovementLedgerAnalyzer.ts
│   │           ├── MovementDenominatorReconciliationAnalyzer.ts
│   │           ├── RoutingConfirmationSampleAnalyzer.ts
│   │           ├── RollingVectorActivityAnalyzer.ts
│   │           ├── SuppressionScoringDynamicsAnalyzer.ts
│   │           ├── BaselineFactorMatrixAnalyzer.ts
│   │           ├── SourceVectorConcentrationAnalyzer.ts
│   │           ├── ExpectationWeightingIntegrityAnalyzer.ts
│   │           └── DecayBehaviorAnalyzer.ts
│   ├── pages/
│   │   ├── VectorMovementForensicAuditDashboard.tsx
│   │   └── GroundTruthRecallAuditDashboard.tsx
│   ├── components/
│   │   └── audit/
│   │       ├── shared/
│   │       │   ├── AuditProgressTracker.tsx
│   │       │   ├── AuditDataTable.tsx
│   │       │   ├── AuditSectionCard.tsx
│   │       │   ├── AuditExportMenu.tsx
│   │       │   ├── AuditTimeRangeSelector.tsx
│   │       │   ├── AuditMetricCard.tsx
│   │       │   └── AuditChartContainer.tsx
│   │       ├── vector-movement/
│   │       │   ├── MovementLedgerTable.tsx
│   │       │   ├── VectorActivityChart.tsx
│   │       │   ├── SuppressionDynamicsChart.tsx
│   │       │   ├── BaselineFactorMatrix.tsx
│   │       │   └── ExpectationWeightingScatter.tsx
│   │       └── ground-truth/
│   │           ├── GroundTruthEventList.tsx
│   │           ├── RecallRateChart.tsx
│   │           ├── DetectionStatusBadge.tsx
│   │           ├── FalseNegativeBreakdown.tsx
│   │           └── RoutingAccuracyMatrix.tsx
│   └── types/
│       └── audit.types.ts
├── docs/
│   └── audit-specs/
│       ├── VectorMovementForensicAudit-Specification.md
│       ├── GroundTruthRecallAudit-Specification.md
│       └── AuditSystems-Architecture.md (this document)
└── data/
    └── audit-cache/
        ├── vector-movement/
        └── ground-truth-recall/
```

### Appendix B: Type Definitions

See individual specification documents for complete type definitions:
- Vector Movement Audit: `/workspace/shadcn-ui/docs/audit-specs/VectorMovementForensicAudit-Specification.md`
- Ground Truth Recall Audit: `/workspace/shadcn-ui/docs/audit-specs/GroundTruthRecallAudit-Specification.md`

### Appendix C: API Endpoints

**Vector Movement Audit**:
```
POST   /api/audits/vector-movement/run
GET    /api/audits/vector-movement/:auditId/status
GET    /api/audits/vector-movement/:auditId/results
GET    /api/audits/vector-movement/:auditId/export
DELETE /api/audits/vector-movement/:auditId
```

**Ground Truth Recall Audit**:
```
POST   /api/audits/ground-truth-recall/run
GET    /api/audits/ground-truth-recall/:auditId/status
GET    /api/audits/ground-truth-recall/:auditId/results
GET    /api/audits/ground-truth-recall/:auditId/export
DELETE /api/audits/ground-truth-recall/:auditId
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-24 | Bob (Software Architect) | Initial architecture document |

---

**END OF DOCUMENT**