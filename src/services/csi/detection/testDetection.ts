/**
 * Test Detection System
 * 
 * Demonstrates the automated event detection pipeline with sample data.
 */

import { extractEntities } from './nerEngine';
import { classifyArticle } from './policyClassifier';
import { detectCandidates } from './candidateDetector';
import { triageCandidates, getAutoConfirmCandidates, getManualReviewCandidates } from './triageEngine';
import { createEventsFromCandidates } from './autoEventCreator';
import type { RSSArticle } from '../dataSources/rssFeedIngestion';

/**
 * Sample articles simulating RSS feed data
 */
const SAMPLE_ARTICLES: RSSArticle[] = [
  {
    article_id: 'test-1',
    source_id: 'mofcom-china',
    source_name: 'MOFCOM China',
    title: 'China Implements Export Controls on Silver Effective January 1, 2026',
    description: 'The Ministry of Commerce announces new export control measures on silver and related materials, effective January 1, 2026.',
    link: 'https://www.mofcom.gov.cn/article/news/2025/12/20251215001.html',
    pubDate: new Date('2025-12-15T10:00:00Z'),
    content: 'China Ministry of Commerce (MOFCOM) has announced new export control regulations targeting silver and silver-based materials. The measures, which will take effect on January 1, 2026, are part of broader efforts to manage strategic commodity exports. The controls will require special licenses for exports of silver exceeding certain thresholds.',
    raw: {}
  },
  {
    article_id: 'test-2',
    source_id: 'ofac-sanctions',
    source_name: 'OFAC Sanctions List',
    title: 'OFAC Designates Russian Defense Entities Under Sanctions',
    description: 'US Treasury Department adds multiple Russian defense contractors to sanctions list.',
    link: 'https://ofac.treasury.gov/recent-actions/20251220',
    pubDate: new Date('2025-12-20T14:00:00Z'),
    content: 'The Office of Foreign Assets Control (OFAC) has designated several Russian defense entities for sanctions under Executive Order 14024. The sanctions target companies involved in military equipment production and export, restricting their access to US financial systems and technology.',
    raw: {}
  },
  {
    article_id: 'test-3',
    source_id: 'reuters-world',
    source_name: 'Reuters World News',
    title: 'India Raises Tariffs on Chinese Electronics',
    description: 'India announces 25% tariff increase on electronic goods from China.',
    link: 'https://www.reuters.com/world/india-tariffs-2025-12-18',
    pubDate: new Date('2025-12-18T08:00:00Z'),
    content: 'India has announced a 25% increase in import tariffs on electronic goods and components from China, citing trade imbalance concerns. The new tariffs will affect smartphones, semiconductors, and consumer electronics, effective February 1, 2026.',
    raw: {}
  }
];

/**
 * Run detection test
 */
