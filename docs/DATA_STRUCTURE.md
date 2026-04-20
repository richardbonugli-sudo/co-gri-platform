# CedarOwl Forecast Data Structure Documentation

## Overview

This document describes the data structure and access patterns for the CedarOwl Integrated Geopolitical Gurus Risk Forecast system.

## Data Files

### Core Data
- `src/types/forecast.ts` - TypeScript type definitions
- `src/data/cedarOwlForecast2026.ts` - 2026 forecast data
- `src/data/forecastRegistry.ts` - Versioning and registry system

### Utilities
- `src/utils/forecastValidation.ts` - Data validation functions
- `src/utils/forecastDataAccess.ts` - Data access helper functions

## Type Definitions

### CedarOwlForecast

The main forecast data structure containing all forecast information.

```typescript
interface CedarOwlForecast {
  metadata: ForecastMetadata;
  countryAdjustments: Record<string, CountryAdjustment>;
  geopoliticalEvents: GeopoliticalEvent[];
  regionalPremiums: RegionalPremiums;
  sectorMultipliers: SectorMultipliers;
  assetClassForecasts: Record<string, AssetClassForecast>;
  regionalOutlook: Record<string, RegionalOutlook>;
}
```

### ForecastMetadata

Metadata about the forecast publication and coverage.

```typescript
interface ForecastMetadata {
  forecastPeriod: string;        // e.g., "2026-01-01 to 2026-12-31"
  publishDate: string;           // ISO date
  expertSources: number;         // Number of expert sources
  overallConfidence: number;     // 0.0 to 1.0
  nextUpdate: string;            // ISO date
  coverage: {
    countries: number;
    events: number;
    regions: number;
    assetClasses: number;
  };
}
```

### CountryAdjustment

Country-level risk adjustment and outlook.

```typescript
interface CountryAdjustment {
  delta: number;                 // CSI delta (-10 to +10)
  drivers: string[];             // Key risk drivers
  outlook: string;               // Investment outlook
  expectedReturn: number;        // Expected return (decimal)
  riskTrend: string;            // IMPROVING | STABLE | DETERIORATING
  notes?: string;               // Optional notes
}
```

### GeopoliticalEvent

Major geopolitical event with timing and impact assessment.

```typescript
interface GeopoliticalEvent {
  event: string;                 // Event name
  timeline: string;              // e.g., "2026-01", "H1 2026"
  probability: number;           // 0.0 to 1.0
  riskLevel: string;            // LOW | MEDIUM | HIGH | CRITICAL
  baseImpact: number;           // Base impact score
  affectedCountries: string[];  // ISO country codes
  sectorImpacts: Record<string, number>;  // Sector multipliers
  description: string;          // Detailed description
  investmentImpact: string;     // Investment implications
}
```

## Data Access Patterns

### Loading Forecast Data

```typescript
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';

// Load 2026 forecast
const forecast = loadCedarOwlForecast('2026');
```

### Accessing Country Data

```typescript
import { getCountryAdjustment } from '@/utils/forecastDataAccess';

// Get adjustment for a specific country
const usAdjustment = getCountryAdjustment('US');
console.log(usAdjustment?.delta);  // -1.2
console.log(usAdjustment?.outlook);  // 'NEUTRAL'
```

### Querying Events

```typescript
import {
  getGeopoliticalEvents,
  getEventsByTimeline,
  getEventsByRiskLevel,
  getHighProbabilityEvents
} from '@/utils/forecastDataAccess';

// Get all events
const allEvents = getGeopoliticalEvents();

// Get events in Q1 2026
const q1Events = getEventsByTimeline('2026-01');

// Get critical events
const criticalEvents = getEventsByRiskLevel('CRITICAL');

// Get high probability events (>80%)
const highProbEvents = getHighProbabilityEvents(0.8);
```

### Accessing Multipliers

```typescript
import {
  getSectorMultiplier,
  getRegionalPremium
} from '@/utils/forecastDataAccess';

// Get sector multiplier
const techMultiplier = getSectorMultiplier('Technology');  // 1.25

// Get regional premium
const europePremium = getRegionalPremium('Europe');  // 1.12
```

