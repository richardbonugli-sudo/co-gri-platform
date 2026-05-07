# CSI PHASE 3: Expansion - Comprehensive Coverage

## Overview

PHASE 3 expands the Country Shock Index (CSI) system with:
- **Event Propagation**: Automatic propagation through trade networks
- **Expanded Data Sources**: 50+ sources for comprehensive global coverage
- **Advanced Analytics**: Impact analysis, correlations, and predictive models

## Architecture

### 1. Event Propagation System

#### Components

**Trade Relationships** (`propagation/tradeRelationships.ts`)
- Defines bilateral trade relationships with intensity scores (0-100)
- Covers major economies and trade corridors
- Supports bidirectional trade flow analysis

**Propagation Rules** (`propagation/propagationRules.ts`)
- Event-type-specific propagation rules
- Decay factors per hop (typically 50% per hop)
- Sector-specific multipliers
- Maximum hop limits (1-3 hops)

**Propagation Engine** (`propagation/propagationEngine.ts`)
- Automatic propagation when events are confirmed
- Multi-hop propagation with decay
- Deduplication to prevent double-counting
- Creates propagated event records automatically

**Propagation Store** (`propagation/propagationStore.ts`)
- Manages propagated event data
- Indexes by origin event and target country
- Provides query and statistics functions

#### Propagation Algorithm

```
1. Start with origin event (hop 0)
2. For each hop (1 to max_hops):
   a. Get trade partners with intensity >= threshold
   b. For each partner:
      - Check if already visited (skip if yes)
      - Calculate propagation intensity with decay
      - Check if intensity >= minimum threshold
      - Create propagated event if passes checks
      - Add to queue for next hop
   c. Continue until max hops or no more propagation
3. Store all propagated events
4. Update origin event with propagation tracking
```

#### Propagation Intensity Calculation

```typescript
intensity = origin_delta_csi 
          × trade_intensity 
          × event_type_multiplier 
          × sector_multiplier 
          × decay_per_hop^hop_count
```

### 2. Expanded Data Sources

#### Source Categories

**Tier 1: Authoritative (15 sources)**
- Government agencies (Fed, Treasury, State Dept, Commerce, USTR, SEC)
- Central banks (BoE, ECB, PBoC)
- International organizations (IMF, World Bank, WTO, OECD, G7)
- Update frequency: 60 minutes
- Confidence boost: 95%

**Tier 2: Regional News (20 sources)**
- Asia-Pacific: SCMP, Nikkei Asia, Straits Times, Japan Times, Korea Herald
- Europe: Deutsche Welle, France 24, Euronews, Politico EU
- Middle East: Al Jazeera, Arab News, Haaretz
- Latin America: Buenos Aires Times, Brazil Reports
- Russia/Eastern Europe: Moscow Times, Kyiv Post
- Global: Guardian, Economist, WSJ, NYT
- Update frequency: 360 minutes (6 hours)
- Confidence boost: 75-85%

**Tier 3: Sector-Specific (15 sources)**
- Energy: Platts, OilPrice
- Technology: TechCrunch, Ars Technica, Semiconductor Engineering
- Finance: FT Markets, CNBC, MarketWatch
- Trade: Supply Chain Dive, Journal of Commerce
- Defense: Defense News, Janes
- Pharma: PharmaTimes, FiercePharma
- Agriculture: Agri-Pulse
- Update frequency: 1440 minutes (24 hours)
- Confidence boost: 70-85%

**Think Tanks (5 sources)**
- CSIS, Brookings, CFR, Chatham House, RAND
- Update frequency: 1440 minutes
- Confidence boost: 85%

**Total: 55 sources** (up from 15 in PHASE 2)

### 3. Advanced Analytics

#### Impact Analysis (`analytics/impactAnalysis.ts`)

**Impact Score Components**:
- Geographic Reach: Based on propagation (0-100)
- Sector Breadth: Based on affected sectors (0-100)
- Duration Score: Based on event lifecycle (0-100)
- Severity Score: Normalized severity (0-100)
- Composite Impact: Weighted average (30% geo, 20% sector, 20% duration, 30% severity)

**Functions**:
- `calculateImpactScore()`: Calculate impact for single event
- `getTopImpactfulEvents()`: Rank events by impact
- `getImpactByCountry()`: Aggregate impact per country
- `getImpactBySector()`: Aggregate impact per sector
- `getImpactTrend()`: Time series of impact

#### Correlation Detection (`analytics/correlationDetector.ts`)

**Correlation Types**:
- **Temporal**: Events close in time (≤7 days)
- **Geographic**: Events in same country or strong trade partners
- **Sector**: Events affecting same sectors
- **Causal**: One event likely caused another

**Event Chains**:
- **Linear**: A → B
- **Cascading**: A → B → C (multiple countries)
- **Feedback**: A → B → A (same country affected multiple times)

**Functions**:
- `detectCorrelations()`: Find all correlations
- `detectEventChains()`: Identify causal chains
- `getCorrelationMatrix()`: Generate correlation matrix for visualization

#### Predictive Model (`analytics/predictiveModel.ts`)

**Risk Score Components**:
- Overall Risk: 0-100 composite score
- Event Type Risks: Risk per event type
- Vector Risks: Risk per shock vector
- Leading Indicators: Early warning signals
- Prediction Confidence: Based on historical data

