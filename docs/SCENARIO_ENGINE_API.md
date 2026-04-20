# Scenario Engine API Documentation

## Overview

The Scenario Engine is the core calculation module for Scenario Mode. It transforms user-configured scenarios into country-level shock changes and applies them to company exposures to calculate ΔCO-GRI.

**Location**: `/workspace/shadcn-ui/src/services/scenarioEngine.ts`

## Core Functions

### calculateScenarioImpact()

Calculate country-level CSI changes based on scenario configuration.

**Signature**:
```typescript
function calculateScenarioImpact(
  config: ScenarioConfig
): CountryShockChange[]
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| config | ScenarioConfig | Scenario configuration object |

**ScenarioConfig Interface**:
```typescript
interface ScenarioConfig {
  eventType: EventType;           // Type of geopolitical event
  actorCountry: string;            // Country initiating the event
  targetCountries: string[];       // Countries directly affected
  propagationType: PropagationType; // How shock propagates
  severity: Severity;              // Event severity (Low/Medium/High)
  alignmentChange?: number;        // Optional: -100 to +100
  exposureChange?: number;         // Optional: -100 to +100
  sectorSensitivity?: number;      // Optional: 0 to 2
}
```

**Returns**:
```typescript
interface CountryShockChange {
  country: string;        // Country name
  baseCSI: number;        // Baseline Country Shock Index
  scenarioCSI: number;    // CSI under scenario
  delta: number;          // Change in CSI
  impactReason: string;   // Explanation of impact
}
```

**Example Usage**:
```typescript
const config: ScenarioConfig = {
  eventType: 'Sanctions',
  actorCountry: 'United States',
  targetCountries: ['China', 'Taiwan'],
  propagationType: 'Regional',
  severity: 'High',
};

const shockChanges = calculateScenarioImpact(config);

// Output:
// [
//   { country: 'United States', baseCSI: 35, scenarioCSI: 45.5, delta: 10.5, ... },
//   { country: 'China', baseCSI: 65, scenarioCSI: 95, delta: 30, ... },
//   { country: 'Taiwan', baseCSI: 50, scenarioCSI: 85, delta: 35, ... },
//   { country: 'Japan', baseCSI: 45, scenarioCSI: 52, delta: 7, ... },
//   ...
// ]
```

**Event Types**:

| Event Type | Description | Typical Severity |
|------------|-------------|------------------|
| Sanctions | Economic sanctions imposed | Medium-High |
| Capital Controls | Restrictions on capital flows | Medium |
| Nationalization | Seizure of foreign assets | High |
| Export Ban | Prohibition on exports | Medium-High |
| Foreign Investment Restriction | Limits on FDI | Low-Medium |
| Trade Embargo | Complete trade ban | High |
| Conflict | Military conflict or war | High |
| Domestic Instability | Political unrest, coups | Medium |
| Energy Restriction | Oil/gas supply disruption | Medium-High |
| Cyberattack | State-sponsored cyber warfare | Low-Medium |
| Custom | User-defined event | Variable |

**Propagation Types**:

| Type | Description | Countries Affected | Use Case |
|------|-------------|-------------------|----------|
| Unilateral | Only targets affected | Targets only | Localized sanctions |
| Bilateral | Actor and targets | Actor + Targets | Trade disputes |
| Regional | Economic spillover | Actor + Targets + Connected | Regional conflicts |
| Global | All countries | All 195 countries | Global crises |

**Severity Levels**:

| Severity | CSI Impact | Description |
|----------|-----------|-------------|
| Low | +5 to +15 | Minor event, limited scope |
| Medium | +15 to +30 | Moderate event, noticeable impact |
| High | +30 to +50 | Major event, significant disruption |

**Algorithm**:
1. Apply direct impact to target countries (full severity)
2. Apply partial impact to actor country (30% of severity)
3. If Regional/Global, identify spillover countries via economic links
4. Apply spillover impact based on trade/financial linkages
5. Apply optional alignment and exposure changes
6. Return array of all affected countries

---

### applyScenarioToCompany()

Apply scenario shocks to company exposures and calculate ΔCO-GRI.

**Signature**:
```typescript
async function applyScenarioToCompany(
  ticker: string,
  shockChanges: CountryShockChange[],
  config: ScenarioConfig
): Promise<CompanyScenarioResult>
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| ticker | string | Company ticker symbol (e.g., 'AAPL') |
| shockChanges | CountryShockChange[] | Output from calculateScenarioImpact() |
| config | ScenarioConfig | Original scenario configuration |

