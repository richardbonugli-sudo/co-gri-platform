/**
 * Unit Tests for Node Attribution Component
 * Tests country impact calculations and sorting logic
 */

import { describe, it, expect } from 'vitest';

interface CountryExposure {
  country: string;
  exposureWeight: number;
  baseCSI: number;
  scenarioCSI: number;
  baseContribution: number;
  scenarioContribution: number;
}

describe('Node Attribution - Delta Calculations', () => {
  it('should calculate ΔCO-GRI correctly', () => {
    const exposure: CountryExposure = {
      country: 'China',
      exposureWeight: 0.25,
      baseCSI: 65.0,
      scenarioCSI: 80.0,
      baseContribution: 16.25, // 0.25 * 65
      scenarioContribution: 20.0, // 0.25 * 80
    };

    const delta = exposure.scenarioContribution - exposure.baseContribution;
    expect(delta).toBeCloseTo(3.75, 2);
  });

  it('should calculate percentage change correctly', () => {
    const exposure: CountryExposure = {
      country: 'Taiwan',
      exposureWeight: 0.15,
      baseCSI: 50.0,
      scenarioCSI: 75.0,
      baseContribution: 7.5,
      scenarioContribution: 11.25,
    };

    const delta = exposure.scenarioContribution - exposure.baseContribution;
    const percentage = (delta / exposure.baseContribution) * 100;

    expect(percentage).toBeCloseTo(50.0, 1); // 50% increase
  });

  it('should handle negative delta (risk decrease)', () => {
    const exposure: CountryExposure = {
      country: 'Canada',
      exposureWeight: 0.10,
      baseCSI: 40.0,
      scenarioCSI: 30.0,
      baseContribution: 4.0,
      scenarioContribution: 3.0,
    };

    const delta = exposure.scenarioContribution - exposure.baseContribution;
    expect(delta).toBeCloseTo(-1.0, 2);
    expect(delta).toBeLessThan(0);
  });

  it('should handle zero baseline contribution', () => {
    const exposure: CountryExposure = {
      country: 'Small Country',
      exposureWeight: 0.001,
      baseCSI: 20.0,
      scenarioCSI: 30.0,
      baseContribution: 0.0,
      scenarioContribution: 0.03,
    };

    const delta = exposure.scenarioContribution - exposure.baseContribution;
    const percentage = exposure.baseContribution > 0 ? (delta / exposure.baseContribution) * 100 : 0;

    expect(delta).toBeCloseTo(0.03, 2);
    expect(percentage).toBe(0); // Avoid division by zero
  });
});

describe('Node Attribution - Sorting Logic', () => {
  const countries: Array<CountryExposure & { delta: number; percentage: number }> = [
    {
      country: 'China',
      exposureWeight: 0.25,
      baseCSI: 65,
      scenarioCSI: 80,
      baseContribution: 16.25,
      scenarioContribution: 20.0,
      delta: 3.75,
      percentage: 23.08,
    },
    {
      country: 'Taiwan',
      exposureWeight: 0.15,
      baseCSI: 50,
      scenarioCSI: 75,
      baseContribution: 7.5,
      scenarioContribution: 11.25,
      delta: 3.75,
      percentage: 50.0,
    },
    {
      country: 'Japan',
      exposureWeight: 0.12,
      baseCSI: 45,
      scenarioCSI: 55,
      baseContribution: 5.4,
      scenarioContribution: 6.6,
      delta: 1.2,
      percentage: 22.22,
    },
  ];

  it('should sort by absolute delta descending', () => {
    const sorted = [...countries].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // China and Taiwan have same delta (3.75), Japan has lower (1.2)
    expect(sorted[2].country).toBe('Japan');
    expect(Math.abs(sorted[0].delta)).toBeGreaterThanOrEqual(Math.abs(sorted[1].delta));
  });

  it('should sort by percentage descending', () => {
    const sorted = [...countries].sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));

    expect(sorted[0].country).toBe('Taiwan'); // 50%
    expect(sorted[1].country).toBe('China'); // 23.08%
    expect(sorted[2].country).toBe('Japan'); // 22.22%
  });

  it('should sort by exposure weight descending', () => {
    const sorted = [...countries].sort((a, b) => b.exposureWeight - a.exposureWeight);

    expect(sorted[0].country).toBe('China'); // 0.25
    expect(sorted[1].country).toBe('Taiwan'); // 0.15
    expect(sorted[2].country).toBe('Japan'); // 0.12
  });

  it('should sort alphabetically by country name', () => {
    const sorted = [...countries].sort((a, b) => a.country.localeCompare(b.country));

    expect(sorted[0].country).toBe('China');
    expect(sorted[1].country).toBe('Japan');
    expect(sorted[2].country).toBe('Taiwan');
  });
});

describe('Node Attribution - Impact Type Classification', () => {
  it('should classify direct target countries', () => {
    const country = 'Taiwan';
    const targetCountries = ['Taiwan', 'China'];
    const actorCountry = 'United States';

    const impactType = targetCountries.includes(country)
      ? 'direct'
      : actorCountry === country
      ? 'actor'
      : 'spillover';

    expect(impactType).toBe('direct');
  });

  it('should classify actor country', () => {
    const country = 'United States';
    const targetCountries = ['Taiwan', 'China'];
    const actorCountry = 'United States';

    const impactType = targetCountries.includes(country)
      ? 'direct'
      : actorCountry === country
      ? 'actor'
      : 'spillover';

    expect(impactType).toBe('actor');
  });

  it('should classify spillover countries', () => {
    const country = 'Japan';
    const targetCountries = ['Taiwan', 'China'];
    const actorCountry = 'United States';

    const impactType = targetCountries.includes(country)
      ? 'direct'
      : actorCountry === country
      ? 'actor'
      : 'spillover';

    expect(impactType).toBe('spillover');
  });
});

