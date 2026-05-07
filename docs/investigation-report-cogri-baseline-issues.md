# CO-GRI Baseline Results — Deep Investigation Report

**Date:** 2026-05-07  
**Investigator:** David (Data Analyst)  
**Scope:** Read-only investigation — no code changes made  

---

## Executive Summary

Three distinct root-cause categories were identified:

| # | Symptom | Root Cause Category |
|---|---------|---------------------|
| 1 | Global Baseline run wiped prior SEC results (180 companies disappeared) | **Path collision** — both workflows write to overlapping `public/docs/baseline-results/` directory |
| 2 | Re-run SEC Baseline shows 180 companies but 0% Retrieval / Structured / Narrative | **Schema mismatch** — script outputs fields the dashboard does not read (`companyName` vs `name`, internal-only fields) PLUS missing secrets causing degraded mode |
| 3 | Target of 211 combined companies never reached | **Architecture gap** — dashboard loads SEC and Global tabs from completely separate files; no merge/aggregation layer exists |

---

## 1. File & Directory Inventory

### Baseline result file paths

| Path | Purpose | Status |
|------|---------|--------|
| `docs/baseline-results/latest.json` | SEC script writes here first | Written by `runSECBaseline.ts` |
| `public/docs/baseline-results/latest.json` | Vite static copy for browser fetch | Copied by SEC workflow Step 8 |
| `docs/global-baseline-results/latest.json` | Global script writes here | Written by `runGlobalBaseline.ts` |
| `public/docs/global-baseline-results/latest.json` | Vite static copy for browser fetch | **Directory does not exist yet** |
| `docs/global-baseline-results/by-exchange/*.json` | Per-exchange archives | Written by global script |

### Dashboard fetch URLs

| Tab | Fetch URL | Source file |
|-----|-----------|-------------|
| SEC Baseline | `/docs/baseline-results/latest.json` (local) OR GitHub raw URL | `BaselineResultsDashboard.tsx:~598` |
| Global Baseline | `/docs/global-baseline-results/latest.json` (local only) | `BaselineResultsDashboard.tsx:~598` |

---

## 2. Root Cause Analysis

### 2.1 Symptom 1 — Global Baseline run wiped SEC results (180 companies disappeared)

#### Finding: Path collision in workflow Step 8 (Copy to public folder)

**SEC workflow** (`run-sec-baseline.yml`, Step 8):
```yaml
cp docs/baseline-results/latest.json public/docs/baseline-results/latest.json
```

**Global workflow** (`run-global-baseline.yml`, Step 8):
```yaml
cp docs/global-baseline-results/latest.json public/docs/global-baseline-results/latest.json
```

These copy to **different** `public/docs/` subdirectories, so there is no direct overwrite at the file level. However, the **actual disappearance mechanism** is more subtle:

#### Finding: Git commit ordering and `git pull --rebase` in Global workflow

The Global workflow's Step 9 (Commit and push) includes:
```yaml
git pull --rebase origin HEAD || true
```

The SEC workflow does **not** have this pull-before-push. When the Global workflow runs after the SEC workflow:

1. SEC workflow commits `public/docs/baseline-results/latest.json` → pushes to `main`
2. Global workflow checks out the repo at the **start** of the run (Step 1, `fetch-depth: 1`)
3. Global workflow does NOT re-fetch the SEC results committed in step 1
4. Global workflow's `git pull --rebase` in Step 9 pulls the SEC commit, then rebases the global commit on top — **but only stages `docs/global-baseline-results/` and `public/docs/global-baseline-results/`**
5. If the SEC workflow's `public/docs/baseline-results/latest.json` was committed between the Global workflow's checkout and its push, the rebase may produce a tree that **omits** the SEC file if there is a conflict or if the working tree was reset

#### Finding: `public/docs/global-baseline-results/` directory does not exist

Confirmed by terminal output:
```
NO global-baseline-results in public/docs
NO global-baseline-results in docs/
```

This means the Global workflow's Step 8 copy step silently fails (the `if [ -f ... ]` guard prevents errors), and the dashboard's `loadGlobalData()` fetch to `/docs/global-baseline-results/latest.json` always returns 404, showing "No Global Baseline Data Available Yet."

#### Finding: `public/docs/baseline-results/latest.json` is a placeholder

Current content of `public/docs/baseline-results/latest.json`:
```json
{
  "runId": "pending-first-run",
  "phase": "not-yet-run",
  "results": [],
  "_status": "placeholder — workflow results committed to GitHub repo but not yet pulled into this build."
}
```