**Returns**:
```typescript
interface CompanyScenarioResult {
  ticker: string;
  baselineScore: number;          // Baseline CO-GRI
  scenarioScore: number;          // Scenario CO-GRI
  scoreDelta: number;             // ΔCO-GRI
  percentChange: number;          // % change
  baselineRiskLevel: string;      // Risk level before
  scenarioRiskLevel: string;      // Risk level after
  countryExposures: CountryExposureResult[];
  channelBreakdown: ChannelBreakdown;
}
```

**CountryExposureResult Interface**:
```typescript
interface CountryExposureResult {
  country: string;
  exposureWeight: number;         // Company's exposure (0-1)
  baseCSI: number;
  scenarioCSI: number;
  baseContribution: number;       // exposureWeight * baseCSI
  scenarioContribution: number;   // exposureWeight * scenarioCSI
}
```

**ChannelBreakdown Interface**:
```typescript
interface ChannelBreakdown {
  trade: ChannelDetail;
  alignment: ChannelDetail;
  sector: ChannelDetail;
}

interface ChannelDetail {
  baselineScore: number;
  scenarioScore: number;
  delta: number;
  weight: number;               // α, β, or γ
  confidence: number;           // 0-100
  evidenceLevel: EvidenceLevel;
  dataSource: DataSource;
}
```

**Example Usage**:
```typescript
const shockChanges = calculateScenarioImpact(config);
const result = await applyScenarioToCompany('AAPL', shockChanges, config);

console.log('Baseline CO-GRI:', result.baselineScore);  // 45.5
console.log('Scenario CO-GRI:', result.scenarioScore);  // 54.0
console.log('ΔCO-GRI:', result.scoreDelta);             // +8.5
console.log('% Change:', result.percentChange);         // +18.7%
console.log('Risk Level:', result.scenarioRiskLevel);   // "High Risk"

// Access country-level details
result.countryExposures.forEach(exposure => {
  console.log(`${exposure.country}: ${exposure.scenarioContribution.toFixed(2)}`);
});

// Access channel breakdown
console.log('Trade channel delta:', result.channelBreakdown.trade.delta);
console.log('Alignment channel delta:', result.channelBreakdown.alignment.delta);
console.log('Sector channel delta:', result.channelBreakdown.sector.delta);
```

**Algorithm**:
1. Fetch company exposure data (country weights)
2. For each country exposure:
   - Find matching shock change
   - Calculate baseline contribution: weight × baseCSI
   - Calculate scenario contribution: weight × scenarioCSI
3. Sum all contributions to get baseline and scenario CO-GRI
4. Calculate ΔCO-GRI = scenario - baseline
5. Calculate channel-specific contributions (Trade, Alignment, Sector)
6. Determine risk levels based on CO-GRI thresholds
7. Return comprehensive result object

---

## Helper Functions

### getPropagationEngine()

Get the appropriate propagation engine based on type.

**Signature**:
```typescript
function getPropagationEngine(
  type: PropagationType
): PropagationEngine
```

**Returns**: PropagationEngine instance (Unilateral, Bilateral, Regional, or Global)

---

### applyEventImpact()

Calculate CSI delta for a country based on event type and severity.

**Signature**:
```typescript
function applyEventImpact(
  baseCSI: number,
  eventType: EventType,
  severity: Severity,
  isTarget: boolean,
  isActor: boolean
): number
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| baseCSI | number | Country's baseline CSI |
| eventType | EventType | Type of event |
| severity | Severity | Event severity |
| isTarget | boolean | Is this country a direct target? |
| isActor | boolean | Is this country the actor? |

**Returns**: New CSI value

**Logic**:
- **Target countries**: Full impact (severity-based delta)
- **Actor country**: 30% of full impact
- **Spillover countries**: Calculated via economic linkages

---

### calculateSpilloverImpact()

Calculate spillover impact for countries not directly targeted.

**Signature**:
```typescript
function calculateSpilloverImpact(
  country: string,
  targetCountries: string[],
  severity: Severity
): number
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Spillover country name |
| targetCountries | string[] | Direct target countries |
| severity | Severity | Event severity |

**Returns**: CSI delta for spillover country

**Algorithm**:
1. Calculate trade linkage strength with targets
2. Calculate financial linkage strength with targets
3. Combine linkages with weights (trade: 60%, financial: 40%)
4. Apply severity multiplier
5. Return spillover CSI delta

---

