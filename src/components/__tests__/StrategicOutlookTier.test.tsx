/**
 * Tests for StrategicOutlookTier component
 */

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrategicOutlookTier } from '../StrategicOutlookTier';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';
import type { COGRIResult } from '@/utils/cogriCalculator';
import type { AdjustedExposure } from '@/services/forecastEngine';

const mockAdjustedExposures: AdjustedExposure[] = [
  {
    countryCode: 'VE',
    countryName: 'Venezuela',
    baseCsi: 75.0,
    exposureAmount: 100000,
    adjustedCsi: 83.5,
    delta: 8.5,
    forecastDrivers: ['Post-intervention', 'Oil recovery'],
    outlook: 'HIGH_RISK',
    riskTrend: 'IMPROVING',
    expectedReturn: 0.18,
    applicableEvents: []
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    baseCsi: 38.0,
    exposureAmount: 500000,
    adjustedCsi: 34.5,
    delta: -3.5,
    forecastDrivers: ['Deindustrialization', 'Energy crisis'],
    outlook: 'UNDERPERFORM',
    riskTrend: 'DETERIORATING',
    expectedReturn: 0.005,
    applicableEvents: []
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    baseCsi: 48.0,
    exposureAmount: 300000,
    adjustedCsi: 51.1,
    delta: 3.1,
    forecastDrivers: ['Demographics', 'Infrastructure boom'],
    outlook: 'STRONG_BUY',
    riskTrend: 'IMPROVING',
    expectedReturn: 0.13,
    applicableEvents: []
  },
];

const mockResult: COGRIResult = {
  score: 45.2,
  riskLevel: 'MEDIUM',
  countryBreakdown: [],
  forecastMetadata: {
    applied: true,
    forecastYear: '2026',
    appliedAt: '2026-01-08T12:00:00Z',
    adjustedExposures: 3,
    totalExposures: 3,
    guardrailsValid: true
  }
};

describe('StrategicOutlookTier', () => {
  test('renders tier header', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Tier 1: Strategic Outlook')).toBeInTheDocument();
    expect(screen.getByText('Executive summary and key strategic insights')).toBeInTheDocument();
  });

  test('displays executive summary cards', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Net Portfolio Impact')).toBeInTheDocument();
    expect(screen.getByText('Risk Trend')).toBeInTheDocument();
    expect(screen.getByText('Forecast Confidence')).toBeInTheDocument();
  });

  test('calculates average delta correctly', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    // Average: (8.5 + (-3.5) + 3.1) / 3 = 2.7
    expect(screen.getByText('+2.70')).toBeInTheDocument();
  });

  test('determines overall risk trend correctly', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    // 2 improving, 1 deteriorating = IMPROVING overall
    expect(screen.getByText('IMPROVING')).toBeInTheDocument();
    expect(screen.getByText('2 improving, 1 deteriorating')).toBeInTheDocument();
  });

  test('displays top 3 geopolitical events', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Key Geopolitical Events')).toBeInTheDocument();
    
    // Top 3 events by probability: New START (100%), US-Venezuela (95%), NATO Summit (90%)
    expect(screen.getByText('New START Treaty Expiry')).toBeInTheDocument();
    expect(screen.getByText('US-Venezuela Intervention')).toBeInTheDocument();
    expect(screen.getByText('NATO Summit - Ukraine Security Framework')).toBeInTheDocument();
  });

  test('displays highest risk increases', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Highest Risk Increases')).toBeInTheDocument();
    expect(screen.getByText('Venezuela')).toBeInTheDocument();
    expect(screen.getByText('+8.50')).toBeInTheDocument();
  });

  test('displays highest risk decreases', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Highest Risk Decreases')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('-3.50')).toBeInTheDocument();
  });

  test('displays investment implications', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Investment Implications')).toBeInTheDocument();
    expect(screen.getByText('Recommended Overweights')).toBeInTheDocument();
    expect(screen.getByText('Key Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Risks to Monitor')).toBeInTheDocument();
  });

  test('shows overweight asset classes', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    // Gold/Silver, Commodities, EM Equities are OVERWEIGHT
    expect(screen.getByText(/Gold\/Silver: \+15%/)).toBeInTheDocument();
    expect(screen.getByText(/Commodities: \+12%/)).toBeInTheDocument();
    expect(screen.getByText(/EM Equities: \+10%/)).toBeInTheDocument();
  });

  test('displays confidence percentage', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('15 Expert Sources')).toBeInTheDocument();
  });

  test('does not render content when collapsed', () => {
    render(
      <StrategicOutlookTier
        result={mockResult}
        forecast={CEDAROWL_FORECAST_2026}
        exposures={mockAdjustedExposures}
        isExpanded={false}
        onToggle={() => {}}
      />
    );

    expect(screen.queryByText('Net Portfolio Impact')).not.toBeInTheDocument();
  });
});