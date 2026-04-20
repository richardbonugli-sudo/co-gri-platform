# V5 Patch: geographicExposureService.ts — Channel Contamination Fix (Step 1.1)

## Problem
Lines 260–295 in `geographicExposureService.ts`:

```typescript
// BROKEN: All four channels share the SAME channelData object
const channelData: ChannelData = {
  weight,
  state: 'known-positive',
  status: 'evidence',
  source: `Company-Specific Data: ${companySpecific.dataSource}`,
  ...
};

channelBreakdown[exposure.country] = {
  revenue: channelData,   // ← same object
  financial: channelData, // ← same object
  supply: channelData,    // ← same object
  assets: channelData,    // ← same object
  blended: weight,
};
```

## Fix Applied
The `calculateIndependentChannelExposuresWithSEC` function now calls
`buildIndependentChannelBreakdown` from `v5/companySpecificChannelFix.ts`
when company-specific data is found.

Each channel uses independently computed weights:
- Revenue: revenuePercentage if available, else revenue prior (GDP-weighted demand)
- Supply:  supplyPercentage if available, else supply prior (manufacturing-weighted, NOT GDP)
- Assets:  assetsPercentage if available, else asset prior (capital-stock weighted, λ=0.35)
- Financial: financialPercentage if available, else financial depth prior (BIS/financial-center)

## Expected Result
Revenue, supply, assets, financial all produce DIFFERENT country distributions
for the same company.

For Apple (AAPL):
- Revenue: US ~42%, Japan ~6.3% (exact), Europe ~25%
- Supply: China ~45-50%, Vietnam ~15%, India ~12%, Taiwan ~8%, US ~0%, Germany ~0%
- Assets: US ~80%, China/HK/TW ~7-9%, rest distributed
- Financial: US/UK/Ireland dominant (Apple's debt issuance jurisdictions)