/**
 * CSI Engine Demo
 * Demonstrates the complete workflow from signal ingestion to CSI calculation
 */

import { csiEngineOrchestrator } from '../CSIEngineOrchestrator';
import { 
  EscalationSignal, 
  SourceTier, 
  RiskVector, 
  EscalationLevel 
} from '../types';

/**
 * Demo: Complete CSI Engine Workflow
 */
export async function runCSIEngineDemo(): Promise<void> {
  console.log('=== CSI Engine Demo ===\n');

  // Step 1: Initialize engine
  console.log('1. Initializing CSI Engine...');
  const countries = ['CHN', 'JPN', 'KOR', 'TWN', 'VNM', 'THA', 'SGP', 'MYS'];
  await csiEngineOrchestrator.initialize(countries);
  console.log('✓ Engine initialized\n');

  // Step 2: Get initial CSI scores
  console.log('2. Initial CSI Scores:');
  for (const country of ['CHN', 'JPN', 'KOR']) {
    const score = await csiEngineOrchestrator.getCSIScore(country);
    console.log(`   ${country}: ${score.compositeScore.toFixed(2)} (baseline)`);
  }
  console.log();

  // Step 3: Simulate incoming signals
  console.log('3. Processing escalation signals...');
  
  // Signal 1: Political unrest in China (Tier 1 source)
  const signal1: EscalationSignal = {
    signalId: 'sig_001',
    timestamp: new Date(),
    sourceId: 'freedom_house',
    sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
    country: 'CHN',
    vector: RiskVector.POLITICAL,
    escalationLevel: EscalationLevel.HIGH,
    rawContent: 'Significant political tensions detected',
    confidence: 0.92,
    metadata: {
      headline: 'Political Risk Assessment Update',
      url: 'https://example.com/report',
      publicationDate: new Date()
    }
  };

  const result1 = await csiEngineOrchestrator.processSignal(signal1);
  console.log(`   Signal 1: ${result1.signalId}`);
  console.log(`   - Candidate created: ${result1.candidateCreated}`);
  console.log(`   - Validated: ${result1.validated}`);
  console.log();

  // Signal 2: Corroborating signal from different source
  const signal2: EscalationSignal = {
    signalId: 'sig_002',
    timestamp: new Date(),
    sourceId: 'reuters',
    sourceTier: SourceTier.TIER_2_REPUTABLE,
    country: 'CHN',
    vector: RiskVector.POLITICAL,
    escalationLevel: EscalationLevel.HIGH,
    rawContent: 'Confirming political developments',
    confidence: 0.88,
    metadata: {
      headline: 'Political Situation Analysis',
      url: 'https://example.com/news',
      publicationDate: new Date()
    }
  };

  const result2 = await csiEngineOrchestrator.processSignal(signal2);
  console.log(`   Signal 2: ${result2.signalId}`);
  console.log(`   - Candidate created: ${result2.candidateCreated}`);
  console.log(`   - Validated: ${result2.validated}`);
  console.log();

  // Signal 3: Economic signal for Japan
  const signal3: EscalationSignal = {
    signalId: 'sig_003',
    timestamp: new Date(),
    sourceId: 'imf_weo',
    sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
    country: 'JPN',
    vector: RiskVector.ECONOMIC,
    escalationLevel: EscalationLevel.MODERATE,
    rawContent: 'Economic indicators showing stress',
    confidence: 0.90,
    metadata: {
      headline: 'Economic Outlook Update',
      publicationDate: new Date()
    }
  };

  const result3 = await csiEngineOrchestrator.processSignal(signal3);
  console.log(`   Signal 3: ${result3.signalId}`);
  console.log(`   - Candidate created: ${result3.candidateCreated}`);
  console.log(`   - Validated: ${result3.validated}`);
  console.log();

  // Signal 4: Corroborating economic signal for Japan
  const signal4: EscalationSignal = {
    signalId: 'sig_004',
    timestamp: new Date(),
    sourceId: 'ft',
    sourceTier: SourceTier.TIER_2_REPUTABLE,
    country: 'JPN',
    vector: RiskVector.ECONOMIC,
    escalationLevel: EscalationLevel.MODERATE,
    rawContent: 'Economic concerns confirmed',
    confidence: 0.85,
    metadata: {
      headline: 'Japan Economic Analysis',
      url: 'https://example.com/article',
      publicationDate: new Date()
    }
  };

  const result4 = await csiEngineOrchestrator.processSignal(signal4);
  console.log(`   Signal 4: ${result4.signalId}`);
  console.log(`   - Candidate created: ${result4.candidateCreated}`);
  console.log(`   - Validated: ${result4.validated}`);
  console.log();

  // Step 4: Get updated CSI scores
  console.log('4. Updated CSI Scores (after events):');
  for (const country of ['CHN', 'JPN', 'KOR']) {
    const score = await csiEngineOrchestrator.getCSIScore(country);
    console.log(`   ${country}: ${score.compositeScore.toFixed(2)}`);
    
    // Show vector breakdown for affected countries
    if (country === 'CHN' || country === 'JPN') {
      console.log(`      Political: ${score.vectorScores[RiskVector.POLITICAL].currentScore.toFixed(2)}`);
      console.log(`      Economic: ${score.vectorScores[RiskVector.ECONOMIC].currentScore.toFixed(2)}`);
      console.log(`      Security: ${score.vectorScores[RiskVector.SECURITY].currentScore.toFixed(2)}`);
    }
  }
  console.log();

  // Step 5: System health check
  console.log('5. System Health:');
  const health = csiEngineOrchestrator.getSystemHealth();
  console.log(`   Initialized: ${health.initialized}`);
  console.log(`   Total Signals: ${health.totalSignals}`);
  console.log(`   Active Candidates: ${health.activeCandidates}`);
  console.log(`   Validated Events: ${health.validatedEvents}`);
  console.log(`   Active Countries: ${health.activeCountries}`);
  console.log(`   Avg Data Quality: ${(health.avgDataQuality * 100).toFixed(1)}%`);
  console.log();

  // Step 6: Diagnostic report
  console.log('6. Diagnostic Report:');
  const report = csiEngineOrchestrator.generateDiagnosticReport();
  console.log(JSON.stringify(report, null, 2));
  console.log();

  console.log('=== Demo Complete ===');
}

/**
 * Quick test function
 */
export async function quickTest(): Promise<void> {
  console.log('Running quick CSI Engine test...\n');

  // Initialize with minimal countries
  await csiEngineOrchestrator.initialize(['CHN', 'USA']);

  // Create and process a signal
  const signal: EscalationSignal = {
    signalId: 'test_001',
    timestamp: new Date(),
    sourceId: 'wgi',
    sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
    country: 'CHN',
    vector: RiskVector.POLITICAL,
    escalationLevel: EscalationLevel.MODERATE,
    rawContent: 'Test signal',
    confidence: 0.85,
    metadata: {}
  };

  const result = await csiEngineOrchestrator.processSignal(signal);
  console.log('Signal processed:', result);

  // Get CSI score
  const score = await csiEngineOrchestrator.getCSIScore('CHN');
  console.log('\nCSI Score for CHN:', score.compositeScore);

  // System health
  const health = csiEngineOrchestrator.getSystemHealth();
  console.log('\nSystem Health:', health);

  console.log('\n✓ Quick test complete');
}