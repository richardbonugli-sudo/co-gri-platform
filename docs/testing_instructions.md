# Quick Testing Instructions - Channel-Specific Fallback System

## 🚀 Start Testing Now

### Step 1: Open the COGRI Page
The page is already loaded at: **http://localhost:5173/cogri**

### Step 2: Open Browser Console
Press **F12** (or right-click → Inspect → Console tab)

### Step 3: Test Apple (AAPL) First

1. **Enter ticker:** Type `AAPL` in the input field
2. **Click:** "Assess Company" button
3. **Watch for:**
   - Console logs showing channel construction
   - Step 2 expanding to show 3-phase breakdown
   - Country table populating with per-channel data

### Step 4: What to Look For

#### ✅ Success Indicators:
- Console shows: `🔬 Building per-channel exposures for AAPL`
- Console shows: `📊 Applying channel-specific fallback templates`
- Console shows: `✅ Channel statistics` with evidence/fallback counts
- Step 2 displays: "PHASE 1", "PHASE 2", "PHASE 3"
- Country table shows columns: Revenue, Supply, Assets, Financial, Counterparty
- Evidence markers (✅) appear for countries with SEC data
- Fallback markers (📊) appear for template-based countries

#### ❌ Issues to Report:
- Any error messages in console
- Missing channel breakdown in Step 2
- No per-channel columns in country table
- Evidence not protected (overwritten by fallback)
- Incorrect sector patterns (e.g., Technology should show Asia-heavy supply chain)

### Step 5: Test Additional Companies (Optional)

After AAPL, try these to verify different sector patterns:

- **XOM** (Energy) - Should show resource-rich asset locations
- **JPM** (Finance) - Should show banking center concentration
- **JNJ** (Healthcare) - Should show pharma manufacturing hubs
- **WMT** (Consumer) - Should show Asia supply chain + US revenue

---

## 📋 Quick Checklist

For each company you test, verify:

- [ ] Assessment completes without errors
- [ ] Console shows channel construction logs
- [ ] Step 2 shows 3-phase breakdown
- [ ] Country table shows per-channel values
- [ ] Evidence vs fallback clearly marked
- [ ] Sector-specific patterns appear correct

---

## 🐛 If You Find Issues

1. **Take a screenshot** of the error or unexpected behavior
2. **Copy console logs** (right-click in console → Save as...)
3. **Note the ticker symbol** and what you expected vs what you saw
4. **Report to me** with these details

---

## 📊 Expected Console Output Example

```
🔬 Building per-channel exposures for AAPL
📊 Applying channel-specific fallback templates
✅ Channel statistics:
   - Revenue: 5 evidence, 0 fallback
   - Supply: 0 evidence, 15 fallback
   - Assets: 0 evidence, 10 fallback
   - Financial: 0 evidence, 8 fallback
   - Counterparty: 0 evidence, 12 fallback
✅ Generated 45 country exposures
```

---

## 💡 Tips

- **Keep console open** - All detailed logs appear there
- **Expand Step 2** - Shows the 3-phase calculation breakdown
- **Scroll the country table** - May have 40-50 countries
- **Check evidence markers** - ✅ = real data, 📊 = fallback template
- **Compare channels** - Each should show different patterns

---

## ⏱️ Time Estimate

- **Quick test (AAPL only):** 2-3 minutes
- **Full test (5 companies):** 10-15 minutes
- **Detailed analysis:** 20-30 minutes

---

**Ready to start?** Just enter `AAPL` in the ticker field and click "Assess Company"!

For detailed test plan, see: `docs/live_test_execution.md`
