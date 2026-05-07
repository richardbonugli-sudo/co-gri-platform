/**
 * Apple Validation Test
 * 
 * Validates that the Strategic Forecast Baseline implementation
 * produces output matching Appendix B.1 specifications for Apple Inc.
 */

import { generateCompanyOutlook } from '../companyOutlookAggregator';
import { Channel } from '@/types/v4Types';

describe('Apple Validation - Appendix B.1 Compliance', () => {
  let appleOutlook: Awaited<ReturnType<typeof generateCompanyOutlook>>;

  beforeAll(async () => {
    console.log('\n=== Starting Apple Validation Test ===\n');
    appleOutlook = await generateCompanyOutlook('AAPL', '2026');
    console.log('\n=== Apple Outlook Generated ===\n');
  }, 30000); // 30 second timeout

  describe('1. Company Geopolitical Outlook', () => {
    test('should have correct company info', () => {
      expect(appleOutlook.companyName).toContain('Apple');
      expect(appleOutlook.ticker).toBe('AAPL');
      expect(appleOutlook.sector).toBe('Technology');
      
      console.log(`✓ Company: ${appleOutlook.companyName}`);
      console.log(`✓ Ticker: ${appleOutlook.ticker}`);
      console.log(`✓ Sector: ${appleOutlook.sector}`);
    });

    test('should have net negative or mixed impact', () => {
      expect(['negative', 'mixed']).toContain(appleOutlook.netImpact);
      console.log(`✓ Net Impact: ${appleOutlook.netImpact}`);
    });

    test('should have high confidence', () => {
      expect(appleOutlook.confidence).toBe('high');
      console.log(`✓ Confidence: ${appleOutlook.confidence}`);
    });
  });

  describe('2. Event Relevance Filtering', () => {
    test('should filter to 3-5 relevant events', () => {
      expect(appleOutlook.relevantEvents.length).toBeGreaterThanOrEqual(3);
      expect(appleOutlook.relevantEvents.length).toBeLessThanOrEqual(5);
      
      console.log(`\n✓ Filtered to ${appleOutlook.relevantEvents.length} relevant events:`);
      appleOutlook.relevantEvents.forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.event} (${(event.probability * 100).toFixed(0)}%)`);
      });
    });
  });

  describe('3. Exposure Pathways', () => {
    test('should analyze all 4 channels', () => {
      expect(appleOutlook.channelPathways.length).toBe(4);
      console.log('\n✓ All 4 channels analyzed');
    });

    test('Supply Chain should be negative', () => {
      const supplyChain = appleOutlook.channelPathways.find(p => p.channel === Channel.SUPPLY);
      expect(supplyChain).toBeDefined();
      expect(supplyChain!.impact).toBe('negative');
      
      console.log(`\n✓ Supply Chain: ${supplyChain!.impact} (${supplyChain!.severity})`);
      console.log(`  ${supplyChain!.explanation}`);
    });
  });

  describe('4. Bottom-Line Interpretation', () => {
    test('should have elevated net direction', () => {
      expect(appleOutlook.bottomLineInterpretation.netDirection).toBe('elevated');
      console.log(`\n✓ Net Direction: ${appleOutlook.bottomLineInterpretation.netDirection}`);
    });

    test('should have complete interpretation', () => {
      const fullText = appleOutlook.bottomLineInterpretation.fullText;
      expect(fullText).toContain('Apple');
      expect(fullText.toLowerCase()).toContain('baseline');
      
      console.log(`\n✓ Bottom-Line Interpretation:`);
      console.log(`  "${fullText}"`);
    });
  });

  describe('5. Overall Compliance', () => {
    test('should pass all requirements', () => {
      const compliance = {
        companyInfo: appleOutlook.companyName && appleOutlook.ticker,
        netImpact: ['negative', 'mixed'].includes(appleOutlook.netImpact),
        confidence: appleOutlook.confidence === 'high',
        eventFiltering: appleOutlook.relevantEvents.length >= 3,
        channelAnalysis: appleOutlook.channelPathways.length === 4,
        bottomLinePresent: appleOutlook.bottomLineInterpretation.fullText.length > 50
      };

      console.log('\n=== Compliance Summary ===');
      Object.entries(compliance).forEach(([key, value]) => {
        console.log(`${value ? '✓' : '✗'} ${key}: ${value ? 'PASS' : 'FAIL'}`);
      });

      const allPass = Object.values(compliance).every(v => v === true);
      console.log(`\n=== Overall: ${allPass ? 'PASS ✓' : 'FAIL ✗'} ===\n`);
      
      expect(allPass).toBe(true);
    });
  });
});
