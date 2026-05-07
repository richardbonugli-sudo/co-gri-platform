# V.4 Compliant CO-GRI Step 1 Implementation

## Overview

This directory contains the complete V.4 compliant implementation of CO-GRI Step 1 logic for geographic exposure allocation. The implementation follows the V.4 pseudocode exactly and enforces all V.4 invariants.

## Core V.4 Invariants

1. **Narrative affects MEMBERSHIP only** - Narrative/partial structured evidence affects membership only, never allocation magnitude, unless a CLOSED allocatable numeric total exists.

2. **SSF Gating** - SSF only if:
   - (a) Label has closed allocatable numeric total AND
   - (b) Membership resolvable (narrative definition first; else bounded map)

3. **RF-A Scope** - RF-A only applies to a residual LABEL TOTAL when closed total exists but membership NOT resolvable.

4. **RF-B/C/D Scope** - RF-B/C/D apply to 100% of channel only when NO closed allocatable totals exist.

5. **GF Gating** - GF only if NO geo evidence anywhere AND worldwide plausible.

6. **Multi-Fallback Support** - "Direct + residual" is supported (multiple fallbacks within one channel).

## Architecture

### Core Services

1. **labelResolution.ts** - Label detection and membership resolution
   - 50+ geographic labels with standard memberships
   - Canonical label mapping (handles aliases)
   - V.4 compliant membership resolution (narrative first, then bounded map)

2. **rfTaxonomy.ts** - RF-A/B/C/D classification
   - Evidence-structure based (NOT keyword-based)
   - Partial evidence detection
   - Membership evidence detection

3. **closedTotalValidation.ts** - Closed-total gating logic
   - Closed-total detection
   - Label total identification
   - Structured evidence validation

4. **restrictedSetBuilder.ts** - Restricted set P construction
   - Named countries + bounded expansions + plausibility
   - Exclusion logic (already-allocated, home country if foreign-only)

5. **allocators.ts** - Allocation implementations
   - SSF: Sector-Specific Fallback within label membership
   - RF: Restricted Fallback within restricted set P
   - GF: Global Fallback (GDP-based)
   - Normalization and merge utilities

6. **v4Orchestrator.ts** - Main allocation engine
   - Implements complete V.4 decision tree
   - Handles direct + SSF + RF combinations
   - Produces detailed trace for transparency

7. **evidenceExtractor.ts** - Evidence extraction
   - Extracts structured items from company data
   - Extracts narrative mentions
   - Supports both V.4 enhanced and legacy data

### Integration

8. **v4Integration.ts** - Integration layer
   - `calculateV4Exposures()` - Main calculation function
   - `formatV4Results()` - Format results for display
   - `compareV4WithLegacy()` - Compare V.4 vs legacy

9. **testV4Implementation.ts** - Test suite
   - Apple (AAPL) test - Label-to-country mapping
   - Tesla (TSLA) test - PP&E table detection
   - Comprehensive validation

## V.4 Decision Tree

```
STEP 1: Extract direct country-level structured evidence
  → Only COUNTRY entityKind with numeric values count as DIRECT
  → Lock these countries (exclude from subsequent allocations)

STEP 2: Identify closed allocatable label totals
  → Labels (GEO_LABEL or NONSTANDARD_LABEL) with numeric totals

IF closed totals exist:
  STEP 3: Label-by-label allocation
    FOR EACH label with closed total:
      - Check membership resolvability
        - Narrative definition first (if confidence >= 0.75)
        - Standard bounded map second
      - IF resolvable → SSF within membership
      - IF NOT resolvable → RF-A for that label total only
      - Exclude already-allocated countries
    - Merge all allocations and normalize
    
ELSE (NO closed totals):
  STEP 4: Channel-level fallback
    IF any geography membership evidence exists:
      → RF (B/C/D) for 100% of channel
        - RF-D: partial structured numeric evidence
        - RF-B: countries explicitly named
        - RF-C: only geo labels named
    ELSE IF NO geography evidence AND worldwide plausible:
      → GF for 100% of channel
    ELSE:
      → Return empty for review
```

