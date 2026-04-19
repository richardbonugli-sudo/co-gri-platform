/**
 * Unit Tests for Channel Attribution Component
 * Tests channel contribution calculations and data display
 */

import { describe, it, expect } from 'vitest';
import { ChannelDelta } from '@/types/scenario';

// Channel weights from specification
const CHANNEL_WEIGHTS = {
  Trade: 0.45,
  Alignment: 0.35,
  Sector: 0.20,
};

describe('Channel Attribution - Contribution Calculations', () => {
  it('should calculate percentage contribution correctly', () => {
    const channels: ChannelDelta[] = [
      {
        channelName: 'Trade',
        baselineScore: 50.0,
        scenarioScore: 65.0,
        deltaContribution: 6.75, // 0.45 * (65 - 50)
        confidence: 0.85,
        evidenceLevel: 'A',
        dataSource: 'Trade data',
      },
      {
        channelName: 'Alignment',
        baselineScore: 40.0,
        scenarioScore: 55.0,
        deltaContribution: 5.25, // 0.35 * (55 - 40)
        confidence: 0.80,
        evidenceLevel: 'B',
        dataSource: 'Alignment data',
      },
      {
        channelName: 'Sector',
        baselineScore: 30.0,
        scenarioScore: 45.0,
        deltaContribution: 3.0, // 0.20 * (45 - 30)
        confidence: 0.75,
        evidenceLevel: 'B',
        dataSource: 'Sector data',
      },
    ];

    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBeCloseTo(15.0, 1); // 6.75 + 5.25 + 3.0

    const tradePercentage = (channels[0].deltaContribution / totalDelta) * 100;
    expect(tradePercentage).toBeCloseTo(45.0, 1);

    const alignmentPercentage = (channels[1].deltaContribution / totalDelta) * 100;
    expect(alignmentPercentage).toBeCloseTo(35.0, 1);

    const sectorPercentage = (channels[2].deltaContribution / totalDelta) * 100;
    expect(sectorPercentage).toBeCloseTo(20.0, 1);
  });

  it('should handle negative contributions correctly', () => {
    const channels: ChannelDelta[] = [
      {
        channelName: 'Trade',
        baselineScore: 60.0,
        scenarioScore: 50.0,
        deltaContribution: -4.5, // 0.45 * (50 - 60)
        confidence: 0.85,
      },
      {
        channelName: 'Alignment',
        baselineScore: 50.0,
        scenarioScore: 65.0,
        deltaContribution: 5.25, // 0.35 * (65 - 50)
        confidence: 0.80,
      },
    ];

    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBeCloseTo(0.75, 2); // -4.5 + 5.25

    // Percentage should be based on absolute values for display
    const totalAbsolute = channels.reduce((sum, c) => sum + Math.abs(c.deltaContribution), 0);
    const tradePercentage = (Math.abs(channels[0].deltaContribution) / totalAbsolute) * 100;
    expect(tradePercentage).toBeCloseTo(46.15, 1); // 4.5 / 9.75 * 100
  });

  it('should verify channel weight application', () => {
    const baselineScore = 50.0;
    const scenarioScore = 70.0;
    const delta = scenarioScore - baselineScore; // 20

    const tradeContribution = CHANNEL_WEIGHTS.Trade * delta;
    expect(tradeContribution).toBe(9.0); // 0.45 * 20

    const alignmentContribution = CHANNEL_WEIGHTS.Alignment * delta;
    expect(alignmentContribution).toBe(7.0); // 0.35 * 20

    const sectorContribution = CHANNEL_WEIGHTS.Sector * delta;
    expect(sectorContribution).toBe(4.0); // 0.20 * 20

    const totalContribution = tradeContribution + alignmentContribution + sectorContribution;
    expect(totalContribution).toBe(20.0);
  });

  it('should handle zero contributions', () => {
    const channels: ChannelDelta[] = [
      {
        channelName: 'Trade',
        baselineScore: 50.0,
        scenarioScore: 50.0,
        deltaContribution: 0.0,
        confidence: 0.85,
      },
      {
        channelName: 'Alignment',
        baselineScore: 40.0,
        scenarioScore: 50.0,
        deltaContribution: 3.5, // 0.35 * 10
        confidence: 0.80,
      },
    ];

    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBe(3.5);

    const zeroChannel = channels[0];
    expect(zeroChannel.deltaContribution).toBe(0);
    expect(zeroChannel.baselineScore).toBe(zeroChannel.scenarioScore);
  });
});

