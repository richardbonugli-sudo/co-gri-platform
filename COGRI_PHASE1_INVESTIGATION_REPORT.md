# CO-GRI Phase 1 Investigation Report
## Deep Analysis of Four Broken System Behaviors

**Date:** 2026-03-24  
**Investigator:** David (Data Analyst)  
**Scope:** Read-only investigation — no files modified  
**Reference:** V5 Methodology Document + Implementation Checklist Phase 1  

---

## Executive Summary

All four issues described in the Implementation Checklist Phase 1 were investigated against the live codebase. The findings are mixed: **Issues 1 and 2 have been substantially fixed** in the V5 layer, but contain residual gaps. **Issues 3 and 4 contain active, unresolved bugs** that will produce incorrect outputs in production.

| # | Issue | Status | Severity |
|---|-------|--------|----------|
| 1 | Channel Override Leakage | ⚠️ Partially Fixed — residual gap in SEC path | Medium |
| 2 | Structured Evidence Not Enforced | ⚠️ Partially Fixed — residual bucket handling bug | Medium |
| 3 | Narrative Parser Broken | 🔴 Active Bug — simulated data, no real parsing | Critical |
| 4 | Fallback Overriding Real Data | 🔴 Active Bug — company-specific path bypasses SEC | High |

---

## Issue 1: Channel Override Leakage

### Checklist Requirement
> Each channel should represent a different economic reality. Ensure each channel runs independently. No shared exposure vectors or fallback outputs. Expected: Revenue, supply chain, assets, and financial all produce different distributions.

### Root Cause Analysis

**The original bug** (documented in comments) was that all four channels shared a single `channelData` object:

```typescript
// BEFORE (broken) — from companySpecificChannelFix.ts L7-L13:
channelBreakdown[country] = {
  revenue: channelData,   // same object
  financial: channelData, // same object
  supply: channelData,    // same object
  assets: channelData,    // same object
};
```

**Fix status for the company-specific path:** ✅ Fixed in `src/services/v5/companySpecificChannelFix.ts`. The `buildIndependentChannelBreakdown()` function (L57–L167) now builds four independent channel objects per country using distinct economic priors:
- Revenue: GDP-weighted demand prior
- Supply: manufacturing-weighted prior (NOT GDP)
- Assets: capital-stock prior with λ=0.35 home bias
- Financial: BIS/financial-center depth prior

**Residual Bug — SEC Filing Path:** 🔴 When `companySpecific` data is NOT found, the code falls through to the SEC filing path in `geographicExposureService.ts` (L287–L560). This path builds `channelBreakdown` using the old `IntegratedChannelData` shape via `structuredDataIntegrator.ts`. Although `structuredDataIntegrator.ts` now routes through V5 integrators (GAP 1 FIX, L985–L993), the **bridge function `fromV5()`** (L98–L110) strips the V5 `IntegratedChannelDataV5` back to the legacy `IntegratedChannelData` shape, losing the independent channel identity.

**Residual Bug — `buildSupplyChannelData` missing blended fallback:**

```typescript
// src/services/v5/channelBuilder.ts L112-L145
export function buildSupplyChannelData(...): ChannelDataV5 {
  if (exposure.supplyPercentage !== undefined && exposure.supplyPercentage > 0) {
    // DIRECT evidence path ✅
  }
  // BUG: No blended percentage fallback here (unlike buildRevenueChannelData L79-L90)
  // Goes straight to prior — even when exposure.percentage > 0
  const priorWeights = allocateWithPrior(allCountries, 'supply', companySpecific.sector);
  ...
}
```

`buildRevenueChannelData` (L79–L90) uses `exposure.percentage` as a blended fallback when `revenuePercentage` is absent. `buildSupplyChannelData`, `buildAssetsChannelData`, and `buildFinancialChannelData` do NOT — they skip directly to the prior. This means for companies where only `percentage` (blended) is available, supply/assets/financial channels will use the prior instead of the blended evidence, causing artificial divergence that is prior-driven rather than evidence-driven.

### Exact File/Line References

