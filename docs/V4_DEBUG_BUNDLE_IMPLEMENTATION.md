# V.4 Debug Bundle Implementation

## Overview

The V.4 Debug Bundle system provides comprehensive diagnostic output for COGRI calculations, enabling detailed analysis of the allocation logic, evidence processing, and decision-making at each step.

## Architecture

### Core Components

1. **Type Definitions** (`src/services/v4/types/debugBundle.types.ts`)
   - Complete type system for all debug bundle sections
   - 6 main sections: Engine Metadata, Step-0 Evidence, Step-1 Decision Trace, Integrity Checks, UI Mapping Audit, Revenue-Specific Debug

2. **Debug Bundle Generator** (`src/services/v4/debugBundleGenerator.ts`)
   - Run ID generation
   - Engine version tracking
   - Inputs hash calculation
   - Bundle initialization and validation
   - Browser-compatible file output (sessionStorage + download)

3. **Evidence Capture** (`src/services/v4/evidenceCapture.ts`)
   - Table detection from structured items
   - Structured evidence formatting
   - Narrative extraction (countries, geo labels, definitions)
   - Supplementary hints capture
   - PP&E table analysis for Assets channel

4. **Decision Trace** (`src/services/v4/decisionTrace.ts`)
   - Closed label trace creation
   - RF case trace creation
   - Direct country lock tracking
   - Allocation output formatting
   - Branching analysis

5. **Integrity Checks** (`src/services/v4/integrityChecks.ts`)
   - Double-counting detection
   - Provenance tracking (country-to-source mapping)
   - Pre/post normalization validation
   - Merge operations with provenance

6. **UI Mapping Audit** (`src/services/v4/uiMappingAudit.ts`)
   - Raw computation vs UI display comparison
   - Mismatch detection (labels, fallbacks, weights)
   - Consistency validation

7. **Revenue-Specific Debug** (`src/services/v4/revenueSpecificDebug.ts`)
   - Per-label allocation details
   - Per-country provenance for revenue segments
   - Double-counting detection for revenue
   - Segment validation

8. **V.4 Orchestrator with Debug** (`src/services/v4/v4OrchestratorWithDebug.ts`)
   - Wraps core V.4 orchestrator
   - Builds complete debug bundles
   - Integrates all debug components

9. **Integration Layer** (`src/services/v4Integration.ts`)
   - Backward-compatible interface
   - Optional debug output
   - Batch debug bundle generation

10. **Generation Script** (`src/services/v4/generateDebugBundles.ts`)
    - Batch processing for multiple tickers
    - Summary reporting
    - Error handling

## Debug Bundle Structure

### Section 1: Engine + Cache Proof

```json
{
  "engineMetadata": {
    "engine_version": "2026-01-01_v4_debug_bundle",
    "run_id": "1735660800000_abc123",
    "cache_hit": false,
    "cache_key": "v4_AAPL_REVENUE_abc123def456",
    "inputs_hash": "abc123def456",
    "config_snapshot": {
      "channel": "REVENUE",
      "useV4Orchestrator": true,
      "channelSpecificRouting": {},
      "featureFlags": {}
    },
    "timestamp": "2026-01-01T00:00:00.000Z",
    "ticker": "AAPL",
    "channel": "REVENUE"
  }
}
```

### Section 2: Step-0 Evidence Bundle