This is the placeholder file committed to the repo. The SEC workflow copies `docs/baseline-results/latest.json` → `public/docs/baseline-results/latest.json` only when `changed == 'true'`. If the SEC workflow ran and committed results to `docs/baseline-results/latest.json` but the copy step was skipped (e.g., `dry_run=true` or `changed=false`), the `public/` copy remains the placeholder, and the dashboard shows 0 results.

---

### 2.2 Symptom 2 — 180 companies shown but 0% Retrieval / Structured / Narrative

This symptom has **two independent causes** that can each produce it alone.

#### Finding A: Critical schema mismatch — `companyName` vs `name` (Global tab)

The `runGlobalBaseline.ts` script initializes its result object with:
```typescript
const result: GlobalBaselineResult = {
  ticker: company.ticker,
  companyName: company.name,   // ← uses 'companyName'
  exchange: company.exchange,
  ...
};
```

But the `GlobalBaselineResult` interface in `src/types/company.ts` defines:
```typescript
export interface GlobalBaselineResult {
  ticker: string;
  name: string;          // ← interface expects 'name'
  exchange: string;
  ...
}
```

And the dashboard's Global tab reads:
```typescript
// Search filter (line ~630):
!r.name.toLowerCase().includes(q)

// Table row (line ~990):
<TableCell>{r.name}</TableCell>

// CSV export:
name: r.name,
```

**Impact:** The script writes `companyName` but the interface and dashboard read `name`. In TypeScript this would be a compile-time error — but `npx tsx` runs with `ts-node`-style transpilation that may not enforce strict type checking at runtime. The JSON output contains `companyName` (not `name`), so `r.name` is `undefined` everywhere in the dashboard, causing blank company name cells and broken search.

#### Finding B: Script-internal fields not in the shared type (Global tab)

The script initializes fields that **do not exist** in `GlobalBaselineResult` (company.ts):

| Script field | Type interface field | Notes |
|---|---|---|
| `companyName` | `name` | **Name mismatch** — see Finding A |
| `sector` | *(absent)* | Script writes it, type doesn't define it |
| `isADR` | *(absent)* | Script writes it, type doesn't define it |
| `dataSource` | *(absent in type)* | Script uses `'fmp_api' \| 'exchange_portal' \| ...`; type has `filingSource: GlobalFilingSource` |
| `dataSourceMs` | *(absent)* | Script writes it, type doesn't define it |
| `filingType` | *(absent in type)* | Script uses `'annual_report_pdf' \| ...`; type has `filingSource` |
| `filingDate` | *(absent in type)* | Script writes it, type has `runDate` |
| `filingSizeBytes` | *(absent)* | Script writes it, type doesn't define it |
| `retrievalMs` | *(absent)* | Script writes it, type doesn't define it |
| `retrievalError` | *(absent)* | Script writes it, type has `errorMessage` |
| `revenueDataFound` | *(absent)* | Script writes it, type doesn't define it |
| `ppeDataFound` | *(absent)* | Script writes it, type doesn't define it |
| `debtDataFound` | *(absent)* | Script writes it, type doesn't define it |
| `geographicSegmentsFound` | *(absent)* | Script writes it, type has `geographicSegments?: string[]` |
| `structuredDataMs` | *(absent)* | Script writes it, type doesn't define it |
| `narrativeParsingMs` | *(absent)* | Script writes it, type doesn't define it |
| `confidenceGrade` | *(absent in type)* | Script writes it, type doesn't define it |
| `recencyMultiplier` | *(absent in type)* | Script writes it, type doesn't define it |
| `totalPipelineMs` | *(absent in type)* | Script writes it, type doesn't define it |
| `timestamp` | *(absent in type)* | Script writes it, type has `runDate` |
| `materiallySpecific` | *(absent in type)* | Script writes it, type doesn't define it |
| `specificChannelCount` | *(absent in type)* | Script writes it, type doesn't define it |
| `dominantEvidenceTier` | *(absent in type)* | Script writes it, type doesn't define it |
| `channelTiers` | *(absent in type)* | Script writes it, type doesn't define it |
| `channelTiersAssigned` | present in type ✓ | Matches |
| `compositeConfidenceScore` | present in type ✓ | Matches |
| `enteredDataPath` | present in type ✓ | Matches |
| `filingFetched` | present in type ✓ | Matches |
| `structuredDataFound` | present in type ✓ | Matches |
| `narrativeParsingSucceeded` | present in type ✓ | Matches |