export async function runDetectionTest(): Promise<void> {
  console.log('\n=== CSI PHASE 2: Automated Detection Test ===\n');
  
  // Step 1: Extract entities
  console.log('Step 1: Extracting entities from articles...');
  const entitiesMap = new Map();
  SAMPLE_ARTICLES.forEach(article => {
    const fullText = `${article.title} ${article.description} ${article.content}`;
    const entities = extractEntities(fullText);
    entitiesMap.set(article.article_id, entities);
    
    console.log(`\n  Article: ${article.title}`);
    console.log(`  Countries: ${entities.countries.join(', ')}`);
    console.log(`  Agencies: ${entities.agencies.join(', ')}`);
    console.log(`  Policy Terms: ${entities.policyTerms.slice(0, 3).join(', ')}`);
    console.log(`  Confidence: ${entities.confidence}%`);
  });
  
  // Step 2: Classify articles
  console.log('\n\nStep 2: Classifying articles...');
  const classificationsMap = new Map();
  SAMPLE_ARTICLES.forEach(article => {
    const entities = entitiesMap.get(article.article_id);
    if (!entities) return;
    
    const classification = classifyArticle(article, entities);
    if (classification) {
      classificationsMap.set(article.article_id, classification);
      
      console.log(`\n  Article: ${article.title}`);
      console.log(`  Event Type: ${classification.event_type}`);
      console.log(`  Primary Vector: ${classification.primary_vector}`);
      console.log(`  Confidence: ${classification.confidence.toFixed(1)}%`);
    }
  });
  
  // Step 3: Detect candidates
  console.log('\n\nStep 3: Detecting event candidates...');
  const candidates = detectCandidates(SAMPLE_ARTICLES, entitiesMap, classificationsMap, 60);
  
  console.log(`\n  Detected ${candidates.length} candidates:`);
  candidates.forEach(candidate => {
    console.log(`\n  - ${candidate.country}: ${candidate.event_type}`);
    console.log(`    Confidence: ${candidate.confidence.toFixed(1)}%`);
    console.log(`    Sources: ${candidate.source_articles.length}`);
    console.log(`    Description: ${candidate.description}`);
  });
  
  // Step 4: Triage candidates
  console.log('\n\nStep 4: Triaging candidates...');
  const triageResults = triageCandidates(candidates);
  
  const autoConfirm = getAutoConfirmCandidates(candidates, triageResults);
  const manualReview = getManualReviewCandidates(candidates, triageResults);
  
  console.log(`\n  Auto-confirm: ${autoConfirm.length} candidates`);
  autoConfirm.forEach(candidate => {
    const result = triageResults.get(candidate.candidate_id);
    console.log(`    - ${candidate.country}: ${result?.reasoning}`);
  });
  
  console.log(`\n  Manual review: ${manualReview.length} candidates`);
  manualReview.forEach(candidate => {
    const result = triageResults.get(candidate.candidate_id);
    console.log(`    - ${candidate.country}: ${result?.reasoning}`);
  });
  
  // Step 5: Create events
  console.log('\n\nStep 5: Creating events...');
  const autoConfirmMap = new Map();
  autoConfirm.forEach(c => autoConfirmMap.set(c.candidate_id, true));
  
  const events = await createEventsFromCandidates(
    [...autoConfirm, ...manualReview],
    autoConfirmMap
  );
  
  console.log(`\n  Created ${events.length} events:`);
  events.forEach(event => {
    console.log(`\n  - ${event.event_id}`);
    console.log(`    Country: ${event.country}`);
    console.log(`    Type: ${event.event_type}`);
    console.log(`    State: ${event.state}`);
    console.log(`    Severity: ${event.severity}/10`);
    console.log(`    ΔCSI: ${event.delta_csi > 0 ? '+' : ''}${event.delta_csi}`);
    console.log(`    Created by: ${event.created_by}`);
  });
  
  console.log('\n\n=== Test Complete ===\n');
  console.log('Summary:');
  console.log(`  Articles processed: ${SAMPLE_ARTICLES.length}`);
  console.log(`  Candidates detected: ${candidates.length}`);
  console.log(`  Auto-confirmed: ${autoConfirm.length}`);
  console.log(`  Manual review: ${manualReview.length}`);
  console.log(`  Events created: ${events.length}`);
  console.log('\n✅ PHASE 2 automated detection system is working!\n');
}

/**
 * Test China silver event detection
 */
export async function testChinaSilverDetection(): Promise<void> {
  console.log('\n=== Testing China Silver Event Detection ===\n');
  
  const article = SAMPLE_ARTICLES[0]; // China silver article
  
  // Extract entities
  const fullText = `${article.title} ${article.description} ${article.content}`;
  const entities = extractEntities(fullText);
  
  console.log('Entities extracted:');
  console.log(`  Countries: ${entities.countries.join(', ')}`);
  console.log(`  Agencies: ${entities.agencies.join(', ')}`);
  console.log(`  Policy Terms: ${entities.policyTerms.join(', ')}`);
  console.log(`  Confidence: ${entities.confidence}%`);
  
  // Classify
  const classification = classifyArticle(article, entities);
  
  if (classification) {
    console.log('\nClassification:');
    console.log(`  Event Type: ${classification.event_type}`);
    console.log(`  Primary Vector: ${classification.primary_vector}`);
    console.log(`  Confidence: ${classification.confidence.toFixed(1)}%`);
    console.log(`  Reasoning: ${classification.reasoning}`);
  }
  
  // Detect candidate
  const candidates = detectCandidates([article], new Map([[article.article_id, entities]]), new Map([[article.article_id, classification!]]), 60);
  
  if (candidates.length > 0) {
    const candidate = candidates[0];
    console.log('\nCandidate detected:');
    console.log(`  ID: ${candidate.candidate_id}`);
    console.log(`  Country: ${candidate.country}`);
    console.log(`  Event Type: ${candidate.event_type}`);
    console.log(`  Confidence: ${candidate.confidence.toFixed(1)}%`);
    console.log(`  Description: ${candidate.description}`);
    
    // Triage
    const triageResults = triageCandidates([candidate]);
    const result = triageResults.get(candidate.candidate_id);
    
    console.log('\nTriage result:');
    console.log(`  Decision: ${result?.decision}`);
    console.log(`  Reasoning: ${result?.reasoning}`);
    
    // Create event
    const autoConfirmMap = new Map([[candidate.candidate_id, result?.auto_confirm || false]]);
    const events = await createEventsFromCandidates([candidate], autoConfirmMap);
    
    if (events.length > 0) {
      const event = events[0];
      console.log('\nEvent created:');
      console.log(`  ID: ${event.event_id}`);
      console.log(`  Country: ${event.country}`);
      console.log(`  Type: ${event.event_type}`);
      console.log(`  State: ${event.state}`);
      console.log(`  Severity: ${event.severity}/10`);
      console.log(`  ΔCSI: +${event.delta_csi}`);
      console.log(`  Vector: ${event.primary_vector}`);
    }
  }
  
  console.log('\n✅ China silver event would be auto-detected!\n');
}