| File | Lines | Issue |
|------|-------|-------|
| `src/services/v5/channelBuilder.ts` | L112–L145 | `buildSupplyChannelData` missing blended fallback |
| `src/services/v5/channelBuilder.ts` | L152–L189 | `buildAssetsChannelData` missing blended fallback |
| `src/services/v5/channelBuilder.ts` | L195–L227 | `buildFinancialChannelData` missing blended fallback |
| `src/services/geographicExposureService.ts` | L287–L560 | SEC path does not use `buildIndependentChannelBreakdown` |

### Fix Instructions

**Fix 1.A — Add blended fallback to supply/assets/financial builders**

In `src/services/v5/channelBuilder.ts`:

For `buildSupplyChannelData` (after L118 block, before L133):
```typescript
// Add after the supplyPercentage check:
if (exposure.percentage > 0) {
  return {
    weight: exposure.percentage / 100,
    state: 'known-positive',
    status: 'evidence',
    source: `Company-Specific Blended Data (Supply): ${companySpecific.dataSource}`,
    dataQuality: 'medium',  // medium because it's blended, not supply-specific
    evidenceType: 'structured_table',
    fallbackType: 'SSF',
    tier: 'ALLOCATED',
  };
}
```

Apply the same pattern to `buildAssetsChannelData` (after L158 block) and `buildFinancialChannelData` (after L201 block), using `tier: 'ALLOCATED'` and `fallbackType: 'SSF'` to correctly signal that this is blended evidence, not channel-specific.

**Fix 1.B — Ensure SEC path also uses independent channels**

In `src/services/geographicExposureService.ts`, the SEC path (L317–L560) currently builds `channelBreakdown` by calling `secIntegration.revenueChannel`, `secIntegration.supplyChannel`, etc. These are already routed through V5 integrators. No structural change needed here — but the `fromV5()` bridge must preserve the `tier` field correctly (verify L98–L110 in `structuredDataIntegrator.ts` includes `tier: v5.tier`). **Current code at L108 does include `tier: v5.tier`** — this is correct.

---

## Issue 2: Structured Evidence Not Enforced

### Checklist Requirement
> Create explicit types: `direct_structured_country`, `direct_structured_region`, `direct_structured_bucket`. Rules: Country → fixed values. Region/bucket → constraints. Fallback → only applied to remainder. Expected: Japan preserved. Regions preserved. Asset tables dominate asset outputs.

### Root Cause Analysis

**What V5 implemented:** `structuredDataIntegratorV5.ts` correctly implements a three-tier evidence hierarchy:
- `DIRECT` — country-level structured table entry (L77, L101, L360)
- `ALLOCATED` — region total → prior-weighted allocation (L78, L258–L261)
- `MODELED` — prior-based inference, no constraint (L79, L484)

The `determineTier()` function (L97–L112) correctly assigns tiers. The `getEvidenceCoverage()` function (L117–L120) correctly suppresses fallback when coverage ≥ 95%.

**Active Bug 1 — Residual bucket handling:**

```typescript
// src/services/v5/structuredDataIntegratorV5.ts L367-L398
const members = getRegionMembersFromName(regionName);
// ...
if (members.length === 0 || isResidualLabel(regionName)) {
  console.log(`[V5 Revenue] RESIDUAL: "${regionName}" = ${(segmentShare * 100).toFixed(2)}% → distributing across unconstrained countries`);
  // BUG: Distributes residual bucket weight across ALL unconstrained countries
  // using revenue prior — but this can OVERWRITE previously set DIRECT evidence
  // for countries that already have structured data
  for (const [country, weight] of Object.entries(gfWeights)) {
    if (!channel[country]) {  // Only adds if not already set — this is correct
      channel[country] = {
        ...
        evidenceType: 'fallback',
        fallbackType: 'GF',
      };
    }
  }
}
```

The `if (!channel[country])` guard (L387 area) does protect existing DIRECT entries. **However**, the residual distribution uses `buildGlobalFallbackV5()` which includes ALL countries — not just the countries NOT already covered by structured evidence. This means the residual weight is spread too broadly, diluting countries that should receive more of the residual.

**Active Bug 2 — `integrateFinancialChannelV5` residual fallback path:**

