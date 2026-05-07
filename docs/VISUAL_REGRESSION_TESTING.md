# Visual Regression Testing Guide

## Overview
This guide covers the visual regression test suite for the CO-GRI Platform's Company Mode, testing all 9 components across 4 analytical lenses (36 test cases total).

## Test Coverage

### Components Tested (C1-C9)
1. **C1: Company Summary Panel** - Company overview with CO-GRI score
2. **C2: COGRI Trend Chart** - Historical trend visualization
3. **C3: Risk Contribution Map** - Geographic risk visualization
4. **C4: Exposure Pathways** - Four-channel exposure breakdown
5. **C5: Top Relevant Risks** - Material geopolitical risks
6. **C6: Peer Comparison** - Comparative analysis
7. **C7: Risk Attribution** - Risk contribution breakdown
8. **C8: Timeline Event Feed** - Geopolitical events timeline
9. **C9: Verification Drawer** - Calculation audit trail

### Lenses Tested
- **Structural** (Blue) - Current state
- **Forecast Overlay** (Purple) - Probability-weighted expected path
- **Scenario Shock** (Orange) - Conditional stress test
- **Trading Signal** (Green) - Implementation output

### Test Matrix
Total test cases: **36 component-lens combinations** + **additional UI tests**

## Prerequisites

### Install Playwright
```bash
cd /workspace/shadcn-ui
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Install Browsers
```bash
pnpm exec playwright install chromium
```

## Running Tests

### Run All Visual Tests
```bash
pnpm exec playwright test
```

### Run Specific Test Suite
```bash
# Test specific component
pnpm exec playwright test --grep "C1: Company Summary Panel"

# Test specific lens
pnpm exec playwright test --grep "Structural lens"

# Test full page screenshots
pnpm exec playwright test --grep "Full Page Screenshots"
```

### Update Baseline Screenshots
When intentional UI changes are made, update baselines:
```bash
pnpm exec playwright test --update-snapshots
```

### Run in UI Mode (Interactive)
```bash
pnpm exec playwright test --ui
```

### Run in Debug Mode
```bash
pnpm exec playwright test --debug
```

### Generate HTML Report
```bash
pnpm exec playwright show-report
```

## Test Structure

### Directory Layout
```
src/__tests__/visual/
├── companyModeVisualRegression.spec.ts  # Main test suite
└── screenshots/                          # Baseline screenshots
    ├── c1-company-summary-structural.png
    ├── c1-company-summary-forecast-overlay.png
    ├── c2-cogri-trend-structural.png
    └── ...
```

### Test Organization
Tests are organized by:
1. **Full Page Screenshots** - Complete page view for each lens
2. **Component Screenshots** - Individual component for each lens
3. **Tab Navigation** - Tab bar and switching behavior
4. **Layout Consistency** - Three-column layout verification
5. **Lens Badge Consistency** - Badge positioning and content
6. **Responsive Design** - Multiple viewport sizes

## Adding Test IDs to Components

To enable visual regression testing, add `data-testid` attributes to components:

```tsx
// Example: Company Summary Panel
<Card data-testid="company-summary-panel">
  <CardHeader>
    <div data-testid="lens-badge">
      <LensBadge lens={activeLens} />
    </div>
    {/* ... */}
  </CardHeader>
</Card>
```

### Required Test IDs
- `data-testid="company-summary-panel"` - C1
- `data-testid="cogri-trend-chart"` - C2
- `data-testid="risk-contribution-map"` - C3
- `data-testid="exposure-pathways"` - C4
- `data-testid="top-relevant-risks"` - C5
- `data-testid="peer-comparison"` - C6
- `data-testid="risk-attribution"` - C7
- `data-testid="timeline-event-feed"` - C8
- `data-testid="verification-drawer"` - C9
- `data-testid="lens-badge"` - Lens badge in each component
- `data-testid="company-mode-tabs"` - Tab navigation bar

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium
        
      - name: Run visual regression tests
        run: pnpm exec playwright test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: failed-screenshots
          path: src/__tests__/visual/screenshots/
```

## Maintenance

### When to Update Baselines
Update baseline screenshots when:
- Intentional UI changes are made
- Component styling is updated
- Layout is modified
- New features are added

### Handling Test Failures
1. **Review Diff**: Check the visual diff in the HTML report
2. **Verify Change**: Ensure the change is intentional
3. **Update Baseline**: If intentional, run with `--update-snapshots`
4. **Fix Bug**: If unintentional, fix the UI issue

### Best Practices
1. **Disable Animations**: Use `animations: 'disabled'` to prevent flaky tests
2. **Wait for Load**: Ensure components are fully loaded before screenshots
3. **Consistent Viewport**: Use fixed viewport sizes (1920x1080)
4. **Stable Data**: Use mock data to ensure consistent screenshots
5. **Timeout Handling**: Set appropriate timeouts for slow-loading components

## Troubleshooting

### Tests Failing Locally
```bash
# Clear Playwright cache
pnpm exec playwright cache clear

# Reinstall browsers
pnpm exec playwright install --force chromium

# Update snapshots
pnpm exec playwright test --update-snapshots
```

### Screenshots Don't Match
1. Check if animations are disabled
2. Verify viewport size is consistent
3. Ensure data is stable (not random)
4. Check for timing issues (add waits if needed)

### Slow Test Execution
1. Run tests in parallel: `pnpm exec playwright test --workers=4`
2. Run only changed tests: `pnpm exec playwright test --grep "C1"`
3. Use headed mode only when debugging: `pnpm exec playwright test --headed`

## Performance Metrics

### Expected Test Duration
- Single component test: ~2-3 seconds
- Full test suite (36 tests): ~2-3 minutes
- With retries on CI: ~5-6 minutes

### Screenshot Storage
- Average screenshot size: 100-200 KB
- Total baseline storage: ~10-15 MB
- Consider using Git LFS for large screenshot sets

## Reporting

### HTML Report
Generated at `playwright-report/index.html`
- Visual diffs with before/after comparison
- Test execution timeline
- Failure screenshots and traces

### JSON Report
Generated at `playwright-report/results.json`
- Machine-readable test results
- Integration with external tools
- Metrics and statistics

## Future Enhancements

### Planned Improvements
1. **Cross-Browser Testing** - Add Firefox and WebKit
2. **Mobile Testing** - Add mobile viewport tests
3. **Accessibility Testing** - Integrate axe-core
4. **Performance Testing** - Add Lighthouse CI
5. **Visual Diff Service** - Integrate Percy or Chromatic

### Test Coverage Goals
- [ ] 100% component coverage (9/9 components)
- [ ] 100% lens coverage (4/4 lenses)
- [ ] Responsive design coverage (3+ viewports)
- [ ] Cross-browser coverage (Chromium, Firefox, WebKit)
- [ ] Accessibility compliance (WCAG 2.1 AA)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Comparison Best Practices](https://playwright.dev/docs/test-snapshots)
- [CI/CD Integration Guide](https://playwright.dev/docs/ci)
- [Debugging Guide](https://playwright.dev/docs/debug)