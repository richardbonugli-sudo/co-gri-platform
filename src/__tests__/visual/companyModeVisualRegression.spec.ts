/**
 * Visual Regression Test Suite for Company Mode
 * Week 1 - Task 1b: Automated visual tests for all 9 components × 4 lenses (36 test cases)
 * 
 * Uses Playwright for screenshot comparison and visual regression detection
 *
 * FIXES APPLIED:
 * - Removed invalid snapshot names containing '/images/' path separators
 *   (e.g. '/images/VerificationDrawer.jpg', 'tab-bar-.../images/TabBar.jpg',
 *   'c1_companysummary/images/LensBadge.jpg'). Playwright snapshot names must
 *   be plain filenames — forward slashes are treated as directory separators
 *   on Linux runners and cause snapshot mismatch / file-not-found errors.
 * - Replaced all .jpg snapshot extensions with .png (Playwright toHaveScreenshot
 *   default format is PNG; using .jpg requires explicit { type: 'jpeg' } option
 *   and causes format mismatch failures).
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const VIEWPORT = { width: 1920, height: 1080 };
const TICKER = 'AAPL';
const BASE_URL = '/company-mode?ticker=' + TICKER;

// Lens types to test
const LENSES = ['Structural', 'Forecast Overlay', 'Scenario Shock', 'Trading Signal'] as const;
type Lens = typeof LENSES[number];

// Component selectors (update based on actual implementation)
const COMPONENT_SELECTORS = {
  'C1_CompanySummary': '[data-testid="company-summary-panel"]',
  'C2_COGRITrend': '[data-testid="cogri-trend-chart"]',
  'C3_RiskContributionMap': '[data-testid="risk-contribution-map"]',
  'C4_ExposurePathways': '[data-testid="exposure-pathways"]',
  'C5_TopRelevantRisks': '[data-testid="top-relevant-risks"]',
  'C6_PeerComparison': '[data-testid="peer-comparison"]',
  'C7_RiskAttribution': '[data-testid="risk-attribution"]',
  'C8_TimelineEventFeed': '[data-testid="timeline-event-feed"]',
  'C9_VerificationDrawer': '[data-testid="verification-drawer"]'
};

/**
 * Helper function to switch lens
 */
async function switchLens(page: Page, lens: Lens) {
  await page.click(`button:has-text("${lens}")`);
  await page.waitForTimeout(500);
}

/**
 * Helper function to wait for component to load
 */
async function waitForComponentLoad(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
}