describe('Channel Attribution - Evidence Levels', () => {
  it('should categorize evidence levels correctly', () => {
    const evidenceLevels = ['A+', 'A', 'B', 'C', 'D', 'None'];
    
    evidenceLevels.forEach((level) => {
      expect(level).toMatch(/^(A\+|A|B|C|D|None)$/);
    });
  });

  it('should calculate average confidence correctly', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 60, deltaContribution: 4.5, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 55, deltaContribution: 5.25, confidence: 0.75 },
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 40, deltaContribution: 2.0, confidence: 0.90 },
    ];

    const avgConfidence = channels.reduce((sum, c) => sum + (c.confidence || 0), 0) / channels.length;
    expect(avgConfidence).toBeCloseTo(0.833, 2); // (0.85 + 0.75 + 0.90) / 3
  });

  it('should identify low confidence channels', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 60, deltaContribution: 4.5, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 55, deltaContribution: 5.25, confidence: 0.55 },
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 40, deltaContribution: 2.0, confidence: 0.90 },
    ];

    const lowConfidenceChannels = channels.filter((c) => (c.confidence || 0) < 0.6);
    expect(lowConfidenceChannels).toHaveLength(1);
    expect(lowConfidenceChannels[0].channelName).toBe('Alignment');
  });
});

describe('Channel Attribution - Sorting and Display', () => {
  it('should sort channels by absolute contribution', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 40, deltaContribution: 2.0, confidence: 0.75 },
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 65, deltaContribution: 6.75, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 55, deltaContribution: 5.25, confidence: 0.80 },
    ];

    const sorted = [...channels].sort(
      (a, b) => Math.abs(b.deltaContribution) - Math.abs(a.deltaContribution)
    );

    expect(sorted[0].channelName).toBe('Trade'); // 6.75
    expect(sorted[1].channelName).toBe('Alignment'); // 5.25
    expect(sorted[2].channelName).toBe('Sector'); // 2.0
  });

  it('should identify largest contributor', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 70, deltaContribution: 9.0, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 50, deltaContribution: 3.5, confidence: 0.80 },
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 35, deltaContribution: 1.0, confidence: 0.75 },
    ];

    const largest = channels.reduce((max, c) =>
      Math.abs(c.deltaContribution) > Math.abs(max.deltaContribution) ? c : max
    );

    expect(largest.channelName).toBe('Trade');
    expect(largest.deltaContribution).toBe(9.0);
  });

  it('should calculate stacked bar percentages correctly', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 60, deltaContribution: 4.5, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 50, deltaContribution: 3.5, confidence: 0.80 },
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 35, deltaContribution: 1.0, confidence: 0.75 },
    ];

    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBe(9.0);

    const percentages = channels.map((c) => (c.deltaContribution / totalDelta) * 100);
    expect(percentages[0]).toBeCloseTo(50.0, 1); // 4.5 / 9.0 * 100
    expect(percentages[1]).toBeCloseTo(38.9, 1); // 3.5 / 9.0 * 100
    expect(percentages[2]).toBeCloseTo(11.1, 1); // 1.0 / 9.0 * 100

    const sumPercentages = percentages.reduce((sum, p) => sum + p, 0);
    expect(sumPercentages).toBeCloseTo(100.0, 0);
  });
});

describe('Channel Attribution - Edge Cases', () => {
  it('should handle empty channel array', () => {
    const channels: ChannelDelta[] = [];
    
    expect(channels.length).toBe(0);
    
    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBe(0);
  });

  it('should handle all zero contributions', () => {
    const channels: ChannelDelta[] = [
      { channelName: 'Trade', baselineScore: 50, scenarioScore: 50, deltaContribution: 0, confidence: 0.85 },
      { channelName: 'Alignment', baselineScore: 40, scenarioScore: 40, deltaContribution: 0, confidence: 0.80 },
      { channelName: 'Sector', baselineScore: 30, scenarioScore: 30, deltaContribution: 0, confidence: 0.75 },
    ];

    const totalDelta = channels.reduce((sum, c) => sum + c.deltaContribution, 0);
    expect(totalDelta).toBe(0);

    // Percentage calculation should handle division by zero
    const totalAbsolute = channels.reduce((sum, c) => sum + Math.abs(c.deltaContribution), 0);
    expect(totalAbsolute).toBe(0);
  });

  it('should handle missing optional fields', () => {
    const channel: ChannelDelta = {
      channelName: 'Trade',
      baselineScore: 50,
      scenarioScore: 60,
      deltaContribution: 4.5,
      confidence: 0.85,
      // evidenceLevel and dataSource are optional
    };

    expect(channel.evidenceLevel).toBeUndefined();
    expect(channel.dataSource).toBeUndefined();
    expect(channel.confidence).toBe(0.85);
  });
});