/**
 * Tests for QuantitativeAnchorsTier component
 */

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuantitativeAnchorsTier } from '../QuantitativeAnchorsTier';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';
import type { COGRIResult } from '@/utils/cogriCalculator';

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

describe('QuantitativeAnchorsTier', () => {
  test('renders tier header', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Tier 3: Quantitative Anchors')).toBeInTheDocument();
    expect(screen.getByText('Complete technical data and methodology details')).toBeInTheDocument();
  });

  test('displays sector multipliers table', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    // Use getAllByText for elements that may appear multiple times
    const sectorMultiplierElements = screen.getAllByText('Sector Multipliers');
    expect(sectorMultiplierElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('1.60x')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('1.40x')).toBeInTheDocument();
  });

  test('displays regional risk premiums table', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    // Use getAllByText for elements that may appear multiple times
    const regionalRiskElements = screen.getAllByText('Regional Risk Premiums');
    expect(regionalRiskElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Middle East')).toBeInTheDocument();
    // Use getAllByText for multipliers that may appear multiple times
    const multiplierElements = screen.getAllByText('1.35x');
    expect(multiplierElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.getByText('1.12x')).toBeInTheDocument();
  });

  test('displays asset class forecasts table', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Asset Class Forecasts')).toBeInTheDocument();
    expect(screen.getByText('Gold/Silver')).toBeInTheDocument();
    expect(screen.getByText('+15.0%')).toBeInTheDocument();
    // Use getAllByText for elements that may appear multiple times
    const overweightElements = screen.getAllByText('OVERWEIGHT');
    expect(overweightElements.length).toBeGreaterThan(0);
  });

  test('displays geopolitical events', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Geopolitical Events (Complete List)')).toBeInTheDocument();
    expect(screen.getByText('US-Venezuela Intervention')).toBeInTheDocument();
    expect(screen.getByText('New START Treaty Expiry')).toBeInTheDocument();
  });

  test('displays forecast metadata', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Forecast Metadata')).toBeInTheDocument();
    // Use getAllByText for elements that may appear multiple times
    const forecastPeriodElements = screen.getAllByText('Forecast Period');
    expect(forecastPeriodElements.length).toBeGreaterThan(0);
    const periodValueElements = screen.getAllByText('2026-01-01 to 2026-12-31');
    expect(periodValueElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Publish Date')).toBeInTheDocument();
    expect(screen.getByText('2026-01-07')).toBeInTheDocument();
  });

  test('displays methodology notes', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Methodology Notes')).toBeInTheDocument();
    expect(screen.getByText('Forecast Delta Application')).toBeInTheDocument();
    expect(screen.getByText('Guardrails Enforced')).toBeInTheDocument();
    expect(screen.getByText('Limitations and Assumptions')).toBeInTheDocument();
  });

  test('copy buttons are present', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  test('does not render content when collapsed', () => {
    render(
      <QuantitativeAnchorsTier
        forecast={CEDAROWL_FORECAST_2026}
        result={mockResult}
        isExpanded={false}
        onToggle={() => {}}
      />
    );

    expect(screen.queryByText('Asset Class Forecasts')).not.toBeInTheDocument();
  });
});