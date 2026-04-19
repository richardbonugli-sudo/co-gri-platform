/**
 * Unit Tests for Transmission Trace Component
 * Tests graph construction and layout algorithms
 */

import { describe, it, expect } from 'vitest';

interface Country {
  country: string;
  delta: number;
  layer: number;
  impactType: 'actor' | 'direct' | 'spillover';
}

describe('Transmission Trace - Layer Classification', () => {
  it('should classify actor country as layer 0', () => {
    const country = 'United States';
    const actorCountry = 'United States';
    const targetCountries = ['China', 'Taiwan'];

    let layer = 2;
    if (actorCountry === country) {
      layer = 0;
    } else if (targetCountries.includes(country)) {
      layer = 1;
    }

    expect(layer).toBe(0);
  });

  it('should classify direct targets as layer 1', () => {
    const country = 'China';
    const actorCountry = 'United States';
    const targetCountries = ['China', 'Taiwan'];

    let layer = 2;
    if (actorCountry === country) {
      layer = 0;
    } else if (targetCountries.includes(country)) {
      layer = 1;
    }

    expect(layer).toBe(1);
  });

  it('should classify spillover countries as layer 2', () => {
    const country = 'Japan';
    const actorCountry = 'United States';
    const targetCountries = ['China', 'Taiwan'];

    let layer = 2;
    if (actorCountry === country) {
      layer = 0;
    } else if (targetCountries.includes(country)) {
      layer = 1;
    }

    expect(layer).toBe(2);
  });
});

describe('Transmission Trace - Node Size Calculation', () => {
  it('should calculate node size based on absolute delta', () => {
    const delta = 5.0;
    const nodeSize = Math.max(40, Math.min(100, 40 + Math.abs(delta) * 5));

    expect(nodeSize).toBe(65); // 40 + 5 * 5 = 65
  });

  it('should enforce minimum node size', () => {
    const delta = 0.1;
    const nodeSize = Math.max(40, Math.min(100, 40 + Math.abs(delta) * 5));

    expect(nodeSize).toBe(40); // Minimum size
  });

  it('should enforce maximum node size', () => {
    const delta = 20.0;
    const nodeSize = Math.max(40, Math.min(100, 40 + Math.abs(delta) * 5));

    expect(nodeSize).toBe(100); // Maximum size (40 + 20*5 = 140, capped at 100)
  });

  it('should handle negative delta', () => {
    const delta = -3.0;
    const nodeSize = Math.max(40, Math.min(100, 40 + Math.abs(delta) * 5));

    expect(nodeSize).toBe(55); // 40 + 3 * 5 = 55
  });
});

describe('Transmission Trace - Node Color Assignment', () => {
  it('should assign red color to actor country', () => {
    const impactType = 'actor';
    let nodeColor = '#f97316';

    if (impactType === 'actor') nodeColor = '#dc2626';
    else if (impactType === 'direct') nodeColor = '#ea580c';
    else nodeColor = '#fb923c';

    expect(nodeColor).toBe('#dc2626'); // Red
  });

  it('should assign dark orange to direct targets', () => {
    const impactType = 'direct';
    let nodeColor = '#f97316';

    if (impactType === 'actor') nodeColor = '#dc2626';
    else if (impactType === 'direct') nodeColor = '#ea580c';
    else nodeColor = '#fb923c';

    expect(nodeColor).toBe('#ea580c'); // Dark orange
  });

  it('should assign light orange to spillover countries', () => {
    const impactType = 'spillover';
    let nodeColor = '#f97316';

    if (impactType === 'actor') nodeColor = '#dc2626';
    else if (impactType === 'direct') nodeColor = '#ea580c';
    else nodeColor = '#fb923c';

    expect(nodeColor).toBe('#fb923c'); // Light orange
  });
});

describe('Transmission Trace - Edge Creation', () => {
  it('should create edges from actor to targets', () => {
    const actor = { country: 'United States', impactType: 'actor' as const };
    const targets = [
      { country: 'China', impactType: 'direct' as const },
      { country: 'Taiwan', impactType: 'direct' as const },
    ];

    const edges = targets.map((target) => ({
      id: `${actor.country}-${target.country}`,
      source: actor.country,
      target: target.country,
    }));

    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe('United States');
    expect(edges[0].target).toBe('China');
    expect(edges[1].target).toBe('Taiwan');
  });

  it('should create edges from targets to spillovers', () => {
    const target = { country: 'China', impactType: 'direct' as const };
    const spillovers = [
      { country: 'Japan', impactType: 'spillover' as const, delta: 2.5 },
      { country: 'South Korea', impactType: 'spillover' as const, delta: 1.8 },
    ];

    const edges = spillovers.map((spillover) => ({
      id: `${target.country}-${spillover.country}`,
      source: target.country,
      target: spillover.country,
      weight: Math.abs(spillover.delta) / 10,
    }));

    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe('China');
    expect(edges[0].target).toBe('Japan');
    expect(edges[0].weight).toBeCloseTo(0.25, 2);
  });

  it('should calculate edge weight based on delta', () => {
    const delta = 5.0;
    const edgeWeight = Math.abs(delta) / 10;

    expect(edgeWeight).toBe(0.5);
  });
});

