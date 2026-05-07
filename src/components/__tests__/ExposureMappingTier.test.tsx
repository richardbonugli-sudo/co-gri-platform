/**
 * Tests for ExposureMappingTier component
 */

import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ExposureMappingTier } from '../ExposureMappingTier';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';
import type { AdjustedExposure } from '@/services/forecastEngine';

const mockExposures: AdjustedExposure[] = [
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

describe('ExposureMappingTier', () => {
  test('renders tier header', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Tier 2: Exposure Mapping')).toBeInTheDocument();
    expect(screen.getByText('Detailed country-by-country exposure analysis')).toBeInTheDocument();
  });

  test('displays summary statistics', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Total Countries')).toBeInTheDocument();
    // Use getAllByText for elements that may appear multiple times
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Average Change')).toBeInTheDocument();
    expect(screen.getByText('Improving')).toBeInTheDocument();
    // Use getAllByText for numbers that may appear multiple times
    const oneElements = screen.getAllByText('1');
    expect(oneElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Deteriorating')).toBeInTheDocument();
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  test('displays all countries in table', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('displays CSI values correctly', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('45.00')).toBeInTheDocument(); // US base CSI
    expect(screen.getByText('43.80')).toBeInTheDocument(); // US adjusted CSI
    expect(screen.getByText('54.80')).toBeInTheDocument(); // CN adjusted CSI
  });

  test('search functionality filters countries', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by country name/i);
    fireEvent.change(searchInput, { target: { value: 'China' } });

    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.queryByText('United States')).not.toBeInTheDocument();
  });

  test('export CSV button is present', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={true}
        onToggle={() => {}}
      />
    );

    const exportButton = screen.getByRole('button', { name: /export csv/i });
    expect(exportButton).toBeInTheDocument();
  });

  test('does not render content when collapsed', () => {
    render(
      <ExposureMappingTier
        exposures={mockExposures}
        forecast={CEDAROWL_FORECAST_2026}
        isExpanded={false}
        onToggle={() => {}}
      />
    );

    expect(screen.queryByText('Total Countries')).not.toBeInTheDocument();
  });
});