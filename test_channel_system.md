# Channel-Specific Fallback System Testing Plan

## Test Companies (5 Different Sectors)

### 1. Technology Sector
**AAPL (Apple Inc.)**
- Expected: Revenue evidence from SEC, supply chain fallback (Asia manufacturing)
- Channel patterns: Revenue global, Supply Asia-heavy, Assets US-heavy

**MSFT (Microsoft Corporation)**
- Expected: Revenue evidence from SEC, supply chain fallback
- Channel patterns: Similar to AAPL but more distributed

### 2. Energy Sector
**XOM (ExxonMobil)**
- Expected: Revenue evidence, assets in resource-rich countries
- Channel patterns: Revenue global, Assets in oil/gas regions

**CVX (Chevron)**
- Expected: Similar to XOM
- Channel patterns: Energy sector template

### 3. Finance Sector
**JPM (JPMorgan Chase)**
- Expected: Revenue evidence, financial centers concentration
- Channel patterns: Revenue in financial hubs, Assets in major cities

**BAC (Bank of America)**
- Expected: Similar to JPM
- Channel patterns: Finance sector template

### 4. Healthcare Sector
**JNJ (Johnson & Johnson)**
- Expected: Revenue evidence, manufacturing in developed markets
- Channel patterns: Revenue global, Supply in pharma hubs

**PFE (Pfizer)**
- Expected: Similar to JNJ
- Channel patterns: Healthcare sector template

### 5. Consumer Sector
**WMT (Walmart)**
- Expected: Revenue evidence, supply chain in low-cost countries
- Channel patterns: Revenue US-heavy, Supply Asia manufacturing

**NKE (Nike)**
- Expected: Revenue global, supply chain Asia-heavy
- Channel patterns: Consumer sector template

## Test Criteria

### For Each Company, Verify:

1. **Channel Independence**
   - [ ] Revenue channel uses evidence (if available) or revenue-specific fallback
   - [ ] Supply chain uses supply-specific fallback (manufacturing hubs)
   - [ ] Assets uses assets-specific fallback (facility locations)
   - [ ] Financial uses financial-specific fallback (banking centers)
   - [ ] Counterparty uses counterparty-specific fallback

2. **Evidence Protection**
   - [ ] Countries with evidence are marked ✅ and locked
   - [ ] Fallback countries are marked 📊
   - [ ] Evidence is never overwritten by fallback

3. **Sector-Specific Patterns**
   - [ ] Technology: Supply chain Asia-heavy (China 35%, Taiwan 15%)
   - [ ] Energy: Assets in resource countries
   - [ ] Finance: Financial channel in banking centers (US 65%, UK 10%)
   - [ ] Healthcare: Assets in developed markets
   - [ ] Consumer: Supply chain in low-cost manufacturing

4. **Step 2 Output**
   - [ ] Shows "PHASE 1: BUILD EACH CHANNEL INDEPENDENTLY"
   - [ ] Shows "PHASE 2: NORMALIZE EACH CHANNEL"
   - [ ] Shows "PHASE 3: BLEND ALL FIVE CHANNELS"
   - [ ] Displays evidence vs fallback statistics per channel

5. **Console Logging**
   - [ ] Shows "🔬 Building per-channel exposures for [SYMBOL]"
   - [ ] Shows "📊 Applying channel-specific fallback templates"
   - [ ] Shows "✅ Channel statistics" with evidence/fallback counts
   - [ ] Shows "✅ Generated X country exposures"

## Expected Issues to Check

1. **Import Errors**
   - Check if channelFallbackService imports correctly
   - Check if channelExposureBuilder imports correctly

2. **Type Mismatches**
   - Verify ExposureComponents includes status fields
   - Verify CountryExposure interface matches

3. **Fallback Application**
   - Verify fallback templates are applied correctly
   - Verify evidence protection works

4. **Normalization**
   - Verify per-channel normalization
   - Verify final blended normalization

## Test Execution Steps

1. Open browser console (F12)
2. Navigate to COGRI page
3. Assess each test company
4. Expand Step 2 to see detailed calculations
5. Check console logs for channel statistics
6. Verify country table shows per-channel breakdown
7. Document any errors or unexpected behavior