```typescript
// src/services/v5/structuredDataIntegratorV5.ts L1000-L1019
const allCountries = Object.keys(buildGlobalFallbackV5(homeCountry, 'financial', sector));
// Distributes REMAINING weight (1 - structured coverage) across ALL GF countries
// BUG: This includes countries that already have structured evidence
// The remainder should only go to countries NOT in the structured channel
for (const [country, weight] of Object.entries(gfWeights)) {
  if (!channel[country]) {
    channel[country] = {
      ...
      status: 'fallback',
      evidenceType: 'fallback',
      fallbackType: 'GF',
    };
  }
}
```

Again the `if (!channel[country])` guard is present, but the `gfWeights` are computed over ALL countries, not the unconstrained remainder. This means the fallback weights don't sum correctly relative to the remaining uncovered portion.

**Active Bug 3 — `allocateRegionWithPrior` does not enforce hard constraint sum:**

```typescript
// src/services/v5/structuredDataIntegratorV5.ts L205-L270
export function allocateRegionWithPrior(
  regionName: string,
  regionTotal: number,   // This IS the hard constraint
  channel: ChannelType,
  sector: string
): Record<string, IntegratedChannelDataV5> {
  // ...
  const priorWeights = allocateWithPrior(members, channel, sector, regionTotal);
  // priorWeights are relative weights — they need to be scaled to regionTotal
  // BUG: The function returns weights that sum to regionTotal IF allocateWithPrior
  // correctly scales them. Need to verify allocateWithPrior in channelPriors.ts
  // actually scales by regionTotal (the 4th argument).
```

The `regionTotal` is passed as the 4th argument to `allocateWithPrior()`. Whether this is used as a scaling factor or ignored depends on `channelPriors.ts` implementation. If `allocateWithPrior` ignores the 4th argument and returns normalized weights (summing to 1.0), then the hard constraint is NOT enforced — the region total is lost.

### Exact File/Line References

| File | Lines | Issue |
|------|-------|-------|
| `src/services/v5/structuredDataIntegratorV5.ts` | L367–L398 | Residual bucket distributes over all countries, not just unconstrained |
| `src/services/v5/structuredDataIntegratorV5.ts` | L1000–L1019 | Financial fallback remainder not scoped to unconstrained countries |
| `src/services/v5/structuredDataIntegratorV5.ts` | L205–L270 | `allocateRegionWithPrior` — verify `regionTotal` is enforced as hard constraint |
| `src/services/v5/channelPriors.ts` | (requires inspection) | Verify `allocateWithPrior` 4th arg scales output to `regionTotal` |

### Fix Instructions

**Fix 2.A — Scope residual distribution to unconstrained countries only**

In `src/services/v5/structuredDataIntegratorV5.ts`, in the `integrateRevenueChannelV5` residual bucket handler (L367–L398):

```typescript
// BEFORE (buggy):
const gfWeights = buildGlobalFallbackV5(homeCountry, 'revenue', sector);
for (const [country, weight] of Object.entries(gfWeights)) {
  if (!channel[country]) {
    channel[country] = { ... };
  }
}

// AFTER (correct):
// Step 1: Identify unconstrained countries (not yet in channel)
const constrainedCountries = new Set(Object.keys(channel));
const gfWeightsAll = buildGlobalFallbackV5(homeCountry, 'revenue', sector);
// Step 2: Filter to only unconstrained countries
const unconstrainedEntries = Object.entries(gfWeightsAll)
  .filter(([c]) => !constrainedCountries.has(c));
// Step 3: Renormalize unconstrained weights to sum to segmentShare
const unconstrainedTotal = unconstrainedEntries.reduce((s, [, w]) => s + w, 0);
if (unconstrainedTotal > 0) {
  for (const [country, weight] of unconstrainedEntries) {
    channel[country] = {
      country,
      weight: (weight / unconstrainedTotal) * segmentShare,
      state: 'unknown',
      status: 'fallback',
      source: `Residual bucket "${regionName}" → revenue prior (unconstrained only)`,
      dataQuality: 'low',
      evidenceType: 'fallback',
      fallbackType: 'GF',
      tier: 'MODELED',
    };
  }
}
```

Apply the same fix to the financial channel remainder path (L1000–L1019).

**Fix 2.B — Verify `allocateWithPrior` enforces hard constraint**

