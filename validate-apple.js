/**
 * Apple Validation Script
 * 
 * Standalone validation that doesn't require test framework
 */

import { generateCompanyOutlook } from './src/services/forecast/companyOutlookAggregator.js';
import { Channel } from './src/types/v4Types.js';

console.log('\n=== APPLE VALIDATION TEST ===\n');
console.log('Starting validation for Apple Inc. (AAPL)...\n');

try {
  const appleOutlook = await generateCompanyOutlook('AAPL', '2026');
  
  console.log('=== 1. COMPANY GEOPOLITICAL OUTLOOK ===');
  console.log(`Company: ${appleOutlook.companyName}`);
  console.log(`Ticker: ${appleOutlook.ticker}`);
  console.log(`Sector: ${appleOutlook.sector}`);
  console.log(`Net Impact: ${appleOutlook.netImpact}`);
  console.log(`Confidence: ${appleOutlook.confidence}`);
  console.log(`Horizon: ${appleOutlook.horizon}`);
  console.log(`\nNarrative Summary:\n"${appleOutlook.narrativeSummary}"`);
  
  console.log('\n=== 2. EVENT RELEVANCE FILTERING ===');
  console.log(`Filtered to ${appleOutlook.relevantEvents.length} relevant events:\n`);
  appleOutlook.relevantEvents.forEach((event, i) => {
    console.log(`${i + 1}. ${event.event}`);
    console.log(`   Probability: ${(event.probability * 100).toFixed(0)}%`);
    console.log(`   Relevance Score: ${(event.relevanceScore * 100).toFixed(0)}%`);
    console.log(`   Reasons: ${event.relevanceReasons.join('; ')}`);
    console.log('');
  });
  
  console.log('=== 3. EXPOSURE PATHWAYS ===\n');
  appleOutlook.channelPathways.forEach(pathway => {
    console.log(`${pathway.channel}: ${pathway.impact.toUpperCase()} (${pathway.severity})`);
    console.log(`  ${pathway.explanation}`);
    console.log('');
  });
  
  console.log('=== 4. BOTTOM-LINE INTERPRETATION ===');
  console.log(`Net Direction: ${appleOutlook.bottomLineInterpretation.netDirection}`);
  console.log(`Primary Driver: ${appleOutlook.bottomLineInterpretation.primaryDriver}`);
  console.log(`Primary Channel: ${appleOutlook.bottomLineInterpretation.primaryChannel}`);
  console.log(`Offsets: ${appleOutlook.bottomLineInterpretation.offsets.join(', ') || 'None'}`);
  console.log(`Conclusion: ${appleOutlook.bottomLineInterpretation.conclusion}`);
  console.log(`\nFull Text:\n"${appleOutlook.bottomLineInterpretation.fullText}"`);
  
  console.log('\n=== 5. QUANTITATIVE SUPPORT ===');
  console.log(`Structural CO-GRI: ${appleOutlook.quantitativeSupport.structuralCOGRI}`);
  console.log(`Forecast-adjusted CO-GRI: ${appleOutlook.quantitativeSupport.forecastAdjustedCOGRI}`);
  console.log(`Directional Change: ${appleOutlook.quantitativeSupport.directionalChange}`);
  console.log('\nChannel Contributions:');
  Object.entries(appleOutlook.quantitativeSupport.channelContributions).forEach(([channel, value]) => {
    console.log(`  ${channel}: ${value.toFixed(1)}%`);
  });
  
  console.log('\n=== 6. COMPLIANCE CHECK ===');
  const checks = {
    'Company name contains Apple': appleOutlook.companyName.includes('Apple'),
    'Ticker is AAPL': appleOutlook.ticker === 'AAPL',
    'Sector is Technology': appleOutlook.sector === 'Technology',
    'Net impact is negative or mixed': ['negative', 'mixed'].includes(appleOutlook.netImpact),
    'Confidence is high': appleOutlook.confidence === 'high',
    'Filtered to 3-5 events': appleOutlook.relevantEvents.length >= 3 && appleOutlook.relevantEvents.length <= 5,
    'All 4 channels analyzed': appleOutlook.channelPathways.length === 4,
    'Supply Chain is negative': appleOutlook.channelPathways.find(p => p.channel === Channel.SUPPLY)?.impact === 'negative',
    'Net direction is elevated': appleOutlook.bottomLineInterpretation.netDirection === 'elevated',
    'Bottom-line interpretation present': appleOutlook.bottomLineInterpretation.fullText.length > 50,
    'Quantitative support present': appleOutlook.quantitativeSupport !== undefined
  };
  
  let passCount = 0;
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
    if (passed) passCount++;
  });
  
  const totalChecks = Object.keys(checks).length;
  console.log(`\n=== RESULT: ${passCount}/${totalChecks} checks passed ===`);
  
  if (passCount === totalChecks) {
    console.log('\n🎉 ALL CHECKS PASSED - Implementation matches Appendix B.1 specifications!\n');
  } else {
    console.log(`\n⚠️  ${totalChecks - passCount} checks failed - Review implementation\n`);
  }
  
  console.log('=== COMPARISON WITH APPENDIX B.1 ===\n');
  console.log('EXPECTED (Appendix B.1):');
  console.log('  Net Impact: Mixed / Net Negative');
  console.log('  Confidence: High');
  console.log('  Supply Chain: Negative (High)');
  console.log('  Bottom Line: "Apple\'s geopolitical risk exposure is elevated..."');
  console.log('\nACTUAL (Generated):');
  console.log(`  Net Impact: ${appleOutlook.netImpact}`);
  console.log(`  Confidence: ${appleOutlook.confidence}`);
  const supplyChain = appleOutlook.channelPathways.find(p => p.channel === Channel.SUPPLY);
  console.log(`  Supply Chain: ${supplyChain?.impact} (${supplyChain?.severity})`);
  console.log(`  Bottom Line: "${appleOutlook.bottomLineInterpretation.fullText.substring(0, 50)}..."`);
  
  console.log('\n=== VALIDATION COMPLETE ===\n');
  
} catch (error) {
  console.error('\n❌ ERROR during validation:');
  console.error(error);
  process.exit(1);
}