```json
{
  "step0Evidence": {
    "channel": "REVENUE",
    "structuredEvidence": {
      "detected_tables": [
        {
          "table_id": "table_1",
          "section_name": "Revenue by Geographic Segment",
          "header_text": "Net Sales by Geographic Segment",
          "row_count": 5
        }
      ],
      "structuredItems": [
        {
          "rawLabel": "Americas",
          "canonicalLabel": "Americas",
          "entityKind": "GEO_LABEL",
          "value": 0.42,
          "unit": "pct",
          "isTotalRow": false,
          "sourceRef": "10-K Revenue Table"
        }
      ]
    },
    "narrativeExtraction": {
      "namedCountries": ["United States", "China", "Japan"],
      "geoLabels": ["Americas", "Europe", "Greater China"],
      "nonStandardLabels": ["Rest of Asia Pacific"],
      "definitions": [
        {
          "label": "Greater China",
          "includes": ["China", "Hong Kong", "Taiwan"],
          "excludes": [],
          "residualOf": null,
          "confidence": 0.95,
          "sourceRef": "Footnote 2"
        }
      ]
    },
    "supplementaryHints": {
      "namedCountries": [],
      "geoLabels": [],
      "nonStandardLabels": [],
      "source": "Supplementary membership analysis"
    }
  }
}
```

### Section 3: Step-1 Decision Trace

```json
{
  "step1DecisionTrace": {
    "unitMode": "pct",
    "totalRowValue": 1.0,
    "closedLabels": [
      {
        "label": "Americas",
        "labelTotalWeight": 0.42,
        "membershipResolution": {
          "resolvable": true,
          "members": ["United States", "Canada", "Mexico", "Brazil"],
          "resolution_source": "narrative_definition"
        },
        "fallbackChosen": "SSF",
        "allocationOutputTop10": [
          {
            "country": "United States",
            "weight": 0.35,
            "percentage": 35.0
          },
          {
            "country": "Canada",
            "weight": 0.04,
            "percentage": 4.0
          }
        ],
        "exclusionsApplied": []
      }
    ],
    "directCountriesLocked": []
  }
}
```

### Section 4: Merge + Double-Counting Checks

```json
{
  "integrityChecks": {
    "preNormalizeSum": 1.0,
    "postNormalizeSum": 1.0,
    "countryContributionsBySource": [
      {
        "country": "United States",
        "totalWeight": 0.35,
        "sources": [
          {
            "label": "Americas",
            "weight": 0.35,
            "mechanism": "SSF"
          }
        ]
      }
    ],
    "doubleCountingDetected": false,
    "doubleCountingDetails": []
  }
}
```

### Section 5: UI Mapping Audit

```json
{
  "uiMappingAudit": {
    "rawStep1InternalTrace": {
      "directAlloc": {},
      "labelAllocations": [
        {
          "label": "Americas",
          "mechanism": "SSF",
          "members": ["United States", "Canada", "Mexico", "Brazil"],
          "exclusions": [],
          "outputWeights": {
            "United States": 0.35,
            "Canada": 0.04
          }
        }
      ],
      "finalWeights": {
        "United States": 0.35,
        "China": 0.20
      },
      "stepLog": [
        "STEP0: evidence extracted",
        "STEP1: direct country-level structured evidence allocated",
        "STEP2: closed allocatable label totals detected"
      ]
    },
    "formattedUIPayload": {
      "channelBreakdown": {},
      "displayLabels": ["Americas", "Europe", "Greater China"],
      "fallbackSummary": "SSF"
    },
    "mismatches": []
  }
}
```

### Section 6: Revenue-Specific Requirements

```json
{
  "revenueSpecific": {
    "labelAllocations": [
      {
        "segmentLabel": "Americas",
        "membershipSet": ["United States", "Canada", "Mexico", "Brazil"],
        "exclusions": [],
        "fallbackUsed": "SSF",
        "outputWeights": {
          "United States": 0.35,
          "Canada": 0.04
        }
      }
    ],
    "perCountryProvenance": [
      {
        "country": "United States",
        "contributingLabels": ["Americas"],
        "totalWeight": 0.35,
        "breakdown": {
          "Americas": 0.35
        }
      }
    ]
  }
}
```

## Usage

### Generating Debug Bundles

#### For a Single Company

```typescript
import { generateDebugBundles } from '@/services/v4Integration';

// Generate debug bundles for AAPL
const result = await generateDebugBundles('AAPL', '/workspace/shadcn-ui/debug_output');

console.log(`Success: ${result.success}`);
console.log(`Debug bundles: ${result.debugBundlePaths.join(', ')}`);
```

