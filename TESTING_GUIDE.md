# Phase 3.0 Testing Guide - Step 1 Exposure Calculation & Fallback Logic

## Testing Objectives

Verify that the updated Step 1 exposure calculation correctly:
1. **Parses narrative text** from SEC filings to extract regional definitions
2. **Expands regional aggregates** into individual countries with proper evidence assignment
3. **Applies channel-specific fallbacks** only to unknown/missing data
4. **Preserves evidence** and never overwrites known zeros or known positives
5. **Distinguishes** between known-zero, known-positive, and unknown states

## How to Test

### Access the Application
1. Open your browser to: http://localhost:5174/
2. Navigate to the "Assess a Company or Ticker" page
3. Open browser DevTools (F12) and go to the Console tab

### Test Companies

Test the following companies to verify different scenarios:

#### Test 1: Apple Inc. (AAPL) - Regional Aggregate Expansion
**Expected Behavior:**
- Narrative parser extracts: "Europe includes European countries, India, Middle East, and Africa"
- "Europe 25%" expands into ~25 countries
- All European countries marked as **evidence** (not fallback)
- Fallback only applied to countries with no evidence

**Console Logs to Check:**
```
[Narrative Parser] AAPL: Found X regional definitions
[Regional Expansion] Using narrative definition for Europe: Germany, UK, France, ...
[AAPL] === REVENUE CHANNEL CALCULATION ===
  Evidence Countries: United States, China, Germany, UK, France, ... (all expanded countries)
[AAPL] Revenue Channel Fallback Decision:
  Evidence Weight: ~100%
  Decision: No fallback needed (evidence covers 99%+)
```

**What to Verify:**
- ✅ Regional expansion happens correctly
- ✅ All countries in "Europe" region have status='evidence'
- ✅ No fallback applied to European countries
- ✅ Total evidence weight should be close to 100%

#### Test 2: Microsoft (MSFT) - Generic Tech Company
**Expected Behavior:**
- Uses generic tech company narrative template
- Standard regional mappings (Americas, Europe, Asia Pacific)
- Channel-specific fallbacks for unknown countries

**Console Logs to Check:**
```
[MSFT] === REVENUE CHANNEL CALCULATION ===
  Evidence Countries: United States, Canada, ...
[MSFT] Revenue Channel Fallback Decision:
  Evidence Weight: X%
  Unknown Portion: Y%
  Decision: Applying sector template fallback to N countries
```

**What to Verify:**
- ✅ Fallback only applies to countries without evidence
- ✅ Known zeros remain zero
- ✅ Evidence countries not overwritten

#### Test 3: Tesla (TSLA) - Manufacturing Sector
**Expected Behavior:**
- Manufacturing sector coefficients: Revenue=0.30, Supply=0.45, Assets=0.20, Financial=0.05
- Supply channel gets higher weight
- Different fallback patterns for manufacturing

**Console Logs to Check:**
```
[TSLA] Coefficients: Revenue=0.30, Supply=0.45, Assets=0.20, Financial=0.05
[TSLA] Supply Channel Fallback Decision:
  Decision: Applying COMTRADE + OECD ICIO + Assembly Shares fallback
```

**What to Verify:**
- ✅ Correct sector coefficients applied
- ✅ Manufacturing-specific supply fallback pattern used
- ✅ China, Germany, Mexico prominent in supply channel

#### Test 4: JPMorgan Chase (JPM) - Financial Services
**Expected Behavior:**
- Financial Services coefficients: Revenue=0.40, Supply=0.05, Assets=0.15, Financial=0.40
- Financial channel gets highest weight
- Currency-based fallback for financial channel

**Console Logs to Check:**
```
[JPM] Coefficients: Revenue=0.40, Supply=0.05, Assets=0.15, Financial=0.40
[JPM] Financial Channel Fallback Decision:
  Decision: Applying currency decomposition proxies (CPIS/BIS priors)
```

**What to Verify:**
- ✅ Financial channel has highest coefficient (0.40)
- ✅ Currency-based fallback applied
- ✅ USD, EUR, GBP, JPY countries prominent