**Summary:** The script's `GlobalBaselineResult` (defined locally inside `runGlobalBaseline.ts` around line 190) is a **completely different, richer schema** than the exported `GlobalBaselineResult` in `src/types/company.ts`. The script was written independently from the type definition and the two were never reconciled. The JSON output on disk reflects the **script's schema**, not the type's schema.

#### Finding C: Dashboard Global tab reads fields from the type schema (not the script schema)

The dashboard imports:
```typescript
import type { GlobalBaselineResult, GlobalRunSummary, GlobalFilingSource } from '@/types/company';
```

So when it reads `r.filingFetched`, `r.narrativeParsingSucceeded`, `r.channelTiers`, etc., it is reading fields that **exist in the type** but the JSON on disk (written by the script) uses **different field names**. This produces `undefined` for almost every metric field, which renders as:
- `filingFetched` → `undefined` → `BoolIcon` shows ❌ (falsy)
- `narrativeParsingSucceeded` → `undefined` → ❌
- `compositeConfidenceScore` → `undefined` → score shows as 0 or blank
- Stats: `results.filter(r => r.filingFetched).length` → 0 → **0% Retrieval**

This precisely explains Symptom 2: 180 companies are shown (because `ticker` and `exchange` match in both schemas), but all boolean pipeline flags are `undefined`/falsy → 0%.

#### Finding D: Missing secrets cause degraded mode (SEC tab)

The SEC workflow's Step 4 logs warnings but continues when secrets are missing:
- **No `OPENAI_API_KEY`** → `narrativeParsingSucceeded = false` for all companies
- **No `SUPABASE_URL` / `SUPABASE_ANON_KEY`** → Supabase writes skipped (results still written to file)

If the SEC baseline was run without `OPENAI_API_KEY`, all 180 companies would show:
- `narrativeParsingSucceeded: false` → 0% Narrative Parsing ✓
- `retrievalSucceeded: false` if EDGAR was unreachable or rate-limited → 0% Retrieval

The SEC script's `BaselineResult` interface **does match** the dashboard's `BaselineResult` interface (both define `companyName`, `retrievalSucceeded`, `narrativeParsingSucceeded`, etc.). So the SEC tab schema is correct — the 0% metrics are a **runtime/secrets issue**, not a schema issue.

#### Finding E: SEC dashboard `RunSummary` has `_status` / `_degradedMode` fields

The dashboard's `RunSummary` interface includes:
```typescript
_status?: string;
_degradedMode?: boolean;
_degradedReason?: string;
```

The current `public/docs/baseline-results/latest.json` placeholder has `_status: "placeholder — ..."`. The dashboard does not currently render a warning banner when `_degradedMode` is true, so users see raw 0% metrics with no explanation.

---

### 2.3 Symptom 3 — Target of 211 companies (180 SEC + 31 Global) never reached

#### Finding: No combined/merged data layer exists

The dashboard has two completely separate tabs:
- **SEC Baseline tab** — loads from `public/docs/baseline-results/latest.json` (or GitHub)
- **Global Baseline tab** — loads from `public/docs/global-baseline-results/latest.json` (local only)

There is no aggregation, merge, or combined view. The 211-company target requires:
1. Both workflows to have run successfully
2. Both `latest.json` files to be present and valid
3. A combined view or cross-tab summary to exist in the dashboard

None of these three conditions are currently met.

#### Finding: Global tab has no GitHub loader fallback

The SEC tab has a full GitHub loader UI that lets users enter a repo slug and fetch results from `raw.githubusercontent.com` across 4 URL variants. The Global tab only fetches from the local `/docs/global-baseline-results/latest.json` with no GitHub fallback. Since `public/docs/global-baseline-results/` does not exist, the Global tab will always show "No Global Baseline Data Available Yet" in the current deployment.

---

## 3. Schema Comparison Tables

### 3.1 SEC BaselineResult — Script vs Dashboard (MATCH ✓)

The SEC script's `BaselineResult` interface (line 442 of `runSECBaseline.ts`) matches the dashboard's `BaselineResult` interface (line 79 of `BaselineResultsDashboard.tsx`) for all core fields. The script has a few **extra** fields not in the dashboard type:

| Script-only field | Notes |
|---|---|
| `narrativeSupplyCountriesFound` | Not in dashboard type |
| `narrativeRevenueCountriesFound` | Not in dashboard type |
| `narrativeAssetsCountriesFound` | Not in dashboard type |
| `narrativeExhibit21CountriesFound` | Not in dashboard type |
| `structuredExhibit21CountriesFound` | Not in dashboard type |

