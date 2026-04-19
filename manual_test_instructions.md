# Manual AAPL Assessment Test Instructions

## Current Status
- Browser is open at: http://localhost:5174/cogri
- Input field is focused and ready for input

## Steps to Complete the Test

1. **Type AAPL into the input field**
   - The input field is already focused (element_id: 861)
   - Simply type: AAPL

2. **Click "Run CO-GRI Assessment" button**
   - The button will become enabled after typing
   - Click the button to start the assessment

3. **Monitor Console Logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for these key messages:
     - "📊 Starting AAPL assessment..."
     - "📝 Parsing narrative text for regional definitions..."
     - "🔍 Found regional mappings: Europe → [countries including India]"
     - "🌍 Expanding segments with narrative-based regional definitions..."
     - "✅ India found in expanded segments with X% exposure"

4. **Verify Results in UI**
   - Wait for assessment to complete (~10-15 seconds)
   - Scroll down to "Geographic Exposure" section
   - Look for India in the country list
   - Expected: India should appear with ~1.79% exposure (from Europe segment)

## What to Look For

### ✅ SUCCESS Indicators:
- India appears in the geographic exposure breakdown
- India has a percentage value (approximately 1.79%)
- Console shows "Narrative parsing successful" messages
- Console shows "Regional expansion applied" messages

### ❌ FAILURE Indicators:
- India is missing from the geographic exposure list
- Console shows errors related to narrative parsing
- Console shows "No regional mappings found"

## Alternative: Automated Test
If you prefer an automated test, open this file in the browser:
- File: /workspace/shadcn-ui/test_aapl_browser.html
- Click "2. Run AAPL Assessment" button
- The test will automatically fill in AAPL and run the assessment

## Files Modified for This Fix
1. `/workspace/shadcn-ui/src/services/narrativeParser.ts`
   - Added `normalizeRegionName()` function
   - Now removes " segment" and " region" suffixes
   - Ensures "Europe segment" matches "Europe" in data

2. `/workspace/shadcn-ui/src/services/geographicExposureService.ts`
   - Already integrated narrative parsing
   - Uses normalized region names for matching

## Expected Console Output Example
```
📊 Starting AAPL assessment...
📝 Parsing narrative text for regional definitions...
🔍 Found regional mappings:
  - Europe → Germany, United Kingdom, France, Italy, Spain, Netherlands, Sweden, Switzerland, Belgium, Austria, Norway, Denmark, Poland, India, Saudi Arabia, United Arab Emirates, Israel, Turkey, South Africa, Nigeria, Egypt, Kenya
  - Rest of Asia Pacific → Australia, New Zealand, Singapore, South Korea, Thailand, Malaysia, Indonesia, Philippines, Vietnam
🌍 Expanding segments with narrative-based regional definitions...
  - Expanding Europe (25%) into 14 countries
  - India receives: 1.79% (25% / 14)
✅ Geographic exposure calculation complete
```