## Data Sources

### Company Exposure Data

**Source**: `/workspace/shadcn-ui/src/data/companyExposures.ts`

**Structure**:
```typescript
interface CompanyExposure {
  ticker: string;
  countryWeights: Record<string, number>;  // country → weight (0-1)
}
```

**Example**:
```typescript
{
  ticker: 'AAPL',
  countryWeights: {
    'China': 0.25,
    'United States': 0.20,
    'Taiwan': 0.15,
    'Japan': 0.12,
    ...
  }
}
```

### Country Shock Index (CSI) Data

**Source**: `/workspace/shadcn-ui/src/data/countryShockIndex.ts`

**Structure**:
```typescript
interface CountryCSI {
  country: string;
  csi: number;           // 0-100
  lastUpdated: Date;
}
```

### Economic Linkage Data

**Sources**:
- Trade: UN COMTRADE
- Supply Chain: OECD ICIO
- Financial: IMF CPIS, OECD FDI, BIS Banking

**Structure**:
```typescript
interface EconomicLinkage {
  country1: string;
  country2: string;
  tradeIntensity: number;      // 0-1
  supplyChainIntensity: number; // 0-1
  financialIntensity: number;   // 0-1
}
```

---

## Error Handling

### Common Errors

**1. Invalid Ticker**
```typescript
Error: Company ticker 'INVALID' not found
```
**Solution**: Ensure ticker exists in company database

**2. Missing Target Countries**
```typescript
Error: At least one target country must be specified
```
**Solution**: Select at least one target country

**3. Invalid Severity**
```typescript
Error: Severity must be 'Low', 'Medium', or 'High'
```
**Solution**: Use valid severity value

**4. Propagation Engine Error**
```typescript
Error: Failed to calculate spillover countries
```
**Solution**: Check economic linkage data availability

### Error Handling Example

```typescript
try {
  const shockChanges = calculateScenarioImpact(config);
  const result = await applyScenarioToCompany(ticker, shockChanges, config);
  return result;
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Invalid ticker or country');
  } else if (error.message.includes('target country')) {
    console.error('Missing required parameters');
  } else {
    console.error('Calculation failed:', error);
  }
  throw error;
}
```

---

## Performance Considerations

### Calculation Time

| Propagation Type | Countries Affected | Calculation Time |
|------------------|-------------------|------------------|
| Unilateral | 1-5 | 50-100ms |
| Bilateral | 2-10 | 100-200ms |
| Regional | 15-30 | 400-500ms |
| Global | 195 | 1,500-2,000ms |

### Optimization Tips

1. **Use Regional instead of Global** when possible
2. **Cache company exposure data** (already implemented)
3. **Limit spillover calculations** to top N countries by linkage strength
4. **Use Web Workers** for parallel calculation (future enhancement)

---

## Testing

### Unit Tests

**Location**: `/workspace/shadcn-ui/src/__tests__/unit/scenarioEngine.test.ts`

**Coverage**:
- Event impact calculation
- Propagation logic
- Company application
- Edge cases (zero exposure, missing data)

**Example**:
```typescript
describe('calculateScenarioImpact', () => {
  it('should apply full impact to target countries', () => {
    const config = {
      eventType: 'Sanctions',
      actorCountry: 'United States',
      targetCountries: ['China'],
      propagationType: 'Unilateral',
      severity: 'High',
    };
    
    const result = calculateScenarioImpact(config);
    const china = result.find(c => c.country === 'China');
    
    expect(china.delta).toBeGreaterThan(30); // High severity
  });
});
```

---

## Changelog

### v1.0.0 (2026-03-01)
- Initial release
- Support for 11 event types
- 4 propagation patterns
- 3 severity levels
- Regional spillover calculation
- Channel attribution (Trade, Alignment, Sector)

### Future Enhancements

**v1.1.0** (Planned Q2 2026)
- Time-series scenario tracking
- Scenario sensitivity analysis
- Custom event type definitions
- Enhanced spillover algorithms

**v2.0.0** (Planned Q3 2026)
- Multi-company portfolio scenarios
- Real-time scenario monitoring
- AI-powered scenario suggestions
- Advanced propagation models

---

## Support

For questions or issues:
- **Documentation**: `/workspace/shadcn-ui/docs/`
- **Technical Support**: Contact development team
- **Bug Reports**: Submit via issue tracker

---

**API Version**: 1.0.0  
**Last Updated**: 2026-03-01  
**Maintained by**: Alex (Engineer)