### Filtering Countries

```typescript
import {
  getCountriesByOutlook,
  getCountriesByRiskTrend,
  getTopCountriesByReturn
} from '@/utils/forecastDataAccess';

// Get STRONG_BUY countries
const strongBuyCountries = getCountriesByOutlook('STRONG_BUY');

// Get improving countries
const improvingCountries = getCountriesByRiskTrend('IMPROVING');

// Get top 10 countries by expected return
const topCountries = getTopCountriesByReturn(10);
```

### Summary Statistics

```typescript
import { getForecastSummary } from '@/utils/forecastDataAccess';

const summary = getForecastSummary();
console.log(summary);
// {
//   totalCountries: 195,
//   totalEvents: 6,
//   averageDelta: 0.5,
//   averageReturn: 0.03,
//   improvingCount: 45,
//   deterioratingCount: 38,
//   stableCount: 112,
//   highProbabilityEvents: 4,
//   criticalEvents: 1
// }
```

## Validation

### Validating Forecast Data

```typescript
import { validateForecast } from '@/utils/forecastValidation';

const result = validateForecast(forecast);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
}
```

### Checking Staleness

```typescript
import { isForecastStale } from '@/utils/forecastValidation';
import { getStalenessWarning } from '@/data/forecastRegistry';

if (isForecastStale(forecast)) {
  const warning = getStalenessWarning(forecast);
  console.warn(warning);
}
```

## Versioning

### Registry System

```typescript
import {
  getAvailableForecastYears,
  getLatestForecast,
  getForecastByYear
} from '@/data/forecastRegistry';

// Get available years
const years = getAvailableForecastYears();  // ['2026']

// Get latest forecast
const latest = getLatestForecast();

// Get specific year
const forecast2026 = getForecastByYear('2026');
```

## Data Coverage

### 2026 Forecast Coverage

- **Countries**: 195 (complete global coverage)
- **Events**: 6 major geopolitical events
- **Regions**: 4 (Europe, Middle East, Asia-Pacific, Americas)
- **Asset Classes**: 6 (Gold/Silver, Commodities, EM Equities, US Equities, EUR Equities, Bonds)
- **Sectors**: 15+ sector multipliers
- **Expert Sources**: 15 leading geopolitical & financial analysts
- **Confidence Level**: 85%

### Key Events Timeline

1. **January 2026**: US-Venezuela Intervention (95% probability, CRITICAL)
2. **February 2026**: New START Treaty Expiry (100% probability, HIGH)
3. **March 2026**: Ukraine Peace Negotiations (70% probability, HIGH)
4. **July 2026**: NATO Summit - Ukraine Security (90% probability, MEDIUM)
5. **September 2026**: US-China Tech Decoupling (80% probability, HIGH)
6. **October 2026**: BRICS Payment System Launch (65% probability, MEDIUM)

## Best Practices

1. **Always validate data** after loading or modifying
2. **Check staleness** before using forecast data
3. **Use type-safe access** through provided utility functions
4. **Handle null returns** from optional data queries
5. **Cache frequently accessed data** to improve performance
6. **Update forecasts** quarterly or semi-annually

## Error Handling

```typescript
try {
  const forecast = loadCedarOwlForecast('2025');
} catch (error) {
  console.error('Forecast not available:', error.message);
}

const adjustment = getCountryAdjustment('XX');
if (!adjustment) {
  console.warn('Country not found in forecast');
}
```

## Testing

All data structures and utilities are comprehensively tested:

- `src/data/__tests__/cedarOwlForecast2026.test.ts`
- `src/utils/__tests__/forecastValidation.test.ts`
- `src/utils/__tests__/forecastDataAccess.test.ts`

Run tests with:
```bash
npm test
```

## Updates and Maintenance

The forecast data should be updated:
- **Quarterly** (preferred)
- **Semi-annually** (minimum)
- When major geopolitical events occur
- When expert consensus significantly changes

Next scheduled update: **2026-04-01**