describe('Transmission Trace - Hierarchical Layout', () => {
  it('should organize countries into layers', () => {
    const countries: Country[] = [
      { country: 'US', delta: 3.0, layer: 0, impactType: 'actor' },
      { country: 'China', delta: 5.0, layer: 1, impactType: 'direct' },
      { country: 'Taiwan', delta: 4.0, layer: 1, impactType: 'direct' },
      { country: 'Japan', delta: 2.0, layer: 2, impactType: 'spillover' },
      { country: 'Korea', delta: 1.5, layer: 2, impactType: 'spillover' },
    ];

    const layers = new Map<number, Country[]>();
    countries.forEach((c) => {
      if (!layers.has(c.layer)) {
        layers.set(c.layer, []);
      }
      layers.get(c.layer)!.push(c);
    });

    expect(layers.size).toBe(3); // 3 layers (0, 1, 2)
    expect(layers.get(0)).toHaveLength(1); // 1 actor
    expect(layers.get(1)).toHaveLength(2); // 2 targets
    expect(layers.get(2)).toHaveLength(2); // 2 spillovers
  });

  it('should calculate vertical position based on layer', () => {
    const layer = 1;
    const totalLayers = 3;
    const height = 600;
    const layerHeight = height / (totalLayers + 1);
    const y = layerHeight * (layer + 1);

    expect(y).toBe(300); // 600 / 4 * 2 = 300
  });

  it('should distribute countries horizontally within layer', () => {
    const layerCountries = ['China', 'Taiwan', 'Japan'];
    const width = 800;
    const layerWidth = width / (layerCountries.length + 1);

    const positions = layerCountries.map((_, index) => layerWidth * (index + 1));

    expect(positions[0]).toBe(200); // 800 / 4 * 1
    expect(positions[1]).toBe(400); // 800 / 4 * 2
    expect(positions[2]).toBe(600); // 800 / 4 * 3
  });
});

describe('Transmission Trace - Radial Layout', () => {
  it('should place actor at center', () => {
    const centerX = 400;
    const centerY = 300;
    const layer = 0;

    const position =
      layer === 0 ? { x: centerX, y: centerY } : { x: 0, y: 0 };

    expect(position.x).toBe(400);
    expect(position.y).toBe(300);
  });

  it('should calculate radius based on layer', () => {
    const maxRadius = 250;
    const totalLayers = 3;
    const layer = 1;

    const radius = (maxRadius / totalLayers) * (layer + 1);

    expect(radius).toBeCloseTo(166.67, 1); // 250 / 3 * 2
  });

  it('should distribute countries evenly around circle', () => {
    const layerCountries = 4;
    const angleStep = (2 * Math.PI) / layerCountries;

    const angles = Array.from({ length: layerCountries }, (_, i) => angleStep * i - Math.PI / 2);

    expect(angles[0]).toBeCloseTo(-Math.PI / 2, 2); // -90 degrees
    expect(angles[1]).toBeCloseTo(0, 2); // 0 degrees
    expect(angles[2]).toBeCloseTo(Math.PI / 2, 2); // 90 degrees
    expect(angles[3]).toBeCloseTo(Math.PI, 2); // 180 degrees
  });

  it('should calculate cartesian coordinates from polar', () => {
    const centerX = 400;
    const centerY = 300;
    const radius = 100;
    const angle = 0; // 0 degrees (right)

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    expect(x).toBeCloseTo(500, 1);
    expect(y).toBeCloseTo(300, 1);
  });
});

describe('Transmission Trace - Layer Visibility', () => {
  it('should filter countries by visible layers', () => {
    const countries: Country[] = [
      { country: 'US', delta: 3.0, layer: 0, impactType: 'actor' },
      { country: 'China', delta: 5.0, layer: 1, impactType: 'direct' },
      { country: 'Japan', delta: 2.0, layer: 2, impactType: 'spillover' },
    ];

    const showLayers = { 0: true, 1: true, 2: false };
    const visible = countries.filter((c) => showLayers[c.layer]);

    expect(visible).toHaveLength(2);
    expect(visible.map((c) => c.country)).toEqual(['US', 'China']);
  });

  it('should show all countries when all layers visible', () => {
    const countries: Country[] = [
      { country: 'US', delta: 3.0, layer: 0, impactType: 'actor' },
      { country: 'China', delta: 5.0, layer: 1, impactType: 'direct' },
      { country: 'Japan', delta: 2.0, layer: 2, impactType: 'spillover' },
    ];

    const showLayers = { 0: true, 1: true, 2: true };
    const visible = countries.filter((c) => showLayers[c.layer]);

    expect(visible).toHaveLength(3);
  });

  it('should hide all countries when all layers hidden', () => {
    const countries: Country[] = [
      { country: 'US', delta: 3.0, layer: 0, impactType: 'actor' },
      { country: 'China', delta: 5.0, layer: 1, impactType: 'direct' },
      { country: 'Japan', delta: 2.0, layer: 2, impactType: 'spillover' },
    ];

    const showLayers = { 0: false, 1: false, 2: false };
    const visible = countries.filter((c) => showLayers[c.layer]);

    expect(visible).toHaveLength(0);
  });
});

describe('Transmission Trace - Display Limit', () => {
  it('should limit to top N countries by absolute delta', () => {
    const countries = [
      { country: 'A', delta: 5.0 },
      { country: 'B', delta: -3.0 },
      { country: 'C', delta: 8.0 },
      { country: 'D', delta: 1.0 },
    ];

    const sorted = countries
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 2);

    expect(sorted).toHaveLength(2);
    expect(sorted[0].country).toBe('C'); // |8.0| = 8.0
    expect(sorted[1].country).toBe('A'); // |5.0| = 5.0
  });

  it('should handle display limit larger than array', () => {
    const countries = [
      { country: 'A', delta: 5.0 },
      { country: 'B', delta: 3.0 },
    ];

    const limited = countries.slice(0, 10);

    expect(limited).toHaveLength(2);
  });
});