test.describe('Company Mode Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="company-summary-panel"]', { timeout: 15000 });
  });

  test.describe('Full Page Screenshots by Lens', () => {
    for (const lens of LENSES) {
      test(`Full page - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await expect(page).toHaveScreenshot(`full-page-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          fullPage: true,
          animations: 'disabled',
          timeout: 30000
        });
      });
    }
  });

  test.describe('C1: Company Summary Panel', () => {
    for (const lens of LENSES) {
      test(`C1 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C1_CompanySummary);
        const component = page.locator(COMPONENT_SELECTORS.C1_CompanySummary);
        await expect(component).toHaveScreenshot(`c1-company-summary-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }

    test('C1 - Lens badge visibility', async ({ page }) => {
      for (const lens of LENSES) {
        await switchLens(page, lens);
        const lensBadge = page.locator(`${COMPONENT_SELECTORS.C1_CompanySummary} [data-testid="lens-badge"]`);
        await expect(lensBadge).toBeVisible();
        await expect(lensBadge).toContainText(lens);
      }
    });
  });

  test.describe('C2: COGRI Trend Chart', () => {
    for (const lens of LENSES) {
      test(`C2 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C2_COGRITrend);
        const component = page.locator(COMPONENT_SELECTORS.C2_COGRITrend);
        await expect(component).toHaveScreenshot(`c2-cogri-trend-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C3: Risk Contribution Map', () => {
    for (const lens of LENSES) {
      test(`C3 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C3_RiskContributionMap);
        const component = page.locator(COMPONENT_SELECTORS.C3_RiskContributionMap);
        await expect(component).toHaveScreenshot(`c3-risk-contribution-map-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C4: Exposure Pathways', () => {
    for (const lens of LENSES) {
      test(`C4 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C4_ExposurePathways);
        const component = page.locator(COMPONENT_SELECTORS.C4_ExposurePathways);
        await expect(component).toHaveScreenshot(`c4-exposure-pathways-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C5: Top Relevant Risks', () => {
    for (const lens of LENSES) {
      test(`C5 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C5_TopRelevantRisks);
        const component = page.locator(COMPONENT_SELECTORS.C5_TopRelevantRisks);
        await expect(component).toHaveScreenshot(`c5-top-relevant-risks-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C6: Peer Comparison', () => {
    for (const lens of LENSES) {
      test(`C6 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C6_PeerComparison);
        const component = page.locator(COMPONENT_SELECTORS.C6_PeerComparison);
        await expect(component).toHaveScreenshot(`c6-peer-comparison-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C7: Risk Attribution', () => {
    for (const lens of LENSES) {
      test(`C7 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C7_RiskAttribution);
        const component = page.locator(COMPONENT_SELECTORS.C7_RiskAttribution);
        await expect(component).toHaveScreenshot(`c7-risk-attribution-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C8: Timeline Event Feed', () => {
    for (const lens of LENSES) {
      test(`C8 - ${lens} lens`, async ({ page }) => {
        await switchLens(page, lens);
        await waitForComponentLoad(page, COMPONENT_SELECTORS.C8_TimelineEventFeed);
        const component = page.locator(COMPONENT_SELECTORS.C8_TimelineEventFeed);
        await expect(component).toHaveScreenshot(`c8-timeline-event-feed-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('C9: Verification Drawer', () => {
    test('C9 - Collapsed by default', async ({ page }) => {
      const drawer = page.locator(COMPONENT_SELECTORS.C9_VerificationDrawer);
      const isCollapsed = await drawer.evaluate((el) => {
        return el.getAttribute('data-state') === 'closed' ||
               !el.querySelector('[data-testid="verification-content"]')?.checkVisibility();
      });
      expect(isCollapsed).toBeTruthy();
    });

    test('C9 - Expanded state', async ({ page }) => {
      // FIX: was '/images/VerificationDrawer.jpg' — invalid path separator + wrong format
      await page.click(`${COMPONENT_SELECTORS.C9_VerificationDrawer} button:has-text("Expand")`);
      await page.waitForTimeout(500);
      const component = page.locator(COMPONENT_SELECTORS.C9_VerificationDrawer);
      await expect(component).toHaveScreenshot('c9-verification-drawer-expanded.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Tab Navigation', () => {
    test('Tab switching visual feedback', async ({ page }) => {
      for (const lens of LENSES) {
        await switchLens(page, lens);
        // FIX: was `tab-bar-.../images/TabBar.jpg` — invalid path separator + wrong format
        const tabBar = page.locator('[data-testid="company-mode-tabs"]');
        await expect(tabBar).toHaveScreenshot(`tab-bar-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        });
      }
    });

    test('Tab colors match lens colors', async ({ page }) => {
      const expectedColors = {
        'Structural': 'rgb(59, 130, 246)',
        'Forecast Overlay': 'rgb(139, 92, 246)',
        'Scenario Shock': 'rgb(249, 115, 22)',
        'Trading Signal': 'rgb(16, 185, 129)'
      };

      for (const [lens, expectedColor] of Object.entries(expectedColors)) {
        await switchLens(page, lens as Lens);
        const activeTab = page.locator(`button:has-text("${lens}")[data-state="active"]`);
        const bgColor = await activeTab.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        expect(bgColor).toBe(expectedColor);
      }
    });
  });

  test.describe('Layout Consistency', () => {
    test('Three-column layout maintained across lenses', async ({ page }) => {
      for (const lens of LENSES) {
        await switchLens(page, lens);
        const leftColumn = page.locator('[data-testid="left-column"]');
        await expect(leftColumn).toBeVisible();
        const centerColumn = page.locator('[data-testid="center-column"]');
        await expect(centerColumn).toBeVisible();
        const rightColumn = page.locator('[data-testid="right-column"]');
        await expect(rightColumn).toBeVisible();
        await expect(page).toHaveScreenshot(`layout-${lens.toLowerCase().replace(/\s+/g, '-')}.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Lens Badge Consistency', () => {
    test('All components display lens badge', async ({ page }) => {
      for (const lens of LENSES) {
        await switchLens(page, lens);
        for (const [componentName, selector] of Object.entries(COMPONENT_SELECTORS)) {
          if (componentName === 'C9_VerificationDrawer') continue;
          const lensBadge = page.locator(`${selector} [data-testid="lens-badge"]`);
          await expect(lensBadge).toBeVisible();
          await expect(lensBadge).toContainText(lens);
        }
      }
    });

    test('Lens badge positioning consistent', async ({ page }) => {
      await switchLens(page, 'Structural');
      // FIX: was `${componentName.toLowerCase()}/images/LensBadge.jpg` — invalid path separator + wrong format
      for (const [componentName, selector] of Object.entries(COMPONENT_SELECTORS)) {
        if (componentName === 'C9_VerificationDrawer') continue;
        const component = page.locator(selector);
        await expect(component).toHaveScreenshot(`${componentName.toLowerCase()}-lens-badge.png`, {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-medium' },
      { width: 1024, height: 768, name: 'tablet-landscape' }
    ];

    for (const viewport of viewports) {
      test(`Layout at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await switchLens(page, 'Structural');
        await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    }
  });
});