These are additive (extra data in JSON) and do not break parsing. The dashboard simply ignores them.

### 3.2 Global BaselineResult — Script vs Type vs Dashboard (MISMATCH ✗)

Three different definitions exist and none fully agree:

| Field | Script (`runGlobalBaseline.ts`) | Type (`company.ts`) | Dashboard reads |
|---|---|---|---|
| Company name | `companyName` ✗ | `name` ✓ | `r.name` → undefined |
| Filing source | `dataSource` (string) ✗ | `filingSource: GlobalFilingSource` ✓ | `r.filingSource` → undefined |
| Filing date | `filingDate` ✗ | `runDate` ✓ | `r.runDate` → undefined |
| Filing size | `filingSizeBytes` ✗ | *(absent)* | not read |
| Retrieval error | `retrievalError` ✗ | `errorMessage` ✓ | `r.errorMessage` → undefined |
| Confidence grade | `confidenceGrade` ✗ | *(absent)* | not read |
| Channel tiers | `channelTiers` ✗ | *(absent)* | not read |
| Dominant tier | `dominantEvidenceTier` ✗ | *(absent)* | not read |
| Recency multiplier | `recencyMultiplier` ✗ | *(absent)* | not read |
| Pipeline ms | `totalPipelineMs` ✗ | *(absent)* | not read |
| Timestamp | `timestamp` ✗ | `runDate` ✓ | `r.runDate` → undefined |
| Ticker | `ticker` ✓ | `ticker` ✓ | `r.ticker` ✓ |
| Exchange | `exchange` ✓ | `exchange` ✓ | `r.exchange` ✓ |
| Country | `country` ✓ | `country` ✓ | `r.country` ✓ |
| Yahoo ticker | `yahooTicker` ✓ | `yahooTicker` ✓ | `r.yahooTicker` ✓ |
| Company type | `companyType` ✓ | `companyType` ✓ | `r.companyType` ✓ |
| Entered data path | `enteredDataPath` ✓ | `enteredDataPath` ✓ | `r.enteredDataPath` ✓ |
| Filing fetched | `filingFetched` ✓ | `filingFetched` ✓ | `r.filingFetched` ✓ |
| Structured found | `structuredDataFound` ✓ | `structuredDataFound` ✓ | `r.structuredDataFound` ✓ |
| Narrative succeeded | `narrativeParsingSucceeded` ✓ | `narrativeParsingSucceeded` ✓ | `r.narrativeParsingSucceeded` ✓ |
| Confidence score | `compositeConfidenceScore` ✓ | `compositeConfidenceScore` ✓ | `r.compositeConfidenceScore` ✓ |
| NAV per unit | `navPerUnit` ✓ | `navPerUnit` ✓ | `r.navPerUnit` ✓ |
| Custodian location | `custodianLocation` ✓ | `custodianLocation` ✓ | `r.custodianLocation` ✓ |

---

## 4. Workflow Issues

### 4.1 SEC workflow — `public/` copy depends on `changed == 'true'`

```yaml
if: always() && steps.check_changes.outputs.changed == 'true' && github.event.inputs.dry_run != 'true'
```

If the script runs but produces identical output to the previous run (e.g., same companies, same results), `git diff` reports no changes → `changed=false` → the `public/` copy step is **skipped** → the browser-served file remains stale.

### 4.2 Global workflow — missing `public/docs/global-baseline-results/` in repo

The global workflow's Step 5 creates:
```bash
mkdir -p docs/global-baseline-results/by-exchange
mkdir -p public/docs/global-baseline-results/by-exchange
```

But these directories are created **only in the GitHub Actions runner's working directory** during the run. They are not committed to the repo as empty directories (Git does not track empty directories). The `public/docs/global-baseline-results/` directory does not exist in the committed repo, so the Vite dev server and production build cannot serve the file.

### 4.3 SEC workflow — no `git pull --rebase` before push

The SEC workflow pushes directly without pulling first:
```yaml
git push origin HEAD
```

If the Global workflow (or any other workflow) pushed between the SEC workflow's checkout and its push, the SEC push will fail with a non-fast-forward error. The `continue-on-error: true` on the baseline step would not catch this — it's in the commit step which does not have `continue-on-error`.

### 4.4 Global workflow — `git pull --rebase` can silently drop SEC results

The global workflow does:
```yaml
git pull --rebase origin HEAD || true
```

