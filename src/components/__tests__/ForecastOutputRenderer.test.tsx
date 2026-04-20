/**
 * Tests for ForecastOutputRenderer component
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ForecastOutputRenderer } from '../ForecastOutputRenderer';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';
import type { AdjustedExposure } from '@/services/forecastEngine';
import type { Exposure } from '@/services/forecastEngine';
import type { COGRIResult } from '@/utils/cogriCalculator';

// Mock original exposures data
const mockOriginalExposures: Exposure[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    exposureAmount: 1000000,
    sector: 'Technology'
  },
  {
    countryCode: 'CN',
    countryName: 'China',
    exposureAmount: 500000,
    sector: 'Manufacturing'
  }
];

// Mock adjusted exposures data
const mockAdjustedExposures: AdjustedExposure[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    baseCsi: 45.0,
    exposureAmount: 1000000,
    adjustedCsi: 43.8,
    delta: -1.2,
    forecastDrivers: ['Tech regulation', 'Tariffs'],
    outlook: 'NEUTRAL',
    riskTrend: 'STABLE',
    expectedReturn: 0.03,
    applicableEvents: []
  },
  {
    countryCode: 'CN',
    countryName: 'China',
    baseCsi: 52.0,
    exposureAmount: 500000,
    adjustedCsi: 54.8,
    delta: 2.8,
    forecastDrivers: ['Tech dominance', 'Belt & Road'],
    outlook: 'OVERWEIGHT',
    riskTrend: 'STABLE',
    expectedReturn: 0.11,
    applicableEvents: []
  }
];

// Mock result data
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

describe('ForecastOutputRenderer', () => {
  test('renders main header', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    expect(screen.getByText('Strategic Forecast Baseline')).toBeInTheDocument();
  });

  test('displays company name and forecast period', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    expect(screen.getByText(/Test Company/)).toBeInTheDocument();
    // Use getAllByText for elements that may appear multiple times
    const periodElements = screen.getAllByText(/2026-01-01 to 2026-12-31/);
    expect(periodElements.length).toBeGreaterThan(0);
  });

  test('renders all three tiers', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    expect(screen.getByText('Tier 1: Strategic Outlook')).toBeInTheDocument();
    expect(screen.getByText('Tier 2: Exposure Mapping')).toBeInTheDocument();
    expect(screen.getByText('Tier 3: Quantitative Anchors')).toBeInTheDocument();
  });

  test('tier expansion toggles work', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    // Tier 1 should be expanded by default - check for content that appears when expanded
    expect(screen.getByText('Net Portfolio Impact')).toBeInTheDocument();

    // Click to collapse Tier 1
    const tier1Header = screen.getByText('Tier 1: Strategic Outlook');
    fireEvent.click(tier1Header);

    // Net Portfolio Impact should no longer be visible when collapsed
    expect(screen.queryByText('Net Portfolio Impact')).not.toBeInTheDocument();
  });

  test('print button is present', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    const printButton = screen.getByRole('button', { name: /print/i });
    expect(printButton).toBeInTheDocument();
  });

  test('calculates summary metrics correctly', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    // Check that CO-GRI score is displayed in the result
    expect(screen.getByText(/MEDIUM/)).toBeInTheDocument();
    // Check forecast period - use getAllByText for elements that may appear multiple times
    const periodElements = screen.getAllByText(/2026-01-01 to 2026-12-31/);
    expect(periodElements.length).toBeGreaterThan(0);
    // Check countries analyzed
    expect(screen.getByText(/2 \(2 adjusted\)/)).toBeInTheDocument();
  });

  test('export button is present', () => {
    render(
      <ForecastOutputRenderer
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockOriginalExposures}
        adjustedExposures={mockAdjustedExposures}
        result={mockResult}
        companyName="Test Company"
      />
    );

    // Find export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });
});