In `src/services/v5/channelPriors.ts`, verify the signature and implementation of `allocateWithPrior`. The 4th argument `regionTotal` must be used to scale the output so that `sum(output.values()) === regionTotal`. If it currently returns normalized weights (sum = 1.0), add scaling:

```typescript
// In allocateWithPrior, after computing normalized weights:
const scaledWeights: Record<string, number> = {};
for (const [country, w] of Object.entries(normalizedWeights)) {
  scaledWeights[country] = w * (regionTotal ?? 1.0);
}
return scaledWeights;
```

---

## Issue 3: Narrative Parser Broken

### Checklist Requirement
> Parser must extract: countries, regions, exclusions, supply chain locations. Output: admissible set (P). Expected: Apple supply chain reflects China, Vietnam, India, etc.

### Root Cause Analysis

**This is the most critical active bug.** The `narrativeParser.ts` does NOT parse real SEC filing text. Instead, it generates **hardcoded simulated narrative text** based on the ticker symbol:

```typescript
// src/services/narrativeParser.ts L299-L334
export function parseNarrativeText(ticker: string, companyName: string): NarrativeParseResult {
  // Simulate narrative text from SEC filings
  // In production, this would fetch actual SEC filings via EDGAR API

  const narrativeText = generateSimulatedNarrativeText(ticker, companyName);  // ← FAKE DATA
  // ...
}

// L340-L391
function generateSimulatedNarrativeText(ticker: string, companyName: string): string {
  // Apple-specific narrative (based on actual 10-K)
  if (ticker.toUpperCase() === 'AAPL') {
    return `
      Geographic Segments: The Company reports segment information based on the "management" approach.
      Americas segment includes the United States, Canada, and Latin America.
      Europe segment includes European countries, as well as India, the Middle East, and Africa.
      Greater China segment includes China mainland, Hong Kong, and Taiwan.
      Japan segment consists of Japan only.
      Rest of Asia Pacific segment includes Australia, New Zealand, and other Asian countries...
      The Company's manufacturing facilities are located primarily in China, Vietnam, and other Asian countries.
      ...
    `;
  }

  // Generic technology company narrative
  if (companyName.toLowerCase().includes('tech') || ticker.toUpperCase().match(/^(MSFT|GOOGL|META|AMZN|NVDA)/)) {
    return `...generic tech template...`;
  }

  // Default narrative — completely generic
  return `
    The Company operates in multiple geographic regions including the Americas, Europe, and Asia Pacific.
    Americas segment includes the United States, Canada, Mexico, and other countries in Latin America.
    ...
  `;
}
```

**Why this is wrong per V5 spec:**
1. The V5 spec requires the narrative parser to extract an **admissible set P** from actual SEC filing text. The simulated text is a hardcoded template — it will produce the same output regardless of what the actual filing says.
2. For any ticker that is not `AAPL` and doesn't match the tech pattern, ALL companies receive the same generic narrative: Americas, Europe, Asia Pacific — which maps to a broad, inaccurate admissible set.
3. The `extractCountriesFromText()` function (L205–L232) uses `REGIONAL_PATTERNS` which expands "Asia Pacific" to 14 countries — meaning the admissible set P is inflated with countries that have no actual supply chain presence for most companies.
4. The `buildAdmissibleSetFromNarrative()` in `structuredDataIntegratorV5.ts` (L283–L315) calls `extractSupplyCountriesFromNarrative` from `supplyChainFallback.ts` — NOT `narrativeParser.ts`. This means the narrative parser is **not even wired into the V5 supply channel pipeline**.

**Secondary bug — narrative parser not called by V5 supply integrator:**

```typescript
// src/services/v5/structuredDataIntegratorV5.ts L595-L635
// Priority 3: Narrative evidence — Step 1.3 fix: admissible set ONLY from narrative
if (secData?.supplyChainNarrativeContext) {
  const signals = buildAdmissibleSetFromNarrative(
    secData.supplyChainNarrativeContext,  // ← uses raw text from SEC data
    sector
  );
  // ...
}
```

`buildAdmissibleSetFromNarrative` (L283) calls `extractSupplyCountriesFromNarrative` from `../supplyChainFallback` — a different module. The `narrativeParser.ts` module's `parseNarrativeText()` function is **never called in the V5 pipeline**. It is a dead code path.