The `|| true` suppresses all errors including rebase conflicts. If there is a conflict between the global workflow's staged changes and the remote (e.g., SEC workflow just pushed `public/docs/baseline-results/latest.json`), the rebase may fail silently, and the subsequent `git push` pushes a tree that does not include the SEC results. This is the most likely mechanism for **Symptom 1**.

---

## 5. Dashboard Loading Logic Issues

### 5.1 SEC tab — three-source loading cascade

The SEC tab loads data in this priority order:
1. **Local static file**: `public/docs/baseline-results/latest.json` (served by Vite)
2. **GitHub raw URL**: entered manually by user via the GitHub Loader panel

The `baselineCacheService.ts` file referenced in the summary does not exist at `src/components/services/baselineCacheService.ts` — it was either moved, renamed, or never created. The caching logic is inline in `BaselineResultsDashboard.tsx`.

### 5.2 Global tab — single-source loading, no fallback

```typescript
const loadGlobalData = async () => {
  const res = await fetch('/docs/global-baseline-results/latest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: GlobalRunSummary = await res.json();
  setGlobalSummary(data);
};
```

- No GitHub loader fallback
- No retry logic
- No degraded-mode banner
- The fetch path `/docs/global-baseline-results/latest.json` maps to `public/docs/global-baseline-results/latest.json` in Vite — which does not exist

### 5.3 Dashboard search bug — `r.name` on Global tab

```typescript
// Line ~630 in BaselineResultsDashboard.tsx
if (
  !r.ticker.toLowerCase().includes(q) &&
  !r.name.toLowerCase().includes(q) &&   // ← r.name is undefined (script writes companyName)
  !r.country.toLowerCase().includes(q)
) return false;
```

When `r.name` is `undefined`, calling `.toLowerCase()` throws a `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`. This would crash the filter and potentially blank the entire table even when results are present.

---

## 6. Root Cause Summary

| ID | Root Cause | Affects | Severity |
|----|-----------|---------|----------|
| RC-1 | Global workflow `git pull --rebase \|\| true` silently drops SEC results on push conflict | Symptom 1 | 🔴 Critical |
| RC-2 | `public/docs/global-baseline-results/` directory not committed to repo | Symptom 1, 3 | 🔴 Critical |
| RC-3 | Script writes `companyName` but type/dashboard reads `name` | Symptom 2 (Global) | 🔴 Critical |
| RC-4 | Script schema (runGlobalBaseline.ts) diverged from shared type (company.ts) — 20+ field mismatches | Symptom 2 (Global) | 🔴 Critical |
| RC-5 | Missing `OPENAI_API_KEY` secret → all narrative parsing skipped | Symptom 2 (SEC) | 🟠 High |
| RC-6 | `public/` copy step gated on `changed == 'true'` → stale file served when no diff | Symptom 2 (SEC) | 🟠 High |
| RC-7 | Global tab has no GitHub loader fallback | Symptom 3 | 🟠 High |
| RC-8 | No combined/merged 211-company view exists | Symptom 3 | 🟠 High |
| RC-9 | `r.name.toLowerCase()` crash when `name` is undefined in Global tab search | Symptom 2 (Global) | 🟡 Medium |
| RC-10 | SEC workflow has no `git pull --rebase` → push fails if concurrent workflow ran | Symptom 1 | 🟡 Medium |
| RC-11 | `baselineCacheService.ts` referenced in summary but file does not exist | Investigation gap | 🟡 Medium |
| RC-12 | No `_degradedMode` warning banner in dashboard | UX | 🟢 Low |

---

## 7. Strategic Recommendations

### Priority 1 — Fix the Global schema mismatch (RC-3, RC-4)

The `runGlobalBaseline.ts` script must be updated so its result object uses the **same field names** as `GlobalBaselineResult` in `src/types/company.ts`. Specifically:

1. Rename `companyName` → `name` in the result initialization
2. Rename `dataSource` → `filingSource` (and map values to `GlobalFilingSource` union)
3. Rename `filingDate` → `runDate`
4. Rename `retrievalError` → `errorMessage`
5. Remove or map fields that exist only in the script's local interface (`sector`, `isADR`, `dataSourceMs`, `filingSizeBytes`, `retrievalMs`, `revenueDataFound`, `ppeDataFound`, `debtDataFound`, `geographicSegmentsFound`, `structuredDataMs`, `narrativeParsingMs`, `confidenceGrade`, `recencyMultiplier`, `totalPipelineMs`, `timestamp`, `materiallySpecific`, `specificChannelCount`, `dominantEvidenceTier`, `channelTiers`)
6. Either add the missing fields to the shared type, or remove the local `GlobalBaselineResult` interface inside the script and import from `src/types/company.ts`