#### For Multiple Companies

```typescript
import { generateDebugBundlesForTickers } from '@/services/v4/generateDebugBundles';

// Generate debug bundles for AAPL, MSFT, TSLA
const result = await generateDebugBundlesForTickers(
  ['AAPL', 'MSFT', 'TSLA'],
  '/workspace/shadcn-ui/debug_output'
);

console.log(`Total Success: ${result.summary.totalSuccess}`);
console.log(`Total Bundles: ${result.summary.totalBundles}`);
```

#### Programmatic Usage

```typescript
import { calculateV4Exposures } from '@/services/v4Integration';
import { DebugBundleOptions } from '@/services/v4/types/debugBundle.types';

const debugOptions: DebugBundleOptions = {
  enableDebug: true,
  cache_bust: true,
  outputPath: '/workspace/shadcn-ui/debug_output'
};

const result = await calculateV4Exposures('AAPL', debugOptions);

// Access results
console.log('Revenue weights:', result.revenue);
console.log('Debug bundles:', result.debugBundlePaths);
```

## Output Files

Debug bundles are generated with the following naming convention:

```
step1_v4_debug_bundle_<TICKER>_<CHANNEL>_<RUN_ID>.json
```

Examples:
- `step1_v4_debug_bundle_AAPL_revenue_1735660800000_abc123.json`
- `step1_v4_debug_bundle_AAPL_supply_1735660800000_abc123.json`
- `step1_v4_debug_bundle_AAPL_assets_1735660800000_abc123.json`
- `step1_v4_debug_bundle_AAPL_financial_1735660800000_abc123.json`

## Browser Compatibility

The debug bundle system is fully browser-compatible:

1. **File Output**: Debug bundles are stored in `sessionStorage` and automatically downloaded as JSON files
2. **No Node.js Dependencies**: All operations use browser-native APIs
3. **Hash Generation**: Uses a simple hash function instead of crypto module
4. **Storage**: Uses sessionStorage for temporary storage

## Validation

Each debug bundle is validated for completeness:

```typescript
import { validateDebugBundle } from '@/services/v4/debugBundleGenerator';

const validation = validateDebugBundle(bundle, Channel.REVENUE);

if (!validation.isValid) {
  console.warn('Missing fields:', validation.missingFields);
}
```

## Key Features

1. **Comprehensive Evidence Tracking**: Captures all structured and narrative evidence
2. **Decision Logic Transparency**: Shows exactly which allocation method was chosen and why
3. **Double-Counting Detection**: Identifies countries that appear in multiple labels
4. **Provenance Tracking**: Maps each country to its source labels and mechanisms
5. **UI Consistency Validation**: Ensures UI display matches internal computation
6. **Revenue-Specific Details**: Provides per-segment allocation breakdown for revenue channel

## Integration with Existing System

The debug bundle system integrates seamlessly with the existing V.4 orchestrator:

- **Backward Compatible**: Can be enabled/disabled via options
- **Zero Performance Impact**: When disabled, no overhead
- **Flexible Output**: Supports both console logging and file download
- **Validation Built-in**: Automatic completeness checking

## Future Enhancements

1. **Server-Side Generation**: Add Node.js-specific version for server-side file writing
2. **Visualization Tools**: Build UI components to visualize debug bundles
3. **Comparison Tools**: Compare debug bundles across different runs
4. **Export Formats**: Support CSV, Excel, and other formats
5. **Real-time Monitoring**: Stream debug output during calculation

## Support

For questions or issues with the debug bundle system, refer to:
- Type definitions: `src/services/v4/types/debugBundle.types.ts`
- Main orchestrator: `src/services/v4/v4OrchestratorWithDebug.ts`
- Integration layer: `src/services/v4Integration.ts`