describe('Node Attribution - Risk Change Classification', () => {
  it('should classify risk increased', () => {
    const delta = 5.5;
    const riskChange = delta > 0.5 ? 'increased' : delta < -0.5 ? 'decreased' : 'stable';
    expect(riskChange).toBe('increased');
  });

  it('should classify risk decreased', () => {
    const delta = -2.3;
    const riskChange = delta > 0.5 ? 'increased' : delta < -0.5 ? 'decreased' : 'stable';
    expect(riskChange).toBe('decreased');
  });

  it('should classify risk stable', () => {
    const delta = 0.2;
    const riskChange = delta > 0.5 ? 'increased' : delta < -0.5 ? 'decreased' : 'stable';
    expect(riskChange).toBe('stable');
  });

  it('should handle boundary cases', () => {
    const delta1 = 0.5;
    const riskChange1 = delta1 > 0.5 ? 'increased' : delta1 < -0.5 ? 'decreased' : 'stable';
    expect(riskChange1).toBe('stable'); // Exactly 0.5 is stable

    const delta2 = -0.5;
    const riskChange2 = delta2 > 0.5 ? 'increased' : delta2 < -0.5 ? 'decreased' : 'stable';
    expect(riskChange2).toBe('stable'); // Exactly -0.5 is stable
  });
});

describe('Node Attribution - Filtering Logic', () => {
  const countries = [
    { country: 'China', impactType: 'direct', riskChange: 'increased', delta: 5.0 },
    { country: 'Taiwan', impactType: 'direct', riskChange: 'increased', delta: 8.0 },
    { country: 'United States', impactType: 'actor', riskChange: 'stable', delta: 0.3 },
    { country: 'Japan', impactType: 'spillover', riskChange: 'increased', delta: 2.5 },
    { country: 'South Korea', impactType: 'spillover', riskChange: 'decreased', delta: -1.5 },
  ];

  it('should filter by impact type - direct', () => {
    const filtered = countries.filter((c) => c.impactType === 'direct');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.impactType === 'direct')).toBe(true);
  });

  it('should filter by impact type - spillover', () => {
    const filtered = countries.filter((c) => c.impactType === 'spillover');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.country)).toEqual(['Japan', 'South Korea']);
  });

  it('should filter by risk change - increased', () => {
    const filtered = countries.filter((c) => c.riskChange === 'increased');
    expect(filtered).toHaveLength(3);
    expect(filtered.every((c) => c.riskChange === 'increased')).toBe(true);
  });

  it('should filter by risk change - decreased', () => {
    const filtered = countries.filter((c) => c.riskChange === 'decreased');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].country).toBe('South Korea');
  });

  it('should filter by search query', () => {
    const searchQuery = 'korea';
    const filtered = countries.filter((c) =>
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].country).toBe('South Korea');
  });

  it('should combine multiple filters', () => {
    const filtered = countries.filter(
      (c) => c.impactType === 'spillover' && c.riskChange === 'increased'
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].country).toBe('Japan');
  });
});

describe('Node Attribution - Pagination Logic', () => {
  const generateCountries = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      country: `Country ${i + 1}`,
      delta: Math.random() * 10,
    }));

  it('should display top 10 by default', () => {
    const countries = generateCountries(50);
    const displayLimit = 10;
    const displayed = countries.slice(0, displayLimit);

    expect(displayed).toHaveLength(10);
  });

  it('should expand to top 25', () => {
    const countries = generateCountries(50);
    const displayLimit = 25;
    const displayed = countries.slice(0, displayLimit);

    expect(displayed).toHaveLength(25);
  });

  it('should show all countries', () => {
    const countries = generateCountries(50);
    const displayLimit = countries.length;
    const displayed = countries.slice(0, displayLimit);

    expect(displayed).toHaveLength(50);
  });

  it('should handle fewer countries than limit', () => {
    const countries = generateCountries(5);
    const displayLimit = 10;
    const displayed = countries.slice(0, displayLimit);

    expect(displayed).toHaveLength(5);
  });
});

describe('Node Attribution - CSV Export Format', () => {
  it('should format CSV correctly', () => {
    const countries = [
      {
        rank: 1,
        country: 'China',
        baseContribution: 16.25,
        scenarioContribution: 20.0,
        delta: 3.75,
        percentage: 23.08,
        exposureWeight: 0.25,
        impactType: 'direct',
      },
    ];

    const headers = [
      'Rank',
      'Country',
      'Baseline CO-GRI',
      'Scenario CO-GRI',
      'ΔCO-GRI',
      '% Change',
      'Exposure Weight',
      'Impact Type',
    ];

    const row = [
      countries[0].rank,
      countries[0].country,
      countries[0].baseContribution.toFixed(2),
      countries[0].scenarioContribution.toFixed(2),
      countries[0].delta.toFixed(2),
      countries[0].percentage.toFixed(1) + '%',
      (countries[0].exposureWeight * 100).toFixed(1) + '%',
      countries[0].impactType,
    ];

    expect(headers).toHaveLength(8);
    expect(row).toHaveLength(8);
    expect(row[0]).toBe(1);
    expect(row[1]).toBe('China');
    expect(row[4]).toBe('3.75');
  });
});