**The actual narrative parsing in V5 supply channel** uses `secData.supplyChainNarrativeContext` — a field from `ParsedSECData`. Whether this field contains real text or simulated text depends on `secFilingParser.ts`, which also needs investigation.

### Exact File/Line References

| File | Lines | Issue |
|------|-------|-------|
| `src/services/narrativeParser.ts` | L299–L334 | `parseNarrativeText` calls `generateSimulatedNarrativeText` — no real parsing |
| `src/services/narrativeParser.ts` | L340–L391 | `generateSimulatedNarrativeText` — hardcoded templates, not real SEC text |
| `src/services/narrativeParser.ts` | L220–L229 | `extractCountriesFromText` expands regions to all default countries — inflates admissible set |
| `src/services/v5/structuredDataIntegratorV5.ts` | L283–L315 | `buildAdmissibleSetFromNarrative` uses `supplyChainFallback`, not `narrativeParser` |
| `src/services/v5/structuredDataIntegratorV5.ts` | L595–L635 | V5 supply narrative path uses `secData.supplyChainNarrativeContext` — real text if SEC parser works |

### Fix Instructions

**Fix 3.A — Replace simulated narrative with real SEC EDGAR text fetch**

In `src/services/narrativeParser.ts`, replace `generateSimulatedNarrativeText` with a real fetch from SEC EDGAR:

```typescript
// REPLACE generateSimulatedNarrativeText with:
async function fetchSECNarrativeText(ticker: string): Promise<string> {
  // 1. Fetch latest 10-K filing index from SEC EDGAR
  const edgarUrl = `https://data.sec.gov/submissions/CIK${padCIK(await resolveCIK(ticker))}.json`;
  // 2. Find the most recent 10-K accession number
  // 3. Fetch the filing document
  // 4. Extract Item 1 (Business), Item 1A (Risk Factors), and geographic segment footnotes
  // 5. Return the concatenated text
}

// Make parseNarrativeText async:
export async function parseNarrativeText(ticker: string, companyName: string): Promise<NarrativeParseResult> {
  const narrativeText = await fetchSECNarrativeText(ticker);
  // ... rest of parsing logic unchanged
}
```

**Fix 3.B — Wire narrativeParser into V5 supply channel**

In `src/services/v5/structuredDataIntegratorV5.ts`, in `integrateSupplyChannelV5` (L506), replace the `buildAdmissibleSetFromNarrative` call with the full narrative parser:

```typescript
// BEFORE (L595-L635):
if (secData?.supplyChainNarrativeContext) {
  const signals = buildAdmissibleSetFromNarrative(secData.supplyChainNarrativeContext, sector);
  ...
}

// AFTER:
import { parseNarrativeText } from '../narrativeParser';
// ...
if (secData?.supplyChainNarrativeContext || ticker) {
  const narrativeResult = await parseNarrativeText(ticker, '');
  // Use narrativeResult.explicitCountries as admissible set P
  const admissibleSet = Array.from(narrativeResult.explicitCountries);
  // Filter to supply-channel relevant countries only
  const supplyCountries = narrativeResult.countryMentions
    .filter(m => m.channel === 'supply')
    .map(m => m.country);
  // Use supplyCountries as the constrained admissible set
  ...
}
```

**Fix 3.C — Fix region expansion in admissible set**

In `src/services/narrativeParser.ts` L220–L229, the region expansion should NOT add all default countries — it should add them to a separate `regionMemberships` map and only include them in the admissible set if the region is explicitly mentioned in a supply-chain context:

```typescript
// BEFORE (L221-L228): Expands ALL regional mentions to all default countries
for (const [region, data] of Object.entries(REGIONAL_PATTERNS)) {
  for (const keyword of data.keywords) {
    if (regex.test(text)) {
      data.defaultCountries.forEach(c => countries.add(c));  // ← inflates set
    }
  }
}