### Priority 2 — Create the `public/docs/global-baseline-results/` placeholder (RC-2)

Add a `.gitkeep` file (or a placeholder `latest.json`) at `public/docs/global-baseline-results/.gitkeep` so the directory is committed to the repo and available in all deployments. The global workflow's copy step will then succeed.

### Priority 3 — Fix the git push race condition (RC-1, RC-10)

1. **Global workflow**: Replace `git pull --rebase origin HEAD || true` with a proper conflict-aware pull that fails loudly on conflict rather than silently dropping changes
2. **SEC workflow**: Add `git pull --rebase origin HEAD || true` before the push (same as global workflow, but with proper error handling)
3. Consider using a single workflow with a matrix strategy, or serializing the two workflows with `workflow_run` dependencies

### Priority 4 — Add GitHub loader to Global tab (RC-7)

The Global tab should have the same GitHub loader panel as the SEC tab, fetching from:
```
https://raw.githubusercontent.com/{slug}/main/public/docs/global-baseline-results/latest.json
```

### Priority 5 — Fix the `r.name` crash in Global tab search (RC-9)

Add a null guard:
```typescript
!(r.name ?? '').toLowerCase().includes(q)
```

### Priority 6 — Always copy to `public/` regardless of diff (RC-6)

Remove the `changed == 'true'` gate from the copy step, or add a separate unconditional copy step that always runs after the script completes.

### Priority 7 — Add secrets validation and degraded-mode banner (RC-5, RC-12)

1. Add a visible warning banner in the dashboard when `_degradedMode: true` is present in the loaded JSON
2. Document that `OPENAI_API_KEY` is required for non-zero narrative parsing results

### Priority 8 — Implement the 211-company combined view (RC-8)

Options:
- **Option A (recommended):** Add a "Combined" tab to the dashboard that merges `secResults` and `globalResults` arrays, deduplicating by ticker (ADR equivalents like VALE3/VALE, RIO.L/RIO appear in both)
- **Option B:** Modify the Global workflow to append global results to the SEC `latest.json` rather than writing a separate file
- **Option C:** Add a summary stats card at the top of the dashboard showing combined totals across both tabs

---

## 8. Verification Checklist

Before the next baseline run, verify:

- [ ] `OPENAI_API_KEY` secret is set in GitHub repository settings
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets are set
- [ ] `FMP_API_KEY` secret is set (for Global baseline)
- [ ] `public/docs/global-baseline-results/` directory exists in repo (with `.gitkeep`)
- [ ] `public/docs/baseline-results/latest.json` is not the placeholder (check `runId !== 'pending-first-run'`)
- [ ] Global script result object uses `name` (not `companyName`)
- [ ] Global script result object uses `filingSource` (not `dataSource`)
- [ ] Global script result object uses `runDate` (not `filingDate` / `timestamp`)
- [ ] Dashboard Global tab search uses `r.name ?? ''` null guard

---

## 9. Appendix — Key File Locations

| File | Purpose |
|------|---------|
| `/workspace/shadcn-ui/.github/workflows/run-sec-baseline.yml` | SEC baseline GitHub Actions workflow |
| `/workspace/shadcn-ui/.github/workflows/run-global-baseline.yml` | Global baseline GitHub Actions workflow |
| `/workspace/shadcn-ui/src/scripts/runSECBaseline.ts` | SEC baseline Node.js script (line 442: BaselineResult interface, line 2466: result init) |
| `/workspace/shadcn-ui/src/scripts/runGlobalBaseline.ts` | Global baseline Node.js script (line 190: local GlobalBaselineResult interface, line 1444: result init) |
| `/workspace/shadcn-ui/src/types/company.ts` | Shared TypeScript types (line 272: GlobalBaselineResult, line 338: GlobalRunSummary) |
| `/workspace/shadcn-ui/src/pages/BaselineResultsDashboard.tsx` | Dashboard UI (line 79: BaselineResult, line 122: RunSummary, line 594: loadGlobalData) |
| `/workspace/shadcn-ui/public/docs/baseline-results/latest.json` | Current SEC results (placeholder — no real data) |
| `public/docs/global-baseline-results/` | **Does not exist** — must be created |

---

*End of investigation report. No code changes were made during this investigation.*