#### Test 5: ExxonMobil (XOM) - Energy Sector
**Expected Behavior:**
- Energy sector coefficients: Revenue=0.35, Supply=0.30, Assets=0.30, Financial=0.05
- Assets channel gets significant weight (0.30)
- GDP-weighted fallback for assets

**Console Logs to Check:**
```
[XOM] Coefficients: Revenue=0.35, Supply=0.30, Assets=0.30, Financial=0.05
[XOM] Assets Channel Fallback Decision:
  Decision: Applying GDP-weighted asset priors (asset intensity: 2.50)
```

**What to Verify:**
- ✅ High asset intensity (2.5 for Energy sector)
- ✅ GDP-weighted fallback applied
- ✅ Large economies prominent in assets channel

## Key Validation Points

### 1. Evidence Preservation
**Check:** Evidence countries should NEVER receive fallback
```
Evidence Countries: [list of countries]
Known-Zero Countries: [list of countries]
Decision: No fallback needed (evidence covers 99%+)
OR
Decision: Applying [fallback type] to N countries (excluding evidence)
```

### 2. Channel-Specific Fallbacks
**Revenue Channel:**
- Fallback: Sector template
- Source: "Sector Template (Revenue Fallback)"

**Supply Channel:**
- Fallback: COMTRADE + OECD ICIO + Assembly Shares
- Source: "COMTRADE + OECD ICIO + Assembly Shares (Supply Fallback)"

**Assets Channel:**
- Fallback: GDP-weighted priors
- Source: "GDP-weighted Priors (GDP × [intensity] asset intensity)"

**Financial Channel:**
- Fallback: Currency decomposition
- Source: "Currency Decomposition Proxies (CPIS/BIS Priors)"

### 3. State Classification
Each country should have one of three states:
- **known-zero**: Explicitly zero in SEC filings
- **known-positive**: Evidence-based positive exposure
- **unknown**: No data, receives fallback

### 4. Status Classification
Each country should have one of three statuses:
- **evidence**: From verified sources (SEC filings, reports)
- **high_confidence_estimate**: ADR-resolved home country
- **fallback**: Estimated using channel-specific fallbacks

### 5. Normalization
**Check:** Final blended weights should sum to 100%
```
[TICKER] === NORMALIZATION ===
Total blended weight before normalization: ~100%
[After normalization, sum should be exactly 100%]
```

## Common Issues to Watch For

### ❌ Issue 1: Evidence Overwritten by Fallback
**Symptom:** Countries with evidence show status='fallback'
**Root Cause:** Fallback applied to evidence countries
**Fix:** Ensure fallback excludes evidenceCountries set

### ❌ Issue 2: Known Zeros Receiving Weight
**Symptom:** Countries with revenuePercentage=0 show weight > 0
**Root Cause:** Known zeros not excluded from fallback
**Fix:** Ensure fallback excludes knownZeroCountries set

### ❌ Issue 3: Regional Expansion Not Working
**Symptom:** "Europe" appears as a country instead of being expanded
**Root Cause:** Narrative parsing or expansion logic failed
**Fix:** Check narrative parser output and regional mappings

### ❌ Issue 4: Incorrect Sector Coefficients
**Symptom:** Technology company shows Manufacturing coefficients
**Root Cause:** Sector classification failed
**Fix:** Check sector classification service output

### ❌ Issue 5: Weights Don't Sum to 100%
**Symptom:** Total blended weight ≠ 100% after normalization
**Root Cause:** Normalization logic error
**Fix:** Check normalization calculation

## Expected Console Output Structure

For each company, you should see this sequence:

```
1. [Narrative Parser] Parsing results
2. [Regional Expansion] Expansion details
3. [TICKER] === REVENUE CHANNEL CALCULATION ===
   - Evidence countries listed
   - Fallback decision
4. [TICKER] === SUPPLY CHANNEL CALCULATION ===
   - Evidence countries listed
   - Fallback decision
5. [TICKER] === ASSETS CHANNEL CALCULATION ===
   - Evidence countries listed
   - Fallback decision
6. [TICKER] === FINANCIAL/OPERATIONS CHANNEL CALCULATION ===
   - Evidence countries listed
   - Fallback decision
7. [TICKER] === BLENDED WEIGHT CALCULATION (Step 1) ===
   - Country-by-channel breakdown
   - Political alignment factors
8. [TICKER] === NORMALIZATION ===
   - Final normalized weights
9. [Phase 3.0] Data Quality Report
```