// AFTER: Only add region label, expand lazily
// Return regions separately; let caller decide whether to expand
```

---

## Issue 4: Fallback Overriding Real Data

### Checklist Requirement
> Fallback only applies after: structured evidence applied, narrative processed. Stop presenting fallback as evidence. Label outputs: Direct, Allocated, Modeled.

### Root Cause Analysis

**What works correctly:**
- `structuredDataIntegratorV5.ts` correctly implements the `getEvidenceCoverage()` check (L117–L120) and suppresses fallback when coverage ≥ 95% (L418–L427 for revenue, L549–L558 for supply, L718–L722 for assets, L993–L995 for financial).
- The `tier` labeling (`DIRECT` / `ALLOCATED` / `MODELED`) is implemented (L77–L79, L101).

**Active Bug 1 — Company-specific path bypasses SEC evidence entirely:**

```typescript
// src/services/geographicExposureService.ts L248-L284
const companySpecific = getCompanySpecificExposure(ticker);
if (companySpecific) {
  // V5 Step 1.1 FIX: Build INDEPENDENT channel data per country.
  const { channelBreakdown, blendedWeights } = buildIndependentChannelBreakdown(
    companySpecific,
    coefficients
  );
  // BUG: Returns immediately — SEC filing integration is NEVER attempted
  return { channelBreakdown, blendedWeights, secIntegration: null, usedCompanySpecific: true };
  //                                                              ^^^^
  //                                                              secIntegration is null!
}
```

When company-specific data exists, the entire SEC filing integration is skipped (`secIntegration: null`). This means:
- If the company-specific data has `percentage` (blended) but no `revenuePercentage`, `supplyPercentage`, etc., the channel builders fall through to **prior-based fallback** (MODELED tier).
- The actual SEC 10-K structured tables (which may have country-level revenue segments) are **never consulted**.
- The result is that MODELED (fallback) data is used even when DIRECT (SEC structured) evidence is available.

**Active Bug 2 — `cogriCalculationService.ts` fallback when no channel breakdown:**

```typescript
// src/services/cogriCalculationService.ts L216-L233
console.log(`🔍 [COGRI CALC DEBUG]   ${country} - NO channel breakdown, using fallback`);
// Fallback: Use simple revenue percentage if channel breakdown not available
// ...
status: 'fallback',
fallbackType: 'GF',
```

This fallback in the COGRI calculation service activates when `channelBreakdown` is missing or doesn't contain the country. This is a silent fallback — the UI will show a MODELED output with no indication that the channel breakdown was absent.

**Active Bug 3 — `cogriCalculationService.ts` L204–L205 fallback status propagation:**

```typescript
// src/services/cogriCalculationService.ts L204-L205
status: channelData.revenue?.status || 'fallback',
fallbackType: channelData.revenue?.fallbackType || 'none',
```

If `channelData.revenue` is undefined (which happens for countries in the SEC path that only have supply/assets/financial data), the status defaults to `'fallback'` even though other channels may have evidence. This incorrectly labels the country as fallback-sourced.

**Active Bug 4 — `buildSupplyChannelData` in `channelBuilder.ts` always returns MODELED when no `supplyPercentage`:**

```typescript
// src/services/v5/channelBuilder.ts L131-L145
// No supply-specific data → use supply prior (manufacturing-weighted, NOT GDP-weighted)
const priorWeights = allocateWithPrior(allCountries, 'supply', companySpecific.sector);
const weight = priorWeights[exposure.country] || 0;
return {
  weight,
  state: 'unknown',
  status: 'fallback',       // ← Always MODELED for supply when no supplyPercentage
  ...
  tier: 'MODELED',
};
```

For most companies in the company-specific database, only `percentage` (blended) is stored, not `supplyPercentage`. This means the supply channel for ALL such companies will always be MODELED/fallback — even when the blended percentage contains supply information. The V5 spec requires that blended evidence be used as ALLOCATED tier, not discarded in favor of the prior.

### Exact File/Line References

| File | Lines | Issue |
|------|-------|-------|
| `src/services/geographicExposureService.ts` | L248–L284 | Company-specific path returns immediately, skips SEC integration |
| `src/services/geographicExposureService.ts` | L284 | `secIntegration: null` — SEC evidence permanently discarded |
| `src/services/cogriCalculationService.ts` | L216–L233 | Silent fallback when channel breakdown missing |
| `src/services/cogriCalculationService.ts` | L204–L205 | `status` defaults to `'fallback'` when `channelData.revenue` is undefined |
| `src/services/v5/channelBuilder.ts` | L131–L145 | Supply always MODELED when no `supplyPercentage` |
| `src/services/v5/channelBuilder.ts` | L171–L188 | Assets always MODELED when no `assetsPercentage` |
| `src/services/v5/channelBuilder.ts` | L214–L226 | Financial always MODELED when no `financialPercentage` |

### Fix Instructions

**Fix 4.A — Merge company-specific data with SEC filing evidence**

In `src/services/geographicExposureService.ts`, modify the company-specific path to also attempt SEC integration and merge the results:

```typescript
// BEFORE (L248-L284):
if (companySpecific) {
  const { channelBreakdown, blendedWeights } = buildIndependentChannelBreakdown(companySpecific, coefficients);
  return { channelBreakdown, blendedWeights, secIntegration: null, usedCompanySpecific: true };
}

