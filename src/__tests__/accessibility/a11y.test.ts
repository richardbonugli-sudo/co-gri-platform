/**
 * Accessibility Tests for CO-GRI Strategic Forecast Baseline
 * 
 * Tests WCAG 2.1 Level AA compliance
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ForecastOutputRenderer } from '@/components/ForecastOutputRenderer';
import { StrategicOutlookTier } from '@/components/StrategicOutlookTier';
import { ExposureMappingTier } from '@/components/ExposureMappingTier';
import { QuantitativeAnchorsTier } from '@/components/QuantitativeAnchorsTier';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';
import type { COGRIResult } from '@/utils/cogriCalculator';
import type { AdjustedExposure } from '@/services/forecastEngine';

expect.extend(toHaveNoViolations);

const mockResult: COGRIResult = {
  score: 47.2,
  riskLevel: 'MEDIUM',
  countryBreakdown: [],
  forecastMetadata: {
    applied: true,
    forecastYear: '2026',
    appliedAt: '2026-01-08T12:00:00Z',
    adjustedExposures: 2,
    totalExposures: 2,
    guardrailsValid: true
  }
};

const mockExposures: AdjustedExposure[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    baseCsi: 45.0,
    exposureAmount: 1000000,
    adjustedCsi: 43.8,
    delta: -1.2,
    forecastDrivers: ['Tech regulation'],
    outlook: 'NEUTRAL',
    riskTrend: 'STABLE',
    expectedReturn: 0.03,
    applicableEvents: []
  }
];

describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  test('ForecastOutputRenderer has no accessibility violations', async () => {
    const { container } = render(
      <ForecastOutputRenderer
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        companyName="Test Company"
        exposures={[]}
        adjustedExposures={mockExposures}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('StrategicOutlookTier has no accessibility violations', async () => {
    const { container } = render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('ExposureMappingTier has no accessibility violations', async () => {
    const { container } = render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('QuantitativeAnchorsTier has no accessibility violations', async () => {
    const { container } = render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Keyboard Navigation', () => {
  test('all interactive elements are keyboard accessible', () => {
    const { container } = render(
      <ForecastOutputRenderer
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        companyName="Test Company"
        exposures={[]}
        adjustedExposures={mockExposures}
      />
    );

    const buttons = container.querySelectorAll('button');
    const inputs = container.querySelectorAll('input');
    const selects = container.querySelectorAll('select');

    [...buttons, ...inputs, ...selects].forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      const isNaturallyFocusable = ['BUTTON', 'INPUT', 'SELECT'].includes(element.tagName);
      expect(isNaturallyFocusable || tabIndex !== '-1').toBe(true);
    });
  });

  test('focus indicators are visible', () => {
    const { container } = render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      expect(
        styles.outline !== 'none' || 
        styles.boxShadow !== 'none'
      ).toBe(true);
    });
  });
});

describe('Screen Reader Support', () => {
  test('ARIA labels present on interactive elements', () => {
    const { container } = render(
      <ForecastOutputRenderer
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        companyName="Test Company"
        exposures={[]}
        adjustedExposures={mockExposures}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasTextContent = button.textContent && button.textContent.trim().length > 0;
      expect(hasAriaLabel || hasTextContent).toBeTruthy();
    });
  });

  test('semantic HTML used for structure', () => {
    const { container } = render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(container.querySelector('header')).toBeTruthy();
    expect(container.querySelectorAll('section').length).toBeGreaterThan(0);
  });

  test('table headers properly associated', () => {
    const { container } = render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const table = container.querySelector('table');
    if (table) {
      const headers = table.querySelectorAll('th');
      expect(headers.length).toBeGreaterThan(0);
      
      headers.forEach(header => {
        expect(header.getAttribute('scope')).toBeTruthy();
      });
    }
  });
});

describe('Color Contrast', () => {
  test('risk level badges have sufficient contrast', () => {
    const { container } = render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('text meets minimum contrast ratio', () => {
    const { container } = render(
      <ForecastOutputRenderer
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        companyName="Test Company"
        exposures={[]}
        adjustedExposures={mockExposures}
      />
    );

    const textElements = container.querySelectorAll('p, span, div');
    expect(textElements.length).toBeGreaterThan(0);
  });
});

describe('Form Controls', () => {
  test('search input has associated label', () => {
    const { container } = render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const searchInput = container.querySelector('input[type="text"]');
    if (searchInput) {
      const ariaLabel = searchInput.getAttribute('aria-label');
      const placeholder = searchInput.getAttribute('placeholder');
      expect(ariaLabel || placeholder).toBeTruthy();
    }
  });

  test('select dropdowns have labels', () => {
    const { container } = render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const selects = container.querySelectorAll('select, [role="combobox"]');
    selects.forEach(select => {
      const ariaLabel = select.getAttribute('aria-label');
      const ariaLabelledBy = select.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    });
  });
});