## Success Criteria

### ✅ Test Passes If:
1. **Regional aggregates expand correctly** into constituent countries
2. **All expanded countries have status='evidence'** (not fallback)
3. **Fallback only applies to countries with no evidence**
4. **Known zeros remain zero** (never receive fallback weight)
5. **Channel-specific fallbacks are used** (not generic fallback)
6. **Sector coefficients are correct** for each company's sector
7. **Final weights sum to 100%** after normalization
8. **No console errors** during calculation

### ❌ Test Fails If:
1. Regional aggregates not expanded (e.g., "Europe" appears as country)
2. Evidence countries receive fallback (status='fallback' for evidence)
3. Known zeros receive non-zero weight
4. Wrong fallback type applied (e.g., revenue fallback for supply channel)
5. Incorrect sector coefficients
6. Weights don't sum to 100%
7. Console shows errors or warnings

## Manual Testing Steps

1. **Open Console**: Press F12 → Console tab
2. **Clear Console**: Click the 🚫 icon to clear previous logs
3. **Enter Ticker**: Type "AAPL" in the search box
4. **Click Assess**: Click the "Assess Company" button
5. **Review Logs**: Scroll through console logs following the structure above
6. **Verify Each Point**: Check each validation point listed above
7. **Repeat**: Test MSFT, TSLA, JPM, XOM following the same process

## Automated Testing (Future)

For production deployment, create automated tests:

```typescript
describe('Phase 3.0 Exposure Calculation', () => {
  test('AAPL: Regional expansion works correctly', async () => {
    const result = await getCompanyGeographicExposure('AAPL');
    expect(result.segments.some(s => s.country === 'Europe')).toBe(false);
    expect(result.segments.some(s => s.country === 'Germany')).toBe(true);
  });
  
  test('Evidence countries not overwritten by fallback', async () => {
    const result = await getCompanyGeographicExposure('AAPL');
    const germanyChannel = result.channelBreakdown?.['Germany'];
    expect(germanyChannel?.revenue.status).toBe('evidence');
  });
  
  test('Known zeros remain zero', async () => {
    // Test with company that has explicit zeros
    const result = await getCompanyGeographicExposure('TEST');
    const zeroCountry = result.channelBreakdown?.['ZeroCountry'];
    expect(zeroCountry?.revenue.weight).toBe(0);
    expect(zeroCountry?.revenue.state).toBe('known-zero');
  });
});
```

## Troubleshooting

### If narrative parsing doesn't work:
- Check `narrativeParser.ts` is imported correctly
- Verify `parseNarrativeText()` is called in `getCompanyGeographicExposureSync()`
- Check console for narrative parser output

### If regional expansion doesn't work:
- Check `expandRegionalSegments()` receives narrativeRegions Map
- Verify REGIONAL_MAPPINGS contains the region name
- Check console for regional expansion logs

### If fallback is applied to evidence:
- Check `evidenceCountries` Set is populated correctly
- Verify fallback functions check `!evidenceCountries.has(country)`
- Review fallback decision logs

### If weights don't sum to 100%:
- Check normalization logic in `calculateIndependentChannelExposures()`
- Verify no countries are filtered out incorrectly
- Review micro-filter threshold (0.50%)

## Contact & Support

If you encounter issues not covered in this guide:
1. Check the implementation summary: `PHASE_3_NARRATIVE_PARSING_IMPLEMENTATION.md`
2. Review console logs for specific error messages
3. Verify all files are saved and the dev server restarted
4. Check that no TypeScript compilation errors exist

---

**Last Updated**: 2025-11-27
**Version**: Phase 3.0
**Status**: Ready for Testing