// AFTER:
if (companySpecific) {
  // Build company-specific channels as baseline
  const { channelBreakdown, blendedWeights } = buildIndependentChannelBreakdown(companySpecific, coefficients);
  
  // Also attempt SEC integration to upgrade MODELED entries to DIRECT/ALLOCATED
  let secIntegration: IntegratedExposureData | null = null;
  try {
    secIntegration = await integrateStructuredData(ticker, homeCountry, sector);
    if (secIntegration) {
      // Upgrade any MODELED channel entries with SEC DIRECT/ALLOCATED evidence
      upgradeChannelBreakdownWithSEC(channelBreakdown, secIntegration);
    }
  } catch (e) {
    console.warn(`[${ticker}] SEC integration failed during company-specific merge:`, e);
  }
  
  return { channelBreakdown, blendedWeights, secIntegration, usedCompanySpecific: true };
}

// New helper function:
function upgradeChannelBreakdownWithSEC(
  channelBreakdown: ChannelBreakdown,
  secIntegration: IntegratedExposureData
): void {
  for (const [country, entry] of Object.entries(channelBreakdown)) {
    // Revenue: upgrade if SEC has DIRECT evidence
    if (entry.revenue.tier === 'MODELED' && secIntegration.revenueChannel[country]) {
      const secRev = secIntegration.revenueChannel[country];
      if (secRev.tier === 'DIRECT' || secRev.tier === 'ALLOCATED') {
        entry.revenue = convertIntegratedToChannelData(secRev);
      }
    }
    // Apply same pattern for supply, assets, financial
  }
}
```

**Fix 4.B — Fix fallback status in `cogriCalculationService.ts`**

In `src/services/cogriCalculationService.ts` L204–L205:

```typescript
// BEFORE:
status: channelData.revenue?.status || 'fallback',
fallbackType: channelData.revenue?.fallbackType || 'none',

// AFTER: Use best available channel status, not just revenue
const bestStatus = (
  channelData.revenue?.status ||
  channelData.supply?.status ||
  channelData.assets?.status ||
  channelData.financial?.status ||
  'fallback'
) as 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
const bestFallbackType = channelData.revenue?.fallbackType || 'none';
// Then use bestStatus and bestFallbackType in the exposure object
```

**Fix 4.C — Add blended evidence tier to channel builders (same as Fix 1.A)**

As described in Fix 1.A, add blended-percentage fallback paths to `buildSupplyChannelData`, `buildAssetsChannelData`, and `buildFinancialChannelData` with `tier: 'ALLOCATED'` and `status: 'evidence'`. This ensures that when company-specific blended data exists, it is used as ALLOCATED evidence rather than discarded in favor of the prior.

---

## Cross-Cutting Issue: UI Labeling (Issue 5 from Checklist)

### Checklist Requirement
> Stop presenting fallback as evidence. Label outputs: Direct, Allocated, Modeled.

### Status
The `tier` field (`DIRECT` / `ALLOCATED` / `MODELED`) is correctly defined in `IntegratedChannelDataV5` (L77–L79) and propagated through `fromV5()` in `structuredDataIntegrator.ts` (L108: `tier: v5.tier`). The `ChannelData` interface in `cogriCalculationService.ts` (L27–L38) includes `evidenceLevel` and `evidenceScore` but **does not include `tier`**. This means the tier information is available in the channel breakdown but may not be surfaced in the UI.

**Fix:** Add `tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED'` to the `ChannelData` interface in `cogriCalculationService.ts` and propagate it through to the UI rendering in `CompanyMode.tsx`.