## Database Schema

### Enhanced Company Exposure (Backward Compatible)

```typescript
interface EnhancedCompanyExposure {
  // ===== EXISTING FIELDS (100% PRESERVED) =====
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: Array<{
    country: string;
    percentage: number;
    description?: string;
  }>;
  dataSource: string;
  lastUpdated: string;
  
  // ===== NEW V.4 FIELDS (OPTIONAL) =====
  v4Metadata?: {
    version: string;
    lastEnhanced: string;
    enhancementStatus: 'complete' | 'partial' | 'pending';
  };
  
  labelDefinitions?: Record<string, {
    membership: string[];
    membershipSource: string;
    confidence: number;
  }>;
  
  narrativeText?: {
    revenue?: string;
    supply?: string;
    assets?: string;
    financial?: string;
  };
  
  ppeData?: {
    items: Array<{
      country?: string;
      label?: string;
      value: number;
      unit: 'pct' | 'abs';
      source: string;
    }>;
    total: number;
    source: string;
  };
  
  channelEvidence?: {
    revenue?: EvidenceBundle;
    supply?: EvidenceBundle;
    assets?: EvidenceBundle;
    financial?: EvidenceBundle;
  };
}
```

## Usage Examples

### Basic Usage

```typescript
import { calculateV4Exposures } from '@/services/v4Integration';

// Calculate V.4 exposures for Apple
const results = await calculateV4Exposures('AAPL');

console.log('Revenue allocation:', results.revenue);
console.log('Assets allocation:', results.assets);
console.log('Traces:', results.traces);
```

### With Formatting

```typescript
import { calculateV4Exposures, formatV4Results } from '@/services/v4Integration';

const results = await calculateV4Exposures('AAPL');
const formatted = formatV4Results(results.revenue, results.traces.revenue);

console.log('Top countries:', formatted.countries);
console.log('Evidence classification:', formatted.evidenceClassification);
```

### Comparison with Legacy

```typescript
import { calculateV4Exposures, compareV4WithLegacy } from '@/services/v4Integration';
import { ENHANCED_COMPANY_EXPOSURES } from '@/data/enhancedCompanyExposures';

const results = await calculateV4Exposures('AAPL');
const company = ENHANCED_COMPANY_EXPOSURES['AAPL'];

const comparison = compareV4WithLegacy(
  'AAPL',
  results.revenue,
  company.exposures
);

console.log('Differences:', comparison.differences);
console.log('Summary:', comparison.summary);
```

## Testing

Run the complete test suite:

```typescript
import { runAllV4Tests } from '@/services/v4/testV4Implementation';

const results = await runAllV4Tests();
console.log('Overall success:', results.overallSuccess);
```

## Key Fixes Implemented

### Apple (AAPL)
- **Before:** "Americas" treated as "United States" (incorrect)
- **After:** "Americas" detected as GEO_LABEL → membership resolved → SSF within [US, Canada, Mexico, Brazil, ...]

### Tesla (TSLA)
- **Before:** PP&E table not detected, all marked as SSF (incorrect)
- **After:** PP&E table detected → direct evidence for US (85%), China (10%) → RF-D for "Other" (5%)

## Migration Status

- **Enhanced:** AAPL, TSLA (2 companies)
- **Pending:** MSFT and others (demonstrates backward compatibility)
- **Total:** 3 companies in database

## Backward Compatibility

All existing code continues to work:
- Legacy `exposures` field always available
- New V.4 fields are optional
- Helper functions provide fallback to legacy data
- MSFT example shows legacy format still works

## Next Steps

1. Enhance more companies with V.4 metadata
2. Create automated extraction tools for SEC filings
3. Add more sophisticated plausibility sets
4. Expand test coverage
5. Performance optimization

## References

- V.4 Pseudocode: `/workspace/V4_PSEUDOCODE_REFERENCE.txt`
- Type Definitions: `@/types/v4Types.ts`
- Enhanced Database: `@/data/enhancedCompanyExposures.ts`