**Leading Indicators**:
- Recent event frequency (last 30 days)
- Trade partner tensions (last 90 days)
- Active event severity
- Historical patterns

**Event Predictions**:
- Likelihood: 0-100%
- Estimated severity: 1-10
- Estimated ΔCSI
- Timeframe: 1-7 days, 1-4 weeks, 1-3 months, 3-6 months
- Confidence: Based on historical accuracy

**Functions**:
- `calculateRiskScore()`: Calculate risk for country
- `predictFutureEvents()`: Predict likely future events
- `getEarlyWarningSignals()`: Detect escalation/contagion patterns
- `getRiskTrend()`: Time series of risk

## User Interfaces

### 1. Propagation Network Page (`/csi-propagation`)

**Features**:
- Event selection dropdown
- Run propagation button
- D3 network visualization
- Node colors by hop (red → orange → yellow → green)
- Interactive node selection
- Propagation statistics
- Affected countries list

### 2. Analytics Dashboard (`/csi-analytics`)

**Tabs**:

**Impact Analysis**:
- Top impactful events (ranked)
- Impact by country
- Impact by sector
- Composite impact scores

**Correlations**:
- Event correlations (temporal, geographic, sector, causal)
- Event chains (linear, cascading, feedback)
- Correlation strength visualization

**Predictions**:
- Country selection
- Risk score display
- Leading indicators
- Event predictions with likelihood
- Timeframe estimates

**Early Warnings**:
- Escalation signals
- Contagion patterns
- Pattern recognition
- Severity levels (LOW, MEDIUM, HIGH)

## Integration with PHASE 1 & 2

### Event Store Updates
- Added `propagated_events` field to EventRecord
- Added `origin_event_id` and `propagation_hop` for propagated events
- Added propagation tracking methods

### Automatic Triggers
- When event transitions to CONFIRMED state → trigger propagation
- Propagated events are auto-confirmed (no manual review needed)
- Propagation results stored in event store and propagation store

### Data Flow
```
1. Event detected (PHASE 2 automation)
2. Manual review (PHASE 2)
3. Event confirmed → PHASE 3 propagation triggered
4. Propagated events created automatically
5. Analytics updated in real-time
6. Predictions recalculated
```

## Testing Guide

### 1. Test Event Propagation

```typescript
// Create a test event
const testEvent = await createEvent({
  country: 'United States',
  event_type: 'SANCTION',
  primary_vector: 'SC2',
  severity: 8,
  delta_csi: 5.0,
  detected_date: new Date().toISOString(),
  description: 'Test sanctions event',
  sources: ['test'],
  rationale: 'Testing propagation',
  created_by: 'TEST'
});

// Transition to CONFIRMED to trigger propagation
await transitionEventState({
  event_id: testEvent.event_id,
  new_state: 'CONFIRMED',
  user: 'TEST',
  reason: 'Testing'
});

// Check propagation results
const propagated = getPropagatedEvents(testEvent.event_id);
console.log(`Propagated to ${propagated.length} countries`);

// Get network data
const network = getPropagationNetworkData(testEvent.event_id);
console.log(`Network: ${network.nodes.length} nodes, ${network.links.length} links`);
```

### 2. Test Analytics

```typescript
// Get all events
const events = getAllEvents();

// Test impact analysis
const topEvents = getTopImpactfulEvents(events, 10);
console.log('Top 10 impactful events:', topEvents);

// Test correlations
const correlations = detectCorrelations(events);
console.log(`Found ${correlations.length} correlations`);

// Test predictions
const riskScore = calculateRiskScore('China', events);
console.log('Risk score:', riskScore);

const predictions = predictFutureEvents('China', events, 5);
console.log('Predictions:', predictions);
```

### 3. Test Expanded Data Sources

```typescript
// Test RSS ingestion from expanded sources
import { getAllExpandedSources } from './dataSources/expandedConfig';

const sources = getAllExpandedSources();
console.log(`Total sources: ${sources.length}`);

// Test by category
const regional = getSourcesByCategory('regional');
const sector = getSourcesByCategory('sector');
const government = getSourcesByCategory('government');

console.log(`Regional: ${regional.length}`);
console.log(`Sector: ${sector.length}`);
console.log(`Government: ${government.length}`);
```

## Performance Considerations

### Propagation
- Limit max hops to 3 to prevent exponential growth
- Use minimum intensity threshold (0.5) to filter weak propagations
- Deduplication prevents visiting same country twice
- Async propagation doesn't block UI

### Analytics
- Cache impact scores to avoid recalculation
- Limit correlation detection to recent events (last 2 years)
- Use sampling for large datasets (>1000 events)
- Lazy load visualizations

### Data Sources
- Stagger RSS feed polling to avoid rate limits
- Cache feed data for 1 hour minimum
- Use exponential backoff for failed requests
- Prioritize Tier 1 sources

## Future Enhancements

### PHASE 4 (Potential)
- Machine learning for event detection
- Real-time WebSocket updates
- Custom alert rules
- Export to external systems
- API for third-party integration
- Mobile app
- Multi-language support

## Conclusion

PHASE 3 completes the CSI system with:
- ✅ Automatic event propagation through trade networks
- ✅ 55+ data sources for comprehensive coverage
- ✅ Advanced analytics (impact, correlations, predictions)
- ✅ Interactive visualizations
- ✅ Early warning system
- ✅ Predictive risk scores

The system is now production-ready for geopolitical risk analysis.