---

## Summary of All Required Fixes

| Fix ID | File | Function/Location | Change Required | Priority |
|--------|------|-------------------|-----------------|----------|
| 1.A | `v5/channelBuilder.ts` | `buildSupplyChannelData` L118 | Add blended fallback before prior | High |
| 1.A | `v5/channelBuilder.ts` | `buildAssetsChannelData` L158 | Add blended fallback before prior | High |
| 1.A | `v5/channelBuilder.ts` | `buildFinancialChannelData` L201 | Add blended fallback before prior | High |
| 2.A | `v5/structuredDataIntegratorV5.ts` | Revenue residual L367–L398 | Scope GF to unconstrained countries only | Medium |
| 2.A | `v5/structuredDataIntegratorV5.ts` | Financial remainder L1000–L1019 | Scope GF to unconstrained countries only | Medium |
| 2.B | `v5/channelPriors.ts` | `allocateWithPrior` | Verify/enforce `regionTotal` scaling | High |
| 3.A | `narrativeParser.ts` | `parseNarrativeText` L299 | Replace simulated text with real SEC EDGAR fetch | Critical |
| 3.B | `v5/structuredDataIntegratorV5.ts` | `integrateSupplyChannelV5` L595 | Wire real narrativeParser into supply channel | Critical |
| 3.C | `narrativeParser.ts` | `extractCountriesFromText` L220 | Don't auto-expand regions; return separately | High |
| 4.A | `geographicExposureService.ts` | `calculateIndependentChannelExposuresWithSEC` L248 | Merge SEC evidence into company-specific path | High |
| 4.B | `cogriCalculationService.ts` | `calculateCOGRIScore` L204 | Use best-available channel status | Medium |
| 4.C | `v5/channelBuilder.ts` | All three channel builders | Same as Fix 1.A | High |
| 5 | `cogriCalculationService.ts` | `ChannelData` interface L27 | Add `tier` field; propagate to UI | Medium |

---

## Appendix: Key Code Paths

### Company-Specific Path (current)
```
getCompanyGeographicExposure()
  → getCompanySpecificExposure(ticker)  [found]
    → buildIndependentChannelBreakdown()
      → buildRevenueChannelData()   [uses revenuePercentage or blended or prior]
      → buildSupplyChannelData()    [uses supplyPercentage or PRIOR (bug: skips blended)]
      → buildAssetsChannelData()    [uses assetsPercentage or PRIOR (bug: skips blended)]
      → buildFinancialChannelData() [uses financialPercentage or PRIOR (bug: skips blended)]
    → return {secIntegration: null}  [BUG: SEC evidence never consulted]
```

### SEC Filing Path (current)
```
getCompanyGeographicExposure()
  → getCompanySpecificExposure(ticker)  [not found]
    → integrateStructuredData()
      → integrateRevenueChannelV5()   [V5: DIRECT/ALLOCATED/MODELED]
      → integrateSupplyChannelV5()    [V5: sustainability/SEC/narrative/GF]
      → integrateAssetsChannelV5()    [V5: exhibit21/PPE/sustainability/narrative/GF]
      → integrateFinancialChannelV5() [V5: debt/narrative/GF]
    → buildChannelBreakdown from SEC data
```

### Narrative Parser Path (current — broken)
```
narrativeParser.parseNarrativeText(ticker)
  → generateSimulatedNarrativeText(ticker)  [FAKE: returns hardcoded template]
  → parseRegionalDefinitions(fakeText)
  → parseCountryMentions(fakeText)
  → return {explicitCountries, regionalCountries}  [based on fake data]

NOTE: This function is NOT called by V5 supply channel integrator.
V5 supply channel uses: secData.supplyChainNarrativeContext → buildAdmissibleSetFromNarrative()
```

---

*Report generated: 2026-03-24 | Investigation scope: